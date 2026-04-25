import { CalendarDays, BarChart3, NotebookPen, LogOut, Settings as SettingsIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/contexts/ProfileContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { toast } from "sonner";

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { profile } = useProfile();

  const NAV = [
    { to: "/", labelKey: "nav.calendar", icon: CalendarDays, end: true },
    { to: "/analysis", labelKey: "nav.analysis", icon: BarChart3 },
    { to: "/notes", labelKey: "nav.notes", icon: NotebookPen },
    { to: "/settings", labelKey: "nav.settings", icon: SettingsIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("common.signOut"));
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email || "?";
  const initial = displayName.toString().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-primary shadow-soft" />
            <div>
              <p className="text-sm font-semibold tracking-tight">{t("brand.title")}</p>
              <p className="text-xs text-muted-foreground">{t("brand.year")}</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-base",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {profile?.display_name || user?.user_metadata?.display_name || user?.email}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {t("common.signOut")}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border/60 bg-background/80 px-4 py-2 backdrop-blur md:px-6">
          <LanguageSelector compact />
        </header>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="flex items-stretch justify-around">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-base",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {item.to === "/settings" ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
