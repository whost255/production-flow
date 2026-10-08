import { createOpenAI } from "@ai-sdk/openai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-run-id.server";
import { STAGES, STATUSES } from "@/lib/domain";

type DB = SupabaseClient<Database>;
const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.value, s.label]));
const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label]),
);
const STAGE_VALUES = STAGES.map((s) => s.value);
const STATUS_VALUES = STATUSES.map((s) => s.value);

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function userClient(token: string): DB {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Application data access is unavailable.");
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

function matchStage(input?: string | null) {
  if (!input) return null;
  const q = input.toLowerCase().replace(/[\s-]+/g, "_");
  return (
    STAGES.find((s) => s.value === q)?.value ??
    STAGES.find((s) => s.label.toLowerCase().replace(/[\s-]+/g, "_").includes(q))?.value ??
    STAGES.find((s) => s.short.toLowerCase() === input.toLowerCase())?.value ??
    null
  );
}

function matchStatus(input?: string | null) {
  if (!input) return null;
  const q = input.toLowerCase().replace(/[\s/-]+/g, "_");
  if (q === "na" || q === "n_a") return "not_applicable";
  if (q.includes("progress")) return "wip";
  if (q === "complete" || q === "done") return "completed";
  return STATUS_VALUES.find((s) => s === q || (STATUS_LABEL[s] ?? s).toLowerCase() === input.toLowerCase()) ?? null;
}

async function resolveProject(db: DB, ref: string) {
  const term = ref.trim();
  const { data } = await db
    .from("projects")
    .select("*")
    .or(`code.ilike.%${term.replace(/[%,()]/g, "")}%,name.ilike.%${term.replace(/[%,()]/g, "")}%`)
    .limit(10);
  if (!data || data.length === 0) return { error: `No project matching "${ref}" exists in the application.` };
  const exact = data.find(
    (p) => p.code.toLowerCase() === term.toLowerCase() || p.name.toLowerCase() === term.toLowerCase(),
  );
  if (exact) return { project: exact };
  if (data.length === 1) return { project: data[0] };
  return {
    error: `Several projects match "${ref}". Ask the user which one.`,
    candidates: data.map((p) => ({ code: p.code, name: p.name })),
  };
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; from < 60000; from += size) {
    const { data, error } = await build(from, from + size - 1);
    if (error) throw new Error("Data lookup failed");
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}

function countStatuses(rows: { status: string }[]) {
  const c: Record<string, number> = {};
  for (const r of rows) c[STATUS_LABEL[r.status] ?? r.status] = (c[STATUS_LABEL[r.status] ?? r.status] ?? 0) + 1;
  return c;
}

function pct(rows: { status: string }[]) {
  const applicable = rows.filter((r) => r.status !== "not_applicable");
  if (applicable.length === 0) return 0;
  return Math.round((applicable.filter((r) => r.status === "completed").length / applicable.length) * 1000) / 10;
}

function buildTools(db: DB) {
  return {
    list_projects: tool({
      description:
        "List projects the user can access with status, set count, panel count and overall progress %. Use for overall progress, comparisons and finding projects.",
      inputSchema: z.object({
        search: z.string().optional().describe("Filter by project code or name"),
        status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
      }),
      execute: async ({ search, status }) => {
        let q = db.from("projects").select("id,code,name,country,country_other,process,set_count,status,created_at,updated_at");
        if (status) q = q.eq("status", status);
        if (search) {
          const s = search.replace(/[%,()]/g, "");
          q = q.or(`code.ilike.%${s}%,name.ilike.%${s}%`);
        }
        const [{ data: projects }, { data: progress }] = await Promise.all([
          q.order("updated_at", { ascending: false }).limit(200),
          db.rpc("get_projects_progress"),
        ]);
        const byId = new Map((progress ?? []).map((p) => [p.project_id, p]));
        return {
          count: projects?.length ?? 0,
          projects: (projects ?? []).map((p) => ({
            code: p.code,
            name: p.name,
            status: p.status,
            country: p.country === "Other" ? p.country_other : p.country,
            process: p.process,
            sets: p.set_count,
            panels: byId.get(p.id)?.panel_count ?? 0,
            progress_percent: byId.get(p.id)?.progress ?? 0,
            created: p.created_at.slice(0, 10),
            last_updated: p.updated_at.slice(0, 10),
          })),
        };
      },
    }),

    project_summary: tool({
      description:
        "Full summary of one project: details, overall progress, status counts, progress per set, per panel and per stage.",
      inputSchema: z.object({ project: z.string().describe("Project code or name, e.g. RFQ-464") }),
      execute: async ({ project }) => {
        const r = await resolveProject(db, project);
        if (!r.project) return r;
        const p = r.project;
        const { data } = await db.rpc("get_project_progress", { p_project_id: p.id });
        const prog = (data ?? {}) as {
          overall?: number;
          counts?: Record<string, number>;
          sets?: unknown[];
          panels?: unknown[];
          stages?: { stage: string; progress: number }[];
        };
        return {
          project: {
            code: p.code,
            name: p.name,
            status: p.status,
            country: p.country === "Other" ? p.country_other : p.country,
            process: p.process,
            sets: p.set_count,
            created: p.created_at.slice(0, 10),
            last_updated: p.updated_at,
          },
          overall_progress_percent: prog.overall ?? 0,
          status_counts: prog.counts ?? {},
          set_progress: prog.sets ?? [],
          panel_progress: prog.panels ?? [],
          stage_progress: (prog.stages ?? []).map((s) => ({ ...s, stage: STAGE_LABEL[s.stage] ?? s.stage })),
        };
      },
    }),

    production_records: tool({
      description:
        "Query production status records (one per set × panel × stage) with filters, and get aggregated counts. Use for set-wise / panel-wise / stage-wise status, WIP/pending/rework lists, completed sets, and cross-project questions like 'which projects have rework' (omit project and group_by project).",
      inputSchema: z.object({
        project: z.string().optional().describe("Project code or name. Omit to search all projects."),
        set_number: z.number().int().optional(),
        panel: z.string().optional().describe("Panel name or part number (partial match)"),
        stage: z.string().optional().describe(`Stage: ${STAGE_VALUES.join(", ")}`),
        status: z.string().optional().describe(`Status: ${STATUS_VALUES.join(", ")}`),
        group_by: z.enum(["project", "set", "panel", "stage", "none"]).optional(),
      }),
      execute: async ({ project, set_number, panel, stage, status, group_by }) => {
        let projectRows: Database["public"]["Tables"]["projects"]["Row"][] = [];
        if (project) {
          const r = await resolveProject(db, project);
          if (!r.project) return r;
          projectRows = [r.project];
        } else {
          const { data } = await db.from("projects").select("*").limit(500);
          projectRows = data ?? [];
        }
        const projectIds = projectRows.map((p) => p.id);
        if (projectIds.length === 0) return { message: "No projects available." };

        const stageVal = matchStage(stage);
        if (stage && !stageVal) return { error: `Unknown stage "${stage}". Valid: ${STAGES.map((s) => s.label).join(", ")}` };
        const statusVal = matchStatus(status);
        if (status && !statusVal) return { error: `Unknown status "${status}".` };

        const [sets, panels] = await Promise.all([
          fetchAll((f, t) => db.from("production_sets").select("id,project_id,set_number").in("project_id", projectIds).range(f, t)),
          fetchAll((f, t) => db.from("panels").select("id,project_id,name,part_number,is_active,sequence").in("project_id", projectIds).range(f, t)),
        ]);
        let setIds: string[] | null = null;
        if (set_number != null) {
          setIds = sets.filter((s) => s.set_number === set_number).map((s) => s.id);
          if (setIds.length === 0) return { error: `Set ${set_number} does not exist${project ? ` in ${projectRows[0]?.code ?? project}` : ""}.` };
        }
        let panelIds: string[] | null = null;
        if (panel) {
          const q = panel.toLowerCase();
          panelIds = panels
            .filter((p) => p.name.toLowerCase().includes(q) || (p.part_number ?? "").toLowerCase().includes(q))
            .map((p) => p.id);
          if (panelIds.length === 0) return { error: `No panel matching "${panel}" exists.` };
        }

        const rows = await fetchAll((f, t) => {
          let q = db
            .from("production_status")
            .select("project_id,set_id,panel_id,stage,status,updated_at")
            .in("project_id", projectIds);
          if (setIds) q = q.in("set_id", setIds);
          if (panelIds && panelIds.length <= 200) q = q.in("panel_id", panelIds);
          if (stageVal) q = q.eq("stage", stageVal as never);
          return q.range(f, t);
        });
        const panelSet = panelIds ? new Set(panelIds) : null;
        const base = panelSet ? rows.filter((r) => panelSet.has(r.panel_id)) : rows;
        const filtered = statusVal ? base.filter((r) => r.status === statusVal) : base;

        const setById = new Map(sets.map((s) => [s.id, s.set_number]));
        const panelById = new Map(panels.map((p) => [p.id, p]));
        const projById = new Map(projectRows.map((p) => [p.id, p.code]));
        const keyOf = (r: (typeof rows)[number], g: string) =>
          g === "project"
            ? projById.get(r.project_id) ?? "?"
            : g === "set"
              ? `${projectIds.length > 1 ? projById.get(r.project_id) + " " : ""}Set ${setById.get(r.set_id)}`
              : g === "panel"
                ? `${panelById.get(r.panel_id)?.name ?? "?"}`
                : STAGE_LABEL[r.stage] ?? r.stage;

        const g = group_by ?? "none";
        let groups: unknown = undefined;
        if (g !== "none") {
          const map = new Map<string, typeof rows>();
          for (const r of base) {
            const k = keyOf(r, g);
            map.set(k, [...(map.get(k) ?? []), r]);
          }
          groups = [...map.entries()]
            .map(([k, rs]) => {
              const matching = statusVal ? rs.filter((r) => r.status === statusVal).length : undefined;
              const applicable = rs.filter((r) => r.status !== "not_applicable");
              return {
                group: k,
                total_records: rs.length,
                applicable_records: applicable.length,
                progress_percent: pct(rs),
                fully_completed: applicable.length > 0 && applicable.every((r) => r.status === "completed"),
                status_counts: countStatuses(rs),
                ...(matching !== undefined ? { matching_status_count: matching } : {}),
              };
            })
            .filter((x) => !statusVal || (x.matching_status_count ?? 0) > 0 || g === "set")
            .sort((a, b) => a.group.localeCompare(b.group, undefined, { numeric: true }));
        }

        const records = filtered
          .slice(0, 150)
          .map((r) => ({
            project: projById.get(r.project_id),
            set: setById.get(r.set_id),
            panel: panelById.get(r.panel_id)?.name,
            part_number: panelById.get(r.panel_id)?.part_number ?? "",
            stage: STAGE_LABEL[r.stage] ?? r.stage,
            status: STATUS_LABEL[r.status] ?? r.status,
            last_updated: r.updated_at,
          }))
          .sort((a, b) => (a.set ?? 0) - (b.set ?? 0) || String(a.panel).localeCompare(String(b.panel)));

        return {
          filters: { project: project ? projectRows[0]?.code ?? project : "all accessible", set_number, panel, stage: stageVal, status: statusVal },
          total_matching_records: filtered.length,
          overall_status_counts: countStatuses(base),
          progress_percent: pct(base),
          groups,
          records,
          records_truncated: filtered.length > 150,
          distinct_panels_matching: new Set(filtered.map((r) => `${r.set_id}:${r.panel_id}`)).size,
        };
      },
    }),

    production_history: tool({
      description: "Recent production status change history (who changed what, when).",
      inputSchema: z.object({
        project: z.string().optional(),
        set_number: z.number().int().optional(),
        panel: z.string().optional(),
        limit: z.number().int().optional().describe("Max rows, default 30, max 100"),
      }),
      execute: async ({ project, set_number, panel, limit }) => {
        let q = db
          .from("production_history")
          .select("project_id,set_number,panel_name,stage,old_status,new_status,changed_by_name,changed_at")
          .order("changed_at", { ascending: false })
          .limit(Math.min(limit ?? 30, 100));
        let code: string | undefined;
        if (project) {
          const r = await resolveProject(db, project);
          if (!r.project) return r;
          q = q.eq("project_id", r.project.id);
          code = r.project.code;
        }
        if (set_number != null) q = q.eq("set_number", set_number);
        if (panel) q = q.ilike("panel_name", `%${panel.replace(/[%,()]/g, "")}%`);
        const { data } = await q;
        return {
          project: code,
          entries: (data ?? []).map((h) => ({
            when: h.changed_at,
            set: h.set_number,
            panel: h.panel_name,
            stage: STAGE_LABEL[h.stage] ?? h.stage,
            from: h.old_status ? STATUS_LABEL[h.old_status] : null,
            to: STATUS_LABEL[h.new_status],
            by: h.changed_by_name || "Unknown",
          })),
        };
      },
    }),
  };
}

const SYSTEM = `You are the Production Tracker assistant for a composite-panel manufacturing plant.
You answer ONLY from the application's data, retrieved through your tools. Always call tools before answering any question about projects, sets, panels, stages, statuses, progress or history — never guess.
If a tool says something doesn't exist or returns no data, clearly say the information is not available in the application. Never invent projects, numbers, dates or names.
Domain: a project has N sets; panel definitions are replicated in every set; each panel goes through applicable stages (${STAGES.map((s) => s.label).join(", ")}).
Statuses: Pending, WIP, Completed, Hold, Rework, Not Applicable. Progress = completed ÷ applicable records (Not Applicable excluded).
A set is "completed" when all its applicable records are Completed.
Format answers in clear markdown: short headline, then tables or bullet points. Use tables for set-wise / panel-wise / comparisons. Keep it concise. Today is ${new Date().toISOString().slice(0, 10)}.`;

function textOf(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

export async function handleAssistantChat(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token.split(".").length !== 3) return json(401, "Please sign in again.");
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "The AI assistant is not configured.");

  const db = userClient(token);
  const { data: claims, error: claimErr } = await db.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimErr || !userId) return json(401, "Please sign in again.");

  let body: { threadId?: string; messages?: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return json(400, "Invalid request.");
  }
  const { threadId, messages } = body;
  if (!threadId || !Array.isArray(messages) || messages.length === 0) return json(400, "Invalid request.");

  const { data: thread } = await db.from("chat_threads").select("id,title").eq("id", threadId).maybeSingle();
  if (!thread) return json(404, "This chat was not found.");

  const last = messages.at(-1);
  if (!last) return json(400, "Invalid request.");
  if (last.role === "user") {
    const { error } = await db.from("chat_messages").upsert(
      { thread_id: threadId, user_id: userId, message_id: last.id, role: "user", parts: last.parts as never },
      { onConflict: "thread_id,message_id" },
    );
    if (error) {
      console.error("save user message", error);
      return json(500, "Could not save your message. Please try again.");
    }
    const patch: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
    if (thread.title === "New chat") {
      const t = textOf(last);
      if (t) patch.title = t.length > 60 ? t.slice(0, 57) + "…" : t;
    }
    await db.from("chat_threads").update(patch).eq("id", threadId);
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: buildTools(db),
    stopWhen: stepCountIs(50),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onError: (e) => {
        console.error("assistant stream", e);
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 429) return "The assistant is busy right now. Please wait a moment and try again.";
        if (status === 402) return "AI credits are used up. Add credits in your workspace billing settings to keep using the assistant.";
        if (status === 403) return "AI access is currently blocked for this workspace.";
        return "Something went wrong while answering. Please try again.";
      },
      onFinish: async ({ responseMessage }) => {
        const { error } = await db.from("chat_messages").upsert(
          {
            thread_id: threadId,
            user_id: userId,
            message_id: responseMessage.id,
            role: "assistant",
            parts: responseMessage.parts as never,
          },
          { onConflict: "thread_id,message_id" },
        );
        if (error) console.error("save assistant message", error);
        await db.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
      },
    }),
    runIdFetch,
  );
}
