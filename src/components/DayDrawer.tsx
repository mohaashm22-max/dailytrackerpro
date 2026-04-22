import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { COMMON_CATEGORIES, WORKOUT_GROUPS } from "@/data/template";
import { dateKey, workoutForDate, statusFromPercent } from "@/lib/dates";
import { useLocalState } from "@/lib/storage";
import {
  computeDayStats,
  DayState,
  emptyDayState,
  taskKey,
  WORKOUT_CAT_ID,
} from "@/lib/dayProgress";

interface Props {
  date: Date | null;
  onOpenChange: (open: boolean) => void;
}

export default function DayDrawer({ date, onOpenChange }: Props) {
  if (!date) return null;
  return (
    <Sheet open={!!date} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 overflow-y-auto scrollbar-thin"
      >
        <DayEditor date={date} />
      </SheetContent>
    </Sheet>
  );
}

function DayEditor({ date }: { date: Date }) {
  const key = `day:${dateKey(date)}`;
  const [state, setState] = useLocalState<DayState>(key, emptyDayState);
  const stats = useMemo(() => computeDayStats(state), [state]);
  const status = statusFromPercent(stats.percent);
  const workout = workoutForDate(date);

  // Ensure objects exist
  useEffect(() => {
    if (!state.checks || !state.notes) {
      setState((s) => ({ ...emptyDayState, ...s, checks: s.checks ?? {}, notes: s.notes ?? {} }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (k: string, v: boolean) =>
    setState((s) => ({ ...s, checks: { ...s.checks, [k]: v } }));
  const setNote = (k: string, v: string) =>
    setState((s) => ({ ...s, notes: { ...s.notes, [k]: v } }));

  return (
    <div className="flex flex-col">
      <SheetHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <SheetTitle className="text-lg">
              {format(date, "EEEE, MMMM d, yyyy")}
            </SheetTitle>
            <SheetDescription className="mt-1">
              Workout: <span className="font-medium text-foreground">{workout}</span>
            </SheetDescription>
          </div>
          <Badge className={status.className} variant="secondary">
            {status.label}
          </Badge>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{stats.done} / {stats.total} tasks</span>
            <span>{Math.round(stats.percent * 100)}%</span>
          </div>
          <Progress value={stats.percent * 100} className="h-2" />
        </div>
      </SheetHeader>

      <div className="px-6 py-6 space-y-6">
        {/* Workout block */}
        <CategoryCard
          id={WORKOUT_CAT_ID}
          title={workout}
          groups={WORKOUT_GROUPS}
          state={state}
          onToggle={toggle}
          onNote={setNote}
        />

        {COMMON_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            id={cat.id}
            title={cat.title}
            groups={cat.groups}
            state={state}
            onToggle={toggle}
            onNote={setNote}
          />
        ))}

        {/* Day note */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-semibold mb-3">📝 How was your day?</h3>
          <Textarea
            value={state.dayNote ?? ""}
            onChange={(e) =>
              setState((s) => ({ ...s, dayNote: e.target.value }))
            }
            placeholder="Reflections, wins, lessons…"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  id,
  title,
  groups,
  state,
  onToggle,
  onNote,
}: {
  id: string;
  title: string;
  groups: { title: string; tasks: string[] }[];
  state: DayState;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
}) {
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);
  const done = groups.reduce(
    (n, g, gi) => n + g.tasks.filter((_, ti) => state.checks[taskKey(id, gi, ti)]).length,
    0
  );
  const isRTL = /[\u0600-\u06FF]/.test(title);
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-base" dir={isRTL ? "rtl" : "ltr"}>{title}</h3>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {done}/{total}
        </span>
      </header>
      <div className="divide-y divide-border">
        {groups.map((g, gi) => (
          <div key={gi} className="px-5 py-3">
            {g.title && (
              <p
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                dir={/[\u0600-\u06FF]/.test(g.title) ? "rtl" : "ltr"}
              >
                {g.title}
              </p>
            )}
            <ul className="space-y-2">
              {g.tasks.map((task, ti) => {
                const k = taskKey(id, gi, ti);
                const checked = !!state.checks[k];
                const taskRTL = /[\u0600-\u06FF]/.test(task);
                return (
                  <li key={ti} className="group">
                    <label
                      className="flex items-start gap-3 cursor-pointer rounded-lg p-1.5 -mx-1.5 hover:bg-muted/40 transition-base"
                      dir={taskRTL ? "rtl" : "ltr"}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => onToggle(k, !!v)}
                        className="mt-0.5"
                      />
                      <span
                        className={
                          checked
                            ? "text-sm text-muted-foreground line-through"
                            : "text-sm text-foreground"
                        }
                      >
                        {task}
                      </span>
                    </label>
                    <Input
                      value={state.notes[k] ?? ""}
                      onChange={(e) => onNote(k, e.target.value)}
                      placeholder="Note…"
                      className="mt-1 ml-7 h-8 text-xs bg-muted/30 border-transparent focus:bg-card focus:border-input"
                      dir={taskRTL ? "rtl" : "ltr"}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
