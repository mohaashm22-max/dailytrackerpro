import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Loader2, LogOut, Moon, Sun, Languages, KeyRound, Check, X as XIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_CHECKS, isPasswordStrong } from "@/lib/passwordPolicy";
import { CountrySelect } from "@/components/CountrySelect";
import { LanguageSelector } from "@/components/LanguageSelector";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, update, refresh } = useProfile();
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, t } = useLanguage();

  const [name, setName] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setCountry(profile?.address ?? null);
  }, [profile]);

  const initial = (profile?.display_name || user?.email || "?").toString().charAt(0).toUpperCase();

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await update({ display_name: name.trim() || null, address: country });
    setSavingProfile(false);
    if (error) toast.error(error);
    else toast.success(t("settings.saved"));
  };

  const handleAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.invalidImage"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("settings.imageTooLarge"));
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error } = await update({ avatar_url: url });
    setUploading(false);
    if (error) toast.error(error);
    else {
      toast.success(t("settings.avatarUpdated"));
      await refresh();
    }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (!isPasswordStrong(newPw)) {
      toast.error(t("settings.weakPassword"));
      return;
    }
    setPwSubmitting(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    });
    if (signInErr) {
      setPwSubmitting(false);
      toast.error(t("settings.wrongCurrentPw"));
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("settings.passwordUpdated"));
    setPwOpen(false);
    setCurrentPw("");
    setNewPw("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </header>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-base hover:opacity-90 disabled:opacity-50"
                aria-label={t("settings.changeAvatar")}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("settings.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t("country.label")}</Label>
              <CountrySelect id="country" value={country} onChange={setCountry} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.preferences")}</CardTitle>
          <CardDescription>{t("settings.preferencesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <p className="text-sm font-medium">{t("settings.theme")}</p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? t("settings.darkMode") : t("settings.lightMode")}
                </p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">{t("settings.language")}</p>
                <p className="text-xs text-muted-foreground">{lang.toUpperCase()}</p>
              </div>
            </div>
            <LanguageSelector align="end" />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account")}</CardTitle>
          <CardDescription>{t("settings.accountDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setPwOpen(true)}>
            <KeyRound className="h-4 w-4" />
            {t("settings.resetPassword")}
          </Button>
          <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            {t("common.signOut")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.resetPassword")}</DialogTitle>
            <DialogDescription>{t("settings.resetPasswordDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pw">{t("settings.currentPassword")}</Label>
              <Input
                id="cur-pw"
                type={showPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">{t("settings.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPw.length > 0 && (
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 pt-1">
                  {PASSWORD_CHECKS.map((c) => {
                    const ok = c.test(newPw);
                    return (
                      <li
                        key={c.id}
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                      >
                        {ok ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                        {c.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPwOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={pwSubmitting || !isPasswordStrong(newPw) || !currentPw}>
                {pwSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
