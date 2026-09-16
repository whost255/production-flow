import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth/AuthScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Production Tracker — Panel Production Management" },
      {
        name: "description",
        content:
          "Track projects, sets, panels and every production stage with permanent history, progress and Excel exports.",
      },
      { property: "og:title", content: "Production Tracker — Panel Production Management" },
      {
        property: "og:description",
        content:
          "Track projects, sets, panels and every production stage with permanent history, progress and Excel exports.",
      },
    ],
  }),
  component: AuthScreen,
});
