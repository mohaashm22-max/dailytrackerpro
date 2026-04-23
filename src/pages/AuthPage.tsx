import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, LogIn, Mail, Lock, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { PASSWORD_CHECKS, isPasswordStrong, passwordScore, strengthLabel } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

const emailSchema = z.string().trim().email({ message: "Enter a valid email" }).max(255);

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // Signup state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const score = useMemo(() => passwordScore(signupPassword), [signupPassword]);
  const strength = strengthLabel(score);
  const passwordsMatch = confirmPassword.length > 0 && signupPassword === confirmPassword;

  useEffect(() => {
    if (user && !loading) navigate(from, { replace: true });
  }, [user, loading, from, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to={from} replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(loginEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!loginPassword) {
      toast.error("Enter your password");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data,
      password: loginPassword,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("invalid")
        ? "Invalid email or password"
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Welcome back!");
    navigate(from, { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(signupEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!isPasswordStrong(signupPassword)) {
      toast.error("Password does not meet all requirements");
      return;
    }
    if (signupPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name.trim() || parsed.data.split("@")[0] },
      },
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("already")
        ? "An account with this email already exists"
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Account created! You're signed in.");
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/`,
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(forgotEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset email sent — check your inbox.");
    setForgotMode(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary-soft/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 h-12 w-12 rounded-2xl gradient-primary shadow-soft" />
          <h1 className="text-2xl font-semibold tracking-tight">Daily Tracker</h1>
          <p className="text-sm text-muted-foreground">Sign in to sync your year, your way.</p>
        </div>

        <Card className="border-border/60 shadow-soft">
          {forgotMode ? (
            <>
              <CardHeader>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a reset link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        className="pl-9"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send reset link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setForgotMode(false)}
                  >
                    Back to sign in
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-6 space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            className="pl-9"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <button
                            type="button"
                            onClick={() => setForgotMode(true)}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            className="pl-9 pr-10"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPw ? "Hide password" : "Show password"}
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={remember}
                          onCheckedChange={(v) => setRemember(Boolean(v))}
                        />
                        <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                          Remember me on this device
                        </Label>
                      </div>
                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4" />
                        )}
                        Sign in
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6 space-y-4">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Name</Label>
                        <div className="relative">
                          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            autoComplete="name"
                            className="pl-9"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            maxLength={80}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            className="pl-9"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPw ? "text" : "password"}
                            autoComplete="new-password"
                            className="pl-9 pr-10"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPw ? "Hide password" : "Show password"}
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        {signupPassword.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="flex h-1.5 gap-1">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "h-full flex-1 rounded-full transition-colors",
                                    i < score ? strength.color : "bg-muted",
                                  )}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Strength: <span className="font-medium text-foreground">{strength.label}</span>
                            </p>
                            <ul className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2">
                              {PASSWORD_CHECKS.map((c) => {
                                const ok = c.test(signupPassword);
                                return (
                                  <li
                                    key={c.id}
                                    className={cn(
                                      "flex items-center gap-1.5 text-xs",
                                      ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                                    )}
                                  >
                                    {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                    {c.label}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirm-password"
                            type={showPw ? "text" : "password"}
                            autoComplete="new-password"
                            className="pl-9"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                        {confirmPassword.length > 0 && (
                          <p
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              passwordsMatch
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive",
                            )}
                          >
                            {passwordsMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitting || !isPasswordStrong(signupPassword) || !passwordsMatch}
                      >
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Create account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogle}
                  disabled={submitting}
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By continuing you agree to our{" "}
                  <Link to="/" className="underline-offset-4 hover:underline">Terms</Link>{" "}
                  and{" "}
                  <Link to="/" className="underline-offset-4 hover:underline">Privacy Policy</Link>.
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1S8.69 6 12 6c1.88 0 3.14.8 3.86 1.49l2.64-2.55C16.94 3.46 14.7 2.5 12 2.5 6.75 2.5 2.5 6.75 2.5 12s4.25 9.5 9.5 9.5c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.1-.16-1.53H12z"
      />
    </svg>
  );
}
