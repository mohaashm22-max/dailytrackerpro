import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flame, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { dateKey, isInTracker, startDate, endDate, workoutForDate } from "@/lib/dates";
import { loadJSON, saveJSON } from "@/lib/storage";
import { computeDayStats, DayState, emptyDayState, hydrateDayState } from "@/lib/dayProgress";
import DayDrawer from "@/components/DayDrawer";

function monthMatrix(month: Date): Date[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
  return rows;
}

export default function CalendarPage() {
  const today = new Date();
  const initialMonth = today >= startDate && today <= endDate ? today : startDate;
  const [month, setMonth] = useState(startOfMonth(initialMonth));
  const [selected, setSelected] = useState<Date | null>(null);

  const matrix = useMemo(() => monthMatrix(month), [month]);

  // Load percent + dayName map for visible days
  const [bump, setBump] = useState(0);
  const dayInfo = useMemo(() => {
    const out: Record<string, { percent: number; dayName: string }> = {};
    matrix.flat().forEach((d) => {
      if (!isInTracker(d)) return;
      const k = dateKey(d);
      const s = loadJSON<DayState>(`day:${k}`, emptyDayState);
      out[k] = {
        percent: computeDayStats(s).percent,
        dayName: s.dayName ?? workoutForDate(d),
      };
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix, bump]);

  // Inline edit state for a day's name
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const commitDayName = (d: Date, name: string) => {
    const k = dateKey(d);
    const existing = loadJSON<DayState>(`day:${k}`, emptyDayState);
    const hydrated = hydrateDayState(existing, workoutForDate(d));
    saveJSON(`day:${k}`, { ...hydrated, dayName: name });
    setEditingKey(null);
    setBump((b) => b + 1);
  };

  const canPrev = month > startOfMonth(startDate);
  const canNext = month < startOfMonth(endDate);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tap any day to open its tasks. Tracker runs {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={!canPrev}
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[10rem] text-center text-sm font-semibold">
            {format(month, "MMMM yyyy")}
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled={!canNext}
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => {
              setMonth(startOfMonth(today >= startDate && today <= endDate ? today : startDate));
              if (isInTracker(today)) setSelected(today);
            }}
          >
            Today
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {matrix.flat().map((d) => {
            const inMonth = isSameMonth(d, month);
            const inTracker = isInTracker(d);
            const k = dateKey(d);
            const info = dayInfo[k];
            const pct = info?.percent ?? 0;
            const dayName = info?.dayName ?? workoutForDate(d);
            const isToday = isSameDay(d, today);
            const isEditing = editingKey === k;
            return (
              <div
                key={k}
                className={cn(
                  "group relative min-h-[5.5rem] md:min-h-[6.5rem] border-r border-b border-border p-2 transition-base",
                  !inMonth && "bg-muted/30",
                  !inTracker && "opacity-50",
                  inTracker && !isEditing && "hover:bg-primary-soft/60 cursor-pointer"
                )}
                onClick={() => {
                  if (!inTracker || isEditing) return;
                  setSelected(d);
                }}
                role={inTracker ? "button" : undefined}
                tabIndex={inTracker && !isEditing ? 0 : -1}
                onKeyDown={(e) => {
                  if (!inTracker || isEditing) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(d);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                      !inMonth && "text-muted-foreground"
                    )}
                  >
                    {format(d, "d")}
                  </span>
                  {inTracker && pct >= 0.85 && (
                    <Flame className="h-3.5 w-3.5 text-accent" />
                  )}
                </div>

                {inTracker && (
                  <div className="mt-1.5">
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={editDraft}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onBlur={() => commitDayName(d, editDraft.trim())}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") commitDayName(d, editDraft.trim());
                          if (e.key === "Escape") setEditingKey(null);
                        }}
                        className="h-6 text-[11px] px-1.5"
                        placeholder="Day name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditDraft(dayName);
                          setEditingKey(k);
                        }}
                        className="group/name flex w-full flex-col items-start gap-0.5 rounded px-1 py-0.5 text-left hover:bg-muted/70"
                        title="Rename this day"
                      >
                        <span className="flex w-full items-center gap-1">
                          <span className="truncate flex-1 text-[11px] font-medium text-foreground/80">
                            {dayName || <span className="text-muted-foreground/60 italic">Untitled</span>}
                          </span>
                          <Pencil className="h-3 w-3 opacity-0 group-hover/name:opacity-60 shrink-0" />
                        </span>
                        <span className={cn(
                          "text-[10px] tabular-nums font-semibold",
                          pct >= 0.85 ? "text-accent"
                            : pct >= 0.5 ? "text-primary"
                            : pct > 0 ? "text-warning"
                            : "text-muted-foreground/60"
                        )}>
                          {Math.round(pct * 100)}%
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {inTracker && (
                  <div className="absolute inset-x-2 bottom-2">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct >= 0.85
                            ? "bg-accent"
                            : pct >= 0.5
                            ? "bg-primary"
                            : pct > 0
                            ? "bg-warning"
                            : "bg-transparent"
                        )}
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DayDrawer
        date={selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setBump((b) => b + 1);
          }
        }}
      />
    </div>
  );
}
