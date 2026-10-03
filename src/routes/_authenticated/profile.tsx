import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AppShell, GlassPanel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { ROLE_LABEL, STAGE_LABEL, formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Production Tracker" },
      { name: "description", content: "Your account details, role and recent production activity." },
      { property: "og:title", content: "My Profile — Production Tracker" },
      {
        property: "og:description",
        content: "Your account details, role and recent production activity.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [name, setName] = useState(me?.fullName ?? "");
  const [busy, setBusy] = useState(false);

  const { data: activity } = useQuery({
    queryKey: ["my-activity", me?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("production_history")
        .select("*")
        .eq("changed_by", me!.id)
        .order("changed_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!me?.id,
  });

  async function save() {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", me!.id);
    setBusy(false);
    if (error) {
      toast.error("We couldn't save your name. Please try again.");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Profile updated.");
  }

  return (
    <AppShell title="My Profile" breadcrumb="Production Tracker · Profile">
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel className="p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold tracking-tight">Account details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={name}
                placeholder={me?.fullName}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={me?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Access</Label>
              <Input
                value="Full access"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Last login</Label>
              <Input value={formatDateTime(me?.lastLoginAt)} disabled />
            </div>
          </div>
          <Button className="mt-4 rounded-full" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="font-display text-lg font-bold tracking-tight">My recent updates</h2>
          <ul className="mt-4 space-y-3">
            {(activity ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">No production updates yet.</li>
            )}
            {(activity ?? []).map((a) => (
              <li key={a.id} className="text-sm">
                <p>
                  {a.panel_name} · Set {a.set_number} · {STAGE_LABEL[a.stage]}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.changed_at)}</p>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
