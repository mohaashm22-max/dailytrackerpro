import { CalendarDays, BarChart3, NotebookPen } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Calendar", icon: CalendarDays, end: true },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: NotebookPen },
];

export default function AppShell() {
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
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          Saved locally on this device.
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
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
