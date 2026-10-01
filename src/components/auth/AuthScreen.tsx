import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
    let done = false;
    async function proceed(userId: string) {
      if (done) return;
      done = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", userId)
        .maybeSingle();
      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        toast.error("Your account has been disabled. Please contact an administrator.");
        done = false;
        return;
      }
      navigate({ to: "/dashboard", replace: true });
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) proceed(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && googleRef.current) {
        googleRef.current = false;
        supabase.rpc("record_login").then(() => logAudit("Login", "Signed in with Google"));
        proceed(session.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const googleRef = useRef(false);

  async function google() {
    if (busy) return;
    setBusy("Connecting to Google...");
    googleRef.current = true;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      googleRef.current = false;
      setBusy(null);
      toast.error("Google sign-in was cancelled or failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    setBusy(null);
  }

  const googleBlock = (
    <>
      <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full"
        disabled={!!busy}
        onClick={google}
      >
        <svg viewBox="0 0 48 48" className="mr-2 size-4" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
        </svg>
        Continue with Google
      </Button>
    </>
  );

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
                {googleBlock}
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
                {googleBlock}
                <p className="text-center text-xs text-muted-foreground">
                  New accounts stay pending until an administrator assigns a role.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
