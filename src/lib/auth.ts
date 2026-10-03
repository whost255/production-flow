import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/domain";

export type Me = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: Role[];
};

export async function fetchMe(): Promise<Me | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,is_active,created_at,last_login_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  return {
    id: user.id,
    email: profile?.email || user.email || "",
    fullName: profile?.full_name || "",
    isActive: profile?.is_active ?? true,
    createdAt: profile?.created_at || user.created_at,
    lastLoginAt: profile?.last_login_at ?? null,
    roles: (roles ?? []).map((r) => r.role as Role),
  };
}

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: fetchMe, staleTime: 60_000 });
}

const has = (roles: Role[] | undefined, ...allowed: Role[]) =>
  (roles ?? []).some((r) => allowed.includes(r));

// Roles are no longer used: every signed-in user has full access.
void has;
const all = (_r?: Role[]) => true;
export const perms = {
  isAdmin: (_r?: Role[]) => false, // hides role management UI
  isPending: (_r?: Role[]) => false,
  canCreateProject: all,
  canConfigure: all,
  canUpdateProduction: all,
  canExport: all,
  canChangeProjectStatus: all,
  isQcOnly: (_r?: Role[]) => false,
};

export async function logAudit(action: string, description: string, projectId?: string) {
  const me = await supabase.auth.getUser();
  const user = me.data.user;
  if (!user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    user_name: profile?.full_name || user.email || "",
    action,
    description,
    project_id: projectId ?? null,
  });
}
