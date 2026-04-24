import { CalendarDays, BarChart3, NotebookPen, LogOut, Languages } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { t, toggle, lang } = useLanguage();

  const NAV = [
    { to: "/", labelKey: "nav.calendar", icon: CalendarDays, end: true },
    { to: "/analysis", labelKey: "nav.analysis", icon: BarChart3 },
    { to: "/notes", labelKey: "nav.notes", icon: NotebookPen },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("common.signOut"));
  };
  const initial = (user?.user_metadata?.display_name || user?.email || "?")
    .toString()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl gradient-primary shadow-soft" />
            <div>
              <p className="text-sm font-semibold tracking-tight">Daily Tracker</p>
              <p className="text-xs text-muted-foreground">2026</p>
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
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={toggle}
            aria-label="Toggle language"
          >
            <Languages className="h-4 w-4" />
            {t("lang.toggle")}
          </Button>
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {user?.user_metadata?.display_name || user?.email}
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
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
          <button
            onClick={toggle}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground"
            aria-label="Toggle language"
          >
            <Languages className="h-5 w-5" />
            {lang === "en" ? "AR" : "EN"}
          </button>
        </div>
      </nav>
    </div>
  );
}
