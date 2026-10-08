import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bot, Check, MessageSquare, MoreHorizontal, Pin, PinOff, Plus, Send, Square,
  Trash2, X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Conversation, ConversationContent, ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from "@/components/ai-elements/tool";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  title: string;
  pinned: boolean;
  updated_at: string;
};

type SavedMessage = {
  message_id: string;
  role: string;
  parts: unknown;
};

const toolTitles: Record<string, string> = {
  list_projects: "Checking projects",
  project_summary: "Building project summary",
  production_records: "Checking production records",
  production_history: "Reviewing production history",
};

function readableError(error: Error) {
  const message = error.message || "";
  try {
    const body = JSON.parse(message) as { error?: string; message?: string };
    if (body.error || body.message) return body.error ?? body.message ?? "The assistant could not reply.";
  } catch {
    // SDK errors are not always JSON responses.
  }
  if (/429|rate.?limit/i.test(message)) return "The assistant is busy right now. Please wait a moment and try again.";
  if (/402|credit/i.test(message)) return "AI credits are unavailable right now. Check your workspace billing settings.";
  if (/401|unauthorized/i.test(message)) return "Please sign in again to continue.";
  if (/403|forbidden/i.test(message)) return "AI access is currently blocked for this workspace.";
  return "Something went wrong while answering. Please try again.";
}

function ThreadList({
  threads, activeId, loading, onCreate, onOpen, onPin, onDelete, onRename,
}: {
  threads: Thread[];
  activeId: string | undefined;
  loading: boolean;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onPin: (thread: Thread) => void;
  onDelete: (thread: Thread) => void;
  onRename: (thread: Thread, title: string) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function beginRename(thread: Thread) {
    setRenamingId(thread.id);
    setRenameValue(thread.title);
  }

  function finishRename(thread: Thread) {
    const title = renameValue.trim();
    if (title && title !== thread.title) onRename(thread, title);
    setRenamingId(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Chats</p>
        <Button size="icon" variant="ghost" aria-label="New chat" title="New chat" onClick={onCreate}>
          <Plus className="size-4" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2">
        {loading && <p className="px-3 py-4 text-sm text-muted-foreground">Loading chats…</p>}
        {!loading && threads.length === 0 && (
          <p className="px-3 py-4 text-sm leading-relaxed text-muted-foreground">Your conversations will appear here.</p>
        )}
        <div className="space-y-1 pb-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-1 transition-colors",
                activeId === thread.id ? "bg-primary/10 text-foreground" : "hover:bg-muted/70",
              )}
            >
              {renamingId === thread.id ? (
                <div className="flex min-w-0 flex-1 items-center gap-1 py-1">
                  <Input
                    autoFocus
                    aria-label="Chat name"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") finishRename(thread);
                      if (event.key === "Escape") setRenamingId(null);
                    }}
                    className="h-8 min-w-0"
                  />
                  <Button size="icon" variant="ghost" aria-label="Save chat name" onClick={() => finishRename(thread)}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Cancel rename" onClick={() => setRenamingId(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpen(thread.id)}
                    className="h-10 min-w-0 flex-1 justify-start gap-2 px-2 text-left text-sm font-normal"
                    aria-current={activeId === thread.id ? "page" : undefined}
                  >
                    {thread.pinned ? <Pin className="size-3.5 shrink-0 text-primary" /> : <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{thread.title}</span>
                  </Button>
                  <div className="flex shrink-0 items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                    <Button size="icon" variant="ghost" aria-label={thread.pinned ? "Unpin chat" : "Pin chat"} title={thread.pinned ? "Unpin" : "Pin"} onClick={() => onPin(thread)}>
                      {thread.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Rename chat" title="Rename" onClick={() => beginRename(thread)}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Delete chat" title="Delete" onClick={() => onDelete(thread)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatThread({ threadId, initialMessages, onMessagesChanged }: {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChanged: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chat = useChat({
    id: threadId,
    messages: initialMessages,
    transport: useMemo(() => new DefaultChatTransport({ api: "/api/assistant", body: { threadId } }), [threadId]),
    onError: (error) => toast.error(readableError(error)),
    onFinish: () => {
      onMessagesChanged();
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    },
  });
  const busy = chat.status === "submitted" || chat.status === "streaming";

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-4xl gap-7 px-4 py-6 sm:px-7">
          {chat.messages.length === 0 ? (
            <ConversationEmptyState
              icon={<div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bot className="size-7" /></div>}
              title="What would you like to know?"
              description=""
            >
              <div className="flex flex-col items-center gap-4">
                <div className="grid gap-2 text-left sm:grid-cols-2">
                  {["Summarize my active projects", "Which projects have rework?", "Show pending stages for Set 5", "Compare two project progress figures"].map((prompt) => (
                    <Button key={prompt} variant="outline" className="h-auto justify-start whitespace-normal rounded-lg py-2.5 text-left" onClick={() => void chat.sendMessage({ text: prompt })}>
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            chat.messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {message.role === "user" ? <span className="grid size-6 place-items-center rounded-full bg-secondary text-foreground">A</span> : <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="size-4" /></span>}
                  {message.role === "user" ? "You" : "Production Assistant"}
                </div>
                <MessageContent>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") return <MessageResponse key={`${message.id}-text-${index}`}>{part.text}</MessageResponse>;
                    if (part.type === "reasoning") return (
                      <details key={`${message.id}-reason-${index}`} className="my-2 rounded-lg border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Reasoning summary</summary>
                        <p className="mt-2 whitespace-pre-wrap">{part.text}</p>
                      </details>
                    );
                    if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                      const toolPart = part as ToolPart;
                      const dynamic = toolPart.type === "dynamic-tool";
                      const name = dynamic ? toolPart.toolName : toolPart.type.slice(5);
                      return (
                        <Tool key={`${message.id}-tool-${index}`} defaultOpen={false}>
                          {dynamic ? (
                            <ToolHeader type="dynamic-tool" toolName={toolPart.toolName} state={toolPart.state} title={toolTitles[name] ?? "Looking up information"} />
                          ) : (
                            <ToolHeader type={toolPart.type} state={toolPart.state} title={toolTitles[name] ?? "Looking up information"} />
                          )}
                          <ToolContent>
                            <ToolInput input={toolPart.input} />
                            <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {(chat.status === "submitted" || (chat.status === "streaming" && !chat.messages.at(-1)?.parts.some((part) => part.type === "text" && part.text.trim()))) && (
            <div className="flex items-center gap-2 pl-1 text-sm text-muted-foreground" role="status">
              <span className="size-2 animate-pulse rounded-full bg-primary" /> Checking your project data…
            </div>
          )}
          {chat.status === "error" && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <span>{readableError(chat.error ?? new Error("Request failed"))}</span>
              <Button variant="outline" size="sm" onClick={() => chat.clearError()}>Dismiss</Button>
            </div>
          )}
        </ConversationContent>
      </Conversation>
      <div className="mx-auto w-full max-w-4xl px-3 pb-4 pt-2 sm:px-7">
        <PromptInput
          onSubmit={async ({ text }) => {
            const trimmed = text.trim();
            if (!trimmed || busy) return;
            await chat.sendMessage({ text: trimmed });
            window.requestAnimationFrame(() => textareaRef.current?.focus());
          }}
          className="border-border/80 bg-card/90 shadow-sm"
        >
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            aria-label="Ask about your production data"
            placeholder="Ask about projects, sets, panels, or production…"
            className="min-h-14"
          />
          <PromptInputFooter className="pb-1.5 pr-1.5">
            <span className="px-2 text-[11px] text-muted-foreground">Answers use your saved production data</span>
            <PromptInputSubmit
              aria-label={busy ? "Stop response" : "Send message"}
              status={chat.status}
              onStop={chat.stop}
              className="shrink-0"
            >
              {busy ? <Square className="size-3.5 fill-current" /> : <Send className="size-4" />}
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function AssistantWorkspace({ activeThreadId }: { activeThreadId?: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const threadsQuery = useQuery({
    queryKey: ["assistant-threads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_threads").select("id,title,pinned,updated_at").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Thread[];
    },
  });
  const savedQuery = useQuery({
    queryKey: ["assistant-messages", activeThreadId],
    enabled: Boolean(activeThreadId),
    queryFn: async () => {
      if (!activeThreadId) return [];
      const { data, error } = await supabase.from("chat_messages").select("message_id,role,parts").eq("thread_id", activeThreadId).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({ id: row.message_id, role: row.role, parts: row.parts })) as UIMessage[];
    },
  });
  const threads = threadsQuery.data ?? [];

  useEffect(() => {
    if (threadsQuery.error) toast.error("Could not load your saved chats.");
  }, [threadsQuery.error]);
  useEffect(() => {
    if (savedQuery.error) toast.error("Could not load this conversation.");
  }, [savedQuery.error]);

  async function createThread() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast.error("Please sign in again to start a chat.");
      return;
    }
    const { data, error } = await supabase.from("chat_threads").insert({ user_id: userData.user.id, title: "New chat" }).select("id").single();
    if (error || !data) {
      toast.error("Could not start a new chat. Please try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
    setMobileListOpen(false);
    await navigate({ to: "/assistant/$threadId", params: { threadId: data.id } });
  }

  async function mutateThread(thread: Thread, patch: { pinned?: boolean; title?: string }) {
    const { error } = await supabase.from("chat_threads").update(patch).eq("id", thread.id);
    if (error) toast.error("Could not update this chat.");
    else await queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
  }

  async function deleteThread(thread: Thread) {
    if (!window.confirm(`Delete “${thread.title}”? This also removes its saved messages.`)) return;
    const { error } = await supabase.from("chat_threads").delete().eq("id", thread.id);
    if (error) {
      toast.error("Could not delete this chat.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
    await queryClient.invalidateQueries({ queryKey: ["assistant-messages", thread.id] });
    if (activeThreadId === thread.id) await navigate({ to: "/assistant" });
  }

  const sidebarProps = {
    threads,
    activeId: activeThreadId,
    loading: threadsQuery.isLoading,
    onCreate: () => void createThread(),
    onOpen: (id: string) => {
      setMobileListOpen(false);
      void navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    },
    onPin: (thread: Thread) => void mutateThread(thread, { pinned: !thread.pinned }),
    onDelete: (thread: Thread) => void deleteThread(thread),
    onRename: (thread: Thread, title: string) => void mutateThread(thread, { title }),
  };

  return (
    <div className="flex h-[calc(100dvh-11.5rem)] min-h-[31rem] overflow-hidden rounded-xl border border-border/70 bg-card/35 shadow-sm">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/70 bg-card/45 lg:flex">
        <ThreadList {...sidebarProps} />
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/70 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open chats" className="lg:hidden"><MessageSquare className="size-4" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(88vw,340px)] flex-col p-0">
                <SheetTitle className="sr-only">Saved chats</SheetTitle>
                <ThreadList {...sidebarProps} />
              </SheetContent>
            </Sheet>
            <Bot className="size-4 shrink-0 text-primary" />
            <h2 className="truncate text-sm font-semibold">{threads.find((thread) => thread.id === activeThreadId)?.title ?? "Production Assistant"}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="New chat" title="New chat" onClick={() => void createThread()}>
            <Plus className="size-4" />
          </Button>
        </header>
        {activeThreadId ? (
          savedQuery.isLoading ? (
            <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Loading conversation…</div>
          ) : (
            <ChatThread
              key={activeThreadId}
              threadId={activeThreadId}
              initialMessages={savedQuery.data ?? []}
              onMessagesChanged={() => {
                void queryClient.invalidateQueries({ queryKey: ["assistant-messages", activeThreadId] });
                void queryClient.invalidateQueries({ queryKey: ["assistant-threads"] });
              }}
            />
          )
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bot className="size-7" /></div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-semibold">Production Assistant</h3>
              <p className="max-w-md text-sm text-muted-foreground">Start a conversation</p>
            </div>
            <Button onClick={() => void createThread()}><Plus className="mr-2 size-4" />Start a chat</Button>
          </div>
        )}
      </section>
    </div>
  );
}