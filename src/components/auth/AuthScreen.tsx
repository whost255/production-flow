import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "signin" | "signup" | "forgot";

export function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy("Signing in...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(null);
      toast.error("Unable to sign in. Check your email and password.");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      setBusy(null);
      toast.error("Your account has been disabled. Please contact an administrator.");
      return;
    }
    await supabase.rpc("record_login");
    await logAudit("Login", "Signed in to Production Tracker");
    toast.success("Welcome back.");
    setBusy(null);
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!fullName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setBusy("Creating account...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(null);
    if (error) {
      toast.error(error.message || "Unable to create account. Please try again.");
      return;
    }
    if (data.session) {
      toast.success("Account created.");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.success("Account created. Check your email to confirm your address.");
      setMode("signin");
    }
  }

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy("Sending reset link...");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(null);
    if (error) {
      toast.error("Unable to send reset link. Please try again.");
      return;
    }
    toast.success("Password reset link sent. Please check your email.");
    setMode("signin");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="pt-blob absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/25 blur-3xl" />
        <div
          className="pt-blob absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-brand-glow/25 blur-3xl"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="pt-blob absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full bg-chart-2/20 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="prism absolute inset-x-0 top-0 h-[3px]" />
        <div className="flex items-center gap-3">
          <div className="prism grid size-11 place-items-center rounded-xl font-display text-lg font-bold text-primary-foreground">
            P
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">PRODUCTION TRACKER</h1>
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Prism Suite
            </p>
          </div>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={forgot} className="mt-8 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold">Forgot password</h2>
              <p className="text-sm text-muted-foreground">
                We'll email you a link to set a new password.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={!!busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {busy ?? "Send reset link"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            className="mt-8"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="signin" className="rounded-full">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={!!busy}>
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {busy ?? "Login"}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={!!busy}>
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {busy ?? "Create account"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  New accounts start with view-only access until an administrator assigns a role.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
