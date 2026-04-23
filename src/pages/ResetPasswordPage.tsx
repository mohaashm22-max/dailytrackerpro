import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_CHECKS, isPasswordStrong, passwordScore, strengthLabel } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);
  const strength = strengthLabel(score);
  const match = confirm.length > 0 && password === confirm;

  useEffect(() => {
    // Supabase places recovery tokens in the URL hash; the SDK auto-handles them.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong(password)) {
      toast.error("Password does not meet all requirements");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary-soft/40 px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            {ready
              ? "Enter a strong password to finish resetting your account."
              : "Open the reset link from your email to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
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
                  <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {PASSWORD_CHECKS.map((c) => {
                      const ok = c.test(password);
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
              <Label htmlFor="confirm-new">Confirm password</Label>
              <Input
                id="confirm-new"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!ready}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !ready || !isPasswordStrong(password) || !match}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
