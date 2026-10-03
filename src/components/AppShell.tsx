import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  FileSpreadsheet,
  Folders,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  User,
} from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { perms, useMe } from "@/lib/auth";
import { ROLE_LABEL, STAGE_LABEL, STATUS_LABEL, formatTime } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Folders },
  { to: "/production", label: "Production", icon: Gauge },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/exports", label: "Exports", icon: FileSpreadsheet },
] as const;

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function NavLinks({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
          activeProps={{
            className:
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-card text-primary shadow-sm",
          }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
          activeProps={{
            className:
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-card text-primary shadow-sm",
          }}
        >
          <Shield className="size-4" />
          Admin
        </Link>
      )}
    </nav>
  );
}

function Brand() {
  return (
    <div className="mb-6 flex items-center gap-3 px-2">
      <div className="prism grid size-10 place-items-center rounded-xl font-display text-lg font-bold text-primary-foreground">
        P
      </div>
      <div>
        <p className="font-display text-[15px] leading-none font-bold tracking-tight">
          Production Tracker
        </p>
        <p className="mt-1 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Prism Suite
        </p>
      </div>
    </div>
  );
}

function Notifications() {
  const { data } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("production_history")
        .select("id,panel_name,stage,new_status,changed_by_name,changed_at,set_number")
        .order("changed_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="glass relative grid size-10 place-items-center rounded-full text-muted-foreground"
        >
          <Bell className="size-4" />
          {(data?.length ?? 0) > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-display text-sm font-bold">Notifications</p>
        </div>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {(data ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">No recent activity yet.</li>
          )}
          {(data ?? []).map((n) => (
            <li key={n.id} className="px-4 py-3">
              <p className="text-sm leading-snug">
                {n.panel_name} · Set {n.set_number} · {STAGE_LABEL[n.stage]} →{" "}
                <span className="font-semibold">{STATUS_LABEL[n.new_status]}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {n.changed_by_name || "System"} · {formatTime(n.changed_at)}
              </p>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  breadcrumb?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = perms.isAdmin(me?.roles);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0">
        <div className="pt-blob absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div
          className="pt-blob absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-brand-glow/20 blur-3xl"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="pt-blob absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-chart-2/20 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 flex-col gap-1 p-5 lg:flex">
          <Brand />
          <NavLinks isAdmin={isAdmin} />
          <Link
            to="/profile"
            className="glass mt-4 flex items-center gap-3 rounded-2xl p-3 transition hover:brightness-105"
          >
            <div className="grid size-9 place-items-center rounded-full prism text-xs font-bold text-primary-foreground">
              {initials(me?.fullName ?? "", me?.email ?? "")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me?.fullName || me?.email}</p>
              <p className="text-[11px] text-muted-foreground">Full access</p>
            </div>
          </Link>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 px-4 py-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-5">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Brand />
                  <NavLinks isAdmin={isAdmin} />
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  {breadcrumb ?? `Production Tracker · ${pathname.split("/")[1] || "home"}`}
                </p>
                <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight lg:text-3xl">
                  {title}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Account"
                    className="grid size-10 place-items-center rounded-full prism text-xs font-bold text-primary-foreground"
                  >
                    {initials(me?.fullName ?? "", me?.email ?? "")}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate">{me?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 size-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Shield className="mr-2 size-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 size-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="px-4 pb-12 lg:px-8">
            {me &&
            perms.isPending(me.roles) &&
            pathname !== "/profile" &&
            pathname !== "/settings" ? (
              <GlassPanel className="mx-auto mt-6 max-w-lg p-8 text-center">
                <h2 className="font-display text-lg font-bold">Awaiting access</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your account was created successfully. An administrator needs to assign your role
                  before you can open projects and production data.
                </p>
              </GlassPanel>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export function GlassPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn("glass relative overflow-hidden rounded-3xl border border-card", className)}
    >
      <div className="prism absolute inset-x-0 top-0 h-[3px]" />
      {children}
    </section>
  );
}
