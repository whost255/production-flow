import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AppShell, GlassPanel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, useMe } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Production Tracker" },
      { name: "description", content: "Change your password and review your access level." },
      { property: "og:title", content: "Settings — Production Tracker" },
      {
        property: "og:description",
        content: "Change your password and review your access level.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data: me } = useMe();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password,
      current_password: currentPassword,
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setBusy(false);
    if (error) {
      toast.error(
        error.message?.toLowerCase().includes("current")
          ? "Your current password is incorrect."
          : "We couldn't change your password. Please try again.",
      );
      return;
    }
    await logAudit("Change Password", "Password updated");
    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    toast.success("Password changed.");
  }

  return (
    <AppShell title="Settings" breadcrumb="Production Tracker · Settings">
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel className="p-5">
          <h2 className="font-display text-lg font-bold tracking-tight">Change password</h2>
          <form onSubmit={changePassword} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="rounded-full" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="font-display text-lg font-bold tracking-tight">Your access</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Signed in as</dt>
              <dd className="font-medium">{me?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">
                {(me?.roles ?? []).map((r) => ROLE_LABEL[r]).join(", ") || "No role"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account status</dt>
              <dd className="font-medium">{me?.isActive ? "Active" : "Disabled"}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            Roles are set by an administrator and enforced on the server, so what you can change is
            always the same on every device.
          </p>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
