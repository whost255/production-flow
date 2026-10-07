import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  head: () => ({
    meta: [
      { title: "Saved Assistant Chat — Production Tracker" },
      { name: "description", content: "Continue a saved conversation about your projects and production records." },
      { property: "og:title", content: "Saved Assistant Chat — Production Tracker" },
      { property: "og:description", content: "Continue a saved conversation about your project and production data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantThreadPage,
});

function AssistantThreadPage() {
  const { threadId } = Route.useParams();
  return (
    <AppShell title="AI Assistant" breadcrumb="Production Tracker · Assistant">
      <AssistantWorkspace activeThreadId={threadId} />
    </AppShell>
  );
}