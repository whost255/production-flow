import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth/AuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Production Tracker" },
      {
        name: "description",
        content: "Sign in to Production Tracker to manage projects, panels and production status.",
      },
      { property: "og:title", content: "Sign in — Production Tracker" },
      {
        property: "og:description",
        content: "Sign in to Production Tracker to manage projects, panels and production status.",
      },
    ],
  }),
  component: AuthScreen,
});
