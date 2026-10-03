import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, GlassPanel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, perms, useMe } from "@/lib/auth";
import { ROLES, ROLE_LABEL, formatDate, formatDateTime } from "@/lib/domain";
import { useProfiles } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.rpc("is_admin");
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "User Management — Production Tracker" },
      {
        name: "description",
        content: "Manage users and roles, review system totals and read the audit log.",
      },
      { property: "og:title", content: "User Management — Production Tracker" },
      {
        property: "og:description",
        content: "Manage users and roles, review system totals and read the audit log.",
      },
    ],
  }),
  component: Admin,
});

function RoleSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={!!disabled}>
      <SelectTrigger className="h-10 w-full text-sm lg:h-8 lg:w-48 lg:text-xs">
        <SelectValue>{ROLE_LABEL[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <GlassPanel className="rounded-2xl p-4">
      <p className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </GlassPanel>
  );
}

function Admin() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const isAdmin = perms.isAdmin(me?.roles);
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useProfiles();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw error;
      return data as Record<string, number>;
    },
    enabled: isAdmin,
  });
  const { data: audit } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <AppShell title="Admin" breadcrumb="Production Tracker · Admin">
        <GlassPanel className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            This area is for administrators only.
          </p>
        </GlassPanel>
      </AppShell>
    );
  }

  async function setRole(userId: string, role: string, name: string) {
    const { error } = await supabase.rpc("admin_set_role", {
      p_user_id: userId,
      p_role: role as never,
    });
    if (error) {
      toast.error("We couldn't change that role. Please try again.");
      return;
    }
    await logAudit("Change Role", `${name} is now ${ROLE_LABEL[role]}`);
    await queryClient.invalidateQueries();
    toast.success(`${name} is now ${ROLE_LABEL[role]}.`);
  }

  async function setActive(userId: string, active: boolean, name: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: active })
      .eq("id", userId);
    if (error) {
      toast.error("We couldn't update that account. Please try again.");
      return;
    }
    await logAudit(active ? "Enable User" : "Disable User", `${name} ${active ? "enabled" : "disabled"}`);
    await queryClient.invalidateQueries();
    toast.success(`${name} ${active ? "enabled" : "disabled"}.`);
  }

  const filteredUsers = (users ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    return !q || `${u.full_name} ${u.email}`.toLowerCase().includes(q);
  });

  return (
    <AppShell title="Administration" breadcrumb="Production Tracker · Admin">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Users" value={stats?.['users_total'] ?? 0} />
        <Stat label="Active users" value={stats?.['users_active'] ?? 0} />
        <Stat label="Projects" value={stats?.['projects_total'] ?? 0} />
        <Stat label="Active projects" value={stats?.['projects_active'] ?? 0} />
        <Stat label="Panels" value={stats?.['panels_total'] ?? 0} />
        <Stat label="Records" value={stats?.['records_total'] ?? 0} />
      </section>

      <Tabs defaultValue="users" className="mt-4">
        <TabsList className="rounded-full">
          <TabsTrigger value="users" className="rounded-full">
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-full">
            System
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-full">
            Audit log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <GlassPanel className="mt-4">
            <div className="p-4">
              <Input
                placeholder="Search users by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {isLoading ? (
              <div className="p-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                {/* Mobile / tablet cards */}
                <ul className="divide-y lg:hidden">
                  {filteredUsers.map((u) => {
                    const self = u.id === me?.id;
                    const name = u.full_name || u.email;
                    return (
                      <li key={u.id} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{u.full_name || "—"}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Created {formatDate(u.created_at)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${u.is_active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {u.is_active ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <RoleSelect
                            value={u.roles[0] ?? "pending"}
                            disabled={self}
                            onChange={(v) => setRole(u.id, v, name)}
                          />
                          <Switch
                            checked={u.is_active}
                            disabled={self}
                            aria-label="Account active"
                            onCheckedChange={(c) => setActive(u.id, c, name)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {/* Desktop table */}
                <div className="hidden lg:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        {["User", "Email", "Role", "Status", "Created", "Last login", "Actions"].map((h) => (
                          <th key={h} className="border-b px-4 py-3 text-[11px] tracking-wider uppercase">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const self = u.id === me?.id;
                        const name = u.full_name || u.email;
                        return (
                          <tr key={u.id} className="hover:bg-muted/40">
                            <td className="border-b px-4 py-2 font-medium">
                              {u.full_name || "—"} {self && <span className="text-xs text-muted-foreground">(you)</span>}
                            </td>
                            <td className="border-b px-4 py-2">{u.email}</td>
                            <td className="border-b px-4 py-2">
                              <RoleSelect
                                value={u.roles[0] ?? "pending"}
                                disabled={self}
                                onChange={(v) => setRole(u.id, v, name)}
                              />
                            </td>
                            <td className="border-b px-4 py-2">{u.is_active ? "Active" : "Disabled"}</td>
                            <td className="border-b px-4 py-2 whitespace-nowrap">{formatDate(u.created_at)}</td>
                            <td className="border-b px-4 py-2 whitespace-nowrap">
                              {formatDateTime(u.last_login_at)}
                            </td>
                            <td className="border-b px-4 py-2">
                              <Switch
                                checked={u.is_active}
                                disabled={self}
                                aria-label="Account active"
                                onCheckedChange={(c) => setActive(u.id, c, name)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </GlassPanel>
        </TabsContent>

        <TabsContent value="system">
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Completed records" value={stats?.['records_completed'] ?? 0} />
            <Stat label="WIP records" value={stats?.['records_wip'] ?? 0} />
            <Stat label="On hold" value={stats?.['records_hold'] ?? 0} />
            <Stat label="Rework" value={stats?.['records_rework'] ?? 0} />
            <Stat label="Completed projects" value={stats?.['projects_completed'] ?? 0} />
            <Stat label="Projects on hold" value={stats?.['projects_hold'] ?? 0} />
            <Stat label="Archived projects" value={stats?.['projects_archived'] ?? 0} />
            <Stat label="Disabled users" value={stats?.['users_inactive'] ?? 0} />
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <GlassPanel className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    {["When", "User", "Action", "Details"].map((h) => (
                      <th key={h} className="border-b px-4 py-3 text-[11px] tracking-wider uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(audit ?? []).map((a) => (
                    <tr key={a.id} className="hover:bg-muted/40">
                      <td className="border-b px-4 py-2 whitespace-nowrap">
                        {formatDateTime(a.created_at)}
                      </td>
                      <td className="border-b px-4 py-2">{a.user_name || "—"}</td>
                      <td className="border-b px-4 py-2 font-medium">{a.action}</td>
                      <td className="border-b px-4 py-2">{a.description}</td>
                    </tr>
                  ))}
                  {(audit ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
