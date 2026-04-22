import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { dateKey, workoutForDate, statusFromPercent } from "@/lib/dates";
import { useLocalState } from "@/lib/storage";
import {
  computeDayStats,
  DayState,
  EditableCategory,
  EditableGroup,
  emptyDayState,
  hydrateDayState,
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

/* ---------- Key remapping helpers (keep checks/notes aligned on edits) ---------- */

function remapAfterTaskChange(
  state: DayState,
  catId: string,
  groupIdx: number,
  transform: (taskIdx: number) => number | null,
): Pick<DayState, "checks" | "notes"> {
  const remap = (src: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      const [c, gi, ti] = k.split("|");
      if (c === catId && Number(gi) === groupIdx) {
        const newTi = transform(Number(ti));
        if (newTi === null) continue;
        out[taskKey(c, groupIdx, newTi)] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  };
  return { checks: remap(state.checks), notes: remap(state.notes) };
}

function remapAfterGroupChange(
  state: DayState,
  catId: string,
  transform: (groupIdx: number) => number | null,
): Pick<DayState, "checks" | "notes"> {
  const remap = (src: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      const [c, gi, ti] = k.split("|");
      if (c === catId) {
        const newGi = transform(Number(gi));
        if (newGi === null) continue;
        out[taskKey(c, newGi, Number(ti))] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  };
  return { checks: remap(state.checks), notes: remap(state.notes) };
}

function stripCategoryKeys(
  state: DayState,
  catId: string,
): Pick<DayState, "checks" | "notes"> {
  const filter = (src: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      if (!k.startsWith(catId + "|")) out[k] = v;
    }
    return out;
  };
  return { checks: filter(state.checks), notes: filter(state.notes) };
}

/* ---------- Day editor ---------- */

function DayEditor({ date }: { date: Date }) {
  const key = `day:${dateKey(date)}`;
  const [raw, setState] = useLocalState<DayState>(key, emptyDayState);
  const defaultDayName = workoutForDate(date);
  const state = useMemo(() => hydrateDayState(raw, defaultDayName), [raw, defaultDayName]);
  const stats = useMemo(() => computeDayStats(state), [state]);
  const status = statusFromPercent(stats.percent);

  // Persist hydration once on first open so storage shape is always normalized.
  useEffect(() => {
    if (!raw.workoutGroups || !raw.categories || raw.dayName === undefined) {
      setState(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (k: string, v: boolean) =>
    setState((s) => ({ ...s, checks: { ...s.checks, [k]: v } }));
  const setNote = (k: string, v: string) =>
    setState((s) => ({ ...s, notes: { ...s.notes, [k]: v } }));

  /* --- Mutators (workout + categories share a unified shape) --- */

  const updateGroups = (
    catId: string,
    updater: (groups: EditableGroup[]) => EditableGroup[],
  ) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      if (catId === WORKOUT_CAT_ID) {
        return { ...base, workoutGroups: updater(base.workoutGroups!) };
      }
      return {
        ...base,
        categories: base.categories!.map((c) =>
          c.id === catId ? { ...c, groups: updater(c.groups) } : c,
        ),
      };
    });
  };

  const addTask = (catId: string, groupIdx: number) =>
    updateGroups(catId, (gs) =>
      gs.map((g, i) => (i === groupIdx ? { ...g, tasks: [...g.tasks, "New task"] } : g)),
    );

  const updateTaskText = (catId: string, groupIdx: number, taskIdx: number, text: string) =>
    updateGroups(catId, (gs) =>
      gs.map((g, i) =>
        i === groupIdx
          ? { ...g, tasks: g.tasks.map((t, ti) => (ti === taskIdx ? text : t)) }
          : g,
      ),
    );

  const deleteTask = (catId: string, groupIdx: number, taskIdx: number) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const remap = remapAfterTaskChange(base, catId, groupIdx, (ti) =>
        ti === taskIdx ? null : ti > taskIdx ? ti - 1 : ti,
      );
      const next: DayState = { ...base, ...remap };
      if (catId === WORKOUT_CAT_ID) {
        next.workoutGroups = base.workoutGroups!.map((g, i) =>
          i === groupIdx ? { ...g, tasks: g.tasks.filter((_, ti) => ti !== taskIdx) } : g,
        );
      } else {
        next.categories = base.categories!.map((c) =>
          c.id === catId
            ? {
                ...c,
                groups: c.groups.map((g, i) =>
                  i === groupIdx
                    ? { ...g, tasks: g.tasks.filter((_, ti) => ti !== taskIdx) }
                    : g,
                ),
              }
            : c,
        );
      }
      return next;
    });
  };

  const addGroup = (catId: string) =>
    updateGroups(catId, (gs) => [...gs, { title: "New group", tasks: [] }]);

  const updateGroupTitle = (catId: string, groupIdx: number, title: string) =>
    updateGroups(catId, (gs) => gs.map((g, i) => (i === groupIdx ? { ...g, title } : g)));

  const deleteGroup = (catId: string, groupIdx: number) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const remap = remapAfterGroupChange(base, catId, (gi) =>
        gi === groupIdx ? null : gi > groupIdx ? gi - 1 : gi,
      );
      const next: DayState = { ...base, ...remap };
      if (catId === WORKOUT_CAT_ID) {
        next.workoutGroups = base.workoutGroups!.filter((_, i) => i !== groupIdx);
      } else {
        next.categories = base.categories!.map((c) =>
          c.id === catId
            ? { ...c, groups: c.groups.filter((_, i) => i !== groupIdx) }
            : c,
        );
      }
      return next;
    });
  };

  const updateCategoryTitle = (catId: string, title: string) =>
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      if (catId === WORKOUT_CAT_ID) return { ...base, dayName: title };
      return {
        ...base,
        categories: base.categories!.map((c) => (c.id === catId ? { ...c, title } : c)),
      };
    });

  const addCategory = () =>
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const newCat: EditableCategory = {
        id: `cat-${Date.now()}`,
        title: "New section",
        groups: [{ title: "", tasks: ["New task"] }],
      };
      return { ...base, categories: [...base.categories!, newCat] };
    });

  const deleteCategory = (catId: string) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const stripped = stripCategoryKeys(base, catId);
      return {
        ...base,
        ...stripped,
        categories: base.categories!.filter((c) => c.id !== catId),
      };
    });
  };

  return (
    <div className="flex flex-col">
      <SheetHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg">
              {format(date, "EEEE, MMMM d, yyyy")}
            </SheetTitle>
            <SheetDescription className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Day name:</span>
              <Input
                value={state.dayName ?? ""}
                onChange={(e) => updateCategoryTitle(WORKOUT_CAT_ID, e.target.value)}
                placeholder="Name this day…"
                className="h-7 text-sm font-medium bg-muted/40 border-transparent focus:bg-card focus:border-input"
              />
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
        {/* Workout block — uses dayName as title, can't be removed */}
        <CategoryCard
          id={WORKOUT_CAT_ID}
          title={state.dayName || "Workout"}
          groups={state.workoutGroups!}
          state={state}
          removable={false}
          onTitleChange={(t) => updateCategoryTitle(WORKOUT_CAT_ID, t)}
          onToggle={toggle}
          onNote={setNote}
          onAddTask={addTask}
          onUpdateTask={updateTaskText}
          onDeleteTask={deleteTask}
          onAddGroup={addGroup}
          onUpdateGroupTitle={updateGroupTitle}
          onDeleteGroup={deleteGroup}
        />

        {state.categories!.map((cat) => (
          <CategoryCard
            key={cat.id}
            id={cat.id}
            title={cat.title}
            groups={cat.groups}
            state={state}
            removable
            onTitleChange={(t) => updateCategoryTitle(cat.id, t)}
            onDelete={() => deleteCategory(cat.id)}
            onToggle={toggle}
            onNote={setNote}
            onAddTask={addTask}
            onUpdateTask={updateTaskText}
            onDeleteTask={deleteTask}
            onAddGroup={addGroup}
            onUpdateGroupTitle={updateGroupTitle}
            onDeleteGroup={deleteGroup}
          />
        ))}

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={addCategory}
        >
          <Plus className="h-4 w-4" /> Add section
        </Button>

        {/* Day note */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-semibold mb-3">📝 How was your day?</h3>
          <Textarea
            value={state.dayNote ?? ""}
            onChange={(e) =>
              setState((s) => ({ ...hydrateDayState(s, defaultDayName), dayNote: e.target.value }))
            }
            placeholder="Reflections, wins, lessons…"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Category card ---------- */

interface CategoryCardProps {
  id: string;
  title: string;
  groups: EditableGroup[];
  state: DayState;
  removable: boolean;
  onTitleChange: (title: string) => void;
  onDelete?: () => void;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
  onAddTask: (catId: string, groupIdx: number) => void;
  onUpdateTask: (catId: string, groupIdx: number, taskIdx: number, text: string) => void;
  onDeleteTask: (catId: string, groupIdx: number, taskIdx: number) => void;
  onAddGroup: (catId: string) => void;
  onUpdateGroupTitle: (catId: string, groupIdx: number, title: string) => void;
  onDeleteGroup: (catId: string, groupIdx: number) => void;
}

function CategoryCard({
  id,
  title,
  groups,
  state,
  removable,
  onTitleChange,
  onDelete,
  onToggle,
  onNote,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddGroup,
  onUpdateGroupTitle,
  onDeleteGroup,
}: CategoryCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);

  useEffect(() => setTitleDraft(title), [title]);

  const total = groups.reduce((n, g) => n + g.tasks.length, 0);
  const done = groups.reduce(
    (n, g, gi) => n + g.tasks.filter((_, ti) => state.checks[taskKey(id, gi, ti)]).length,
    0,
  );
  const isRTL = /[\u0600-\u06FF]/.test(title);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-muted/30">
        {editingTitle ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              autoFocus
              className="h-8 text-sm font-semibold"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onTitleChange(titleDraft);
                  setEditingTitle(false);
                }
                if (e.key === "Escape") {
                  setTitleDraft(title);
                  setEditingTitle(false);
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                onTitleChange(titleDraft);
                setEditingTitle(false);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                setTitleDraft(title);
                setEditingTitle(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <h3
            className="font-semibold text-base flex-1 min-w-0 truncate"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {title || "Untitled section"}
          </h3>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-medium text-muted-foreground tabular-nums mr-1">
            {done}/{total}
          </span>
          {!editingTitle && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setEditingTitle(true)}
              aria-label="Rename section"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {removable && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </header>
      <div className="divide-y divide-border">
        {groups.map((g, gi) => (
          <GroupBlock
            key={gi}
            catId={id}
            groupIdx={gi}
            group={g}
            state={state}
            onToggle={onToggle}
            onNote={onNote}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onUpdateGroupTitle={onUpdateGroupTitle}
            onDeleteGroup={onDeleteGroup}
          />
        ))}
        <div className="px-5 py-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onAddGroup(id)}
          >
            <Plus className="h-3.5 w-3.5" /> Add group
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Group block ---------- */

function GroupBlock({
  catId,
  groupIdx,
  group,
  state,
  onToggle,
  onNote,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateGroupTitle,
  onDeleteGroup,
}: {
  catId: string;
  groupIdx: number;
  group: EditableGroup;
  state: DayState;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
  onAddTask: (catId: string, groupIdx: number) => void;
  onUpdateTask: (catId: string, groupIdx: number, taskIdx: number, text: string) => void;
  onDeleteTask: (catId: string, groupIdx: number, taskIdx: number) => void;
  onUpdateGroupTitle: (catId: string, groupIdx: number, title: string) => void;
  onDeleteGroup: (catId: string, groupIdx: number) => void;
}) {
  const isRTL = /[\u0600-\u06FF]/.test(group.title);
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-1 mb-2">
        <Input
          value={group.title}
          onChange={(e) => onUpdateGroupTitle(catId, groupIdx, e.target.value)}
          placeholder="Group title (optional)"
          dir={isRTL ? "rtl" : "ltr"}
          className="h-7 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-transparent border-transparent hover:border-input focus:border-input px-2"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDeleteGroup(catId, groupIdx)}
          aria-label="Delete group"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ul className="space-y-2">
        {group.tasks.map((task, ti) => (
          <TaskRow
            key={ti}
            catId={catId}
            groupIdx={groupIdx}
            taskIdx={ti}
            task={task}
            state={state}
            onToggle={onToggle}
            onNote={onNote}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </ul>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 mt-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => onAddTask(catId, groupIdx)}
      >
        <Plus className="h-3.5 w-3.5" /> Add task
      </Button>
    </div>
  );
}

/* ---------- Task row ---------- */

function TaskRow({
  catId,
  groupIdx,
  taskIdx,
  task,
  state,
  onToggle,
  onNote,
  onUpdateTask,
  onDeleteTask,
}: {
  catId: string;
  groupIdx: number;
  taskIdx: number;
  task: string;
  state: DayState;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
  onUpdateTask: (catId: string, groupIdx: number, taskIdx: number, text: string) => void;
  onDeleteTask: (catId: string, groupIdx: number, taskIdx: number) => void;
}) {
  const k = taskKey(catId, groupIdx, taskIdx);
  const checked = !!state.checks[k];
  const taskRTL = /[\u0600-\u06FF]/.test(task);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  useEffect(() => setDraft(task), [task]);

  return (
    <li className="group">
      <div
        className="flex items-start gap-2 rounded-lg p-1.5 -mx-1.5 hover:bg-muted/40 transition-base"
        dir={taskRTL ? "rtl" : "ltr"}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onToggle(k, !!v)}
          className="mt-1"
        />
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            dir={/[\u0600-\u06FF]/.test(draft) ? "rtl" : "ltr"}
            onBlur={() => {
              onUpdateTask(catId, groupIdx, taskIdx, draft);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdateTask(catId, groupIdx, taskIdx, draft);
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(task);
                setEditing(false);
              }
            }}
            className="h-8 text-sm flex-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={
              "flex-1 text-left text-sm cursor-text " +
              (checked
                ? "text-muted-foreground line-through"
                : "text-foreground")
            }
          >
            {task || <span className="text-muted-foreground italic">Empty task</span>}
          </button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={() => onDeleteTask(catId, groupIdx, taskIdx)}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Input
        value={state.notes[k] ?? ""}
        onChange={(e) => onNote(k, e.target.value)}
        placeholder="Note…"
        className="mt-1 ml-7 h-8 text-xs bg-muted/30 border-transparent focus:bg-card focus:border-input"
        dir={taskRTL ? "rtl" : "ltr"}
      />
    </li>
  );
}
