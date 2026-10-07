import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";

export const Route = createFileRoute("/_authenticated/assistant/")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Production Tracker" },
      { name: "description", content: "Ask questions about your projects and live production records." },
      { property: "og:title", content: "AI Assistant — Production Tracker" },
      { property: "og:description", content: "Explore your project and production data through a saved assistant conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantIndexPage,
});

function AssistantIndexPage() {
  return (
    <AppShell title="AI Assistant" breadcrumb="Production Tracker · Assistant">
      <AssistantWorkspace />
    </AppShell>
  );
}