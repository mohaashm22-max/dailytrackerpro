import { useEffect, useMemo, useState } from "react";
import { useLanguage, statusKeyFromPercent } from "@/contexts/LanguageContext";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  Layers,
  FolderOpen,
  NotebookPen,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { dateKey, workoutForDate, statusFromPercent } from "@/lib/dates";
import { useLocalState } from "@/lib/storage";
import {
  computeDayStats,
  DayState,
  EditableBlock,
  EditableSection,
  emptyDayState,
  hydrateDayState,
  taskKey,
} from "@/lib/dayProgress";
import { cn } from "@/lib/utils";

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
  blockId: string,
  sectionIdx: number,
  transform: (taskIdx: number) => number | null,
): Pick<DayState, "checks" | "notes"> {
  const remap = (src: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      const [b, si, ti] = k.split("|");
      if (b === blockId && Number(si) === sectionIdx) {
        const newTi = transform(Number(ti));
        if (newTi === null) continue;
        out[taskKey(b, sectionIdx, newTi)] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  };
  return { checks: remap(state.checks), notes: remap(state.notes) };
}

function remapAfterSectionChange(
  state: DayState,
  blockId: string,
  transform: (sectionIdx: number) => number | null,
): Pick<DayState, "checks" | "notes"> {
  const remap = (src: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      const [b, si, ti] = k.split("|");
      if (b === blockId) {
        const newSi = transform(Number(si));
        if (newSi === null) continue;
        out[taskKey(b, newSi, Number(ti))] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  };
  return { checks: remap(state.checks), notes: remap(state.notes) };
}

function stripBlockKeys(
  state: DayState,
  blockId: string,
): Pick<DayState, "checks" | "notes"> {
  const filter = (src: Record<string, any>) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(src)) {
      if (!k.startsWith(blockId + "|")) out[k] = v;
    }
    return out;
  };
  return { checks: filter(state.checks), notes: filter(state.notes) };
}

const isRTL = (s: string) => /[\u0600-\u06FF]/.test(s);

/* ---------- Day editor ---------- */

function DayEditor({ date }: { date: Date }) {
  const { t, format } = useLanguage();
  const key = `day:${dateKey(date)}`;
  const [raw, setState] = useLocalState<DayState>(key, emptyDayState);
  const defaultDayName = workoutForDate(date);
  const state = useMemo(() => hydrateDayState(raw, defaultDayName), [raw, defaultDayName]);
  const stats = useMemo(() => computeDayStats(state), [state]);
  const status = statusFromPercent(stats.percent);
  const statusLabel = t(statusKeyFromPercent(stats.percent));

  // Persist hydration once on first open so storage shape is always normalized.
  useEffect(() => {
    if (!raw.blocks || raw.workoutGroups || raw.categories || raw.dayName === undefined) {
      setState(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (k: string, v: boolean) =>
    setState((s) => ({ ...s, checks: { ...s.checks, [k]: v } }));
  const setNote = (k: string, v: string) =>
    setState((s) => ({ ...s, notes: { ...s.notes, [k]: v } }));

  /* --- Block / section / task mutators --- */

  const updateBlocks = (updater: (blocks: EditableBlock[]) => EditableBlock[]) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      return { ...base, blocks: updater(base.blocks!) };
    });
  };

  const setDayName = (name: string) =>
    setState((s) => ({ ...hydrateDayState(s, defaultDayName), dayName: name }));

  // Block mutators
  const addBlock = () =>
    updateBlocks((bs) => [
      ...bs,
      {
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: t("day.newBlock"),
        sections: [{ title: t("day.newSection"), tasks: [] }],
      },
    ]);

  const updateBlockTitle = (blockId: string, title: string) =>
    updateBlocks((bs) => bs.map((b) => (b.id === blockId ? { ...b, title } : b)));

  const deleteBlock = (blockId: string) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const stripped = stripBlockKeys(base, blockId);
      return {
        ...base,
        ...stripped,
        blocks: base.blocks!.filter((b) => b.id !== blockId),
      };
    });
  };

  // Section mutators
  const addSection = (blockId: string) =>
    updateBlocks((bs) =>
      bs.map((b) =>
        b.id === blockId
          ? { ...b, sections: [...b.sections, { title: t("day.newSection"), tasks: [] }] }
          : b,
      ),
    );

  const updateSectionTitle = (blockId: string, sectionIdx: number, title: string) =>
    updateBlocks((bs) =>
      bs.map((b) =>
        b.id === blockId
          ? {
              ...b,
              sections: b.sections.map((s, i) => (i === sectionIdx ? { ...s, title } : s)),
            }
          : b,
      ),
    );

  const deleteSection = (blockId: string, sectionIdx: number) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const remap = remapAfterSectionChange(base, blockId, (si) =>
        si === sectionIdx ? null : si > sectionIdx ? si - 1 : si,
      );
      return {
        ...base,
        ...remap,
        blocks: base.blocks!.map((b) =>
          b.id === blockId
            ? { ...b, sections: b.sections.filter((_, i) => i !== sectionIdx) }
            : b,
        ),
      };
    });
  };

  // Task mutators
  const addTask = (blockId: string, sectionIdx: number) =>
    updateBlocks((bs) =>
      bs.map((b) =>
        b.id === blockId
          ? {
              ...b,
              sections: b.sections.map((s, i) =>
                i === sectionIdx ? { ...s, tasks: [...s.tasks, t("day.newTask")] } : s,
              ),
            }
          : b,
      ),
    );

  const updateTaskText = (
    blockId: string,
    sectionIdx: number,
    taskIdx: number,
    text: string,
  ) =>
    updateBlocks((bs) =>
      bs.map((b) =>
        b.id === blockId
          ? {
              ...b,
              sections: b.sections.map((s, i) =>
                i === sectionIdx
                  ? { ...s, tasks: s.tasks.map((t, ti) => (ti === taskIdx ? text : t)) }
                  : s,
              ),
            }
          : b,
      ),
    );

  const deleteTask = (blockId: string, sectionIdx: number, taskIdx: number) => {
    setState((s) => {
      const base = hydrateDayState(s, defaultDayName);
      const remap = remapAfterTaskChange(base, blockId, sectionIdx, (ti) =>
        ti === taskIdx ? null : ti > taskIdx ? ti - 1 : ti,
      );
      return {
        ...base,
        ...remap,
        blocks: base.blocks!.map((b) =>
          b.id === blockId
            ? {
                ...b,
                sections: b.sections.map((s, i) =>
                  i === sectionIdx
                    ? { ...s, tasks: s.tasks.filter((_, ti) => ti !== taskIdx) }
                    : s,
                ),
              }
            : b,
        ),
      };
    });
  };

  return (
    <div className="flex flex-col">
      <SheetHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg" dir="ltr">
              {format(date, "EEEE, MMMM d, yyyy")}
            </SheetTitle>
            <SheetDescription className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">{t("day.dayName")}</span>
              <Input
                value={state.dayName ?? ""}
                onChange={(e) => setDayName(e.target.value)}
                dir={isRTL(state.dayName ?? "") ? "rtl" : "ltr"}
                className="h-7 text-sm font-medium bg-muted/40 border-transparent focus:bg-card focus:border-input"
              />
            </SheetDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {stats.percent > 0 && (
              <Badge className={status.className} variant="secondary">
                {statusLabel}
              </Badge>
            )}
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={t("common.close")}>
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </div>
        {stats.total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{t("day.tasksOf", { done: stats.done, total: stats.total })}</span>
              <span>{Math.round(stats.percent * 100)}%</span>
            </div>
            <Progress value={stats.percent * 100} className="h-2" />
          </div>
        )}
      </SheetHeader>

      <div className="px-6 py-6 space-y-4">
        {state.blocks!.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            {t("day.noBlocks")}
          </div>
        )}

        {state.blocks!.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            state={state}
            onTitleChange={(t) => updateBlockTitle(block.id, t)}
            onDelete={() => deleteBlock(block.id)}
            onAddSection={() => addSection(block.id)}
            onUpdateSectionTitle={(si, t) => updateSectionTitle(block.id, si, t)}
            onDeleteSection={(si) => deleteSection(block.id, si)}
            onAddTask={(si) => addTask(block.id, si)}
            onUpdateTask={(si, ti, t) => updateTaskText(block.id, si, ti, t)}
            onDeleteTask={(si, ti) => deleteTask(block.id, si, ti)}
            onToggle={toggle}
            onNote={setNote}
          />
        ))}

        <Button variant="outline" className="w-full gap-2" onClick={addBlock}>
          <Plus className="h-4 w-4" /> {t("day.addBlock")}
        </Button>

        {/* Linked notes from Notes page */}
        <LinkedNotesList dateKey={dateKey(date)} />

        {/* Day note */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft" dir="ltr">
          <h3 className="font-semibold mb-3 text-left">{t("day.dayNote")}</h3>
          <Textarea
            value={state.dayNote ?? ""}
            onChange={(e) =>
              setState((s) => ({ ...hydrateDayState(s, defaultDayName), dayNote: e.target.value }))
            }
            dir="ltr"
            className="text-left"
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Linked notes (from Notes page) ---------- */

function LinkedNotesList({ dateKey }: { dateKey: string }) {
  const { t } = useLanguage();
  const [notes] = useLocalState<Array<{ id: string; title: string; body: string; updatedAt: number; linkedDate?: string | null }>>("notes", []);
  const linked = notes.filter((n) => n.linkedDate === dateKey);
  if (linked.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-primary" />
        {t("day.linkedNotes")}
      </h3>
      <ul className="space-y-3">
        {linked.map((n) => (
          <li key={n.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-sm font-semibold mb-1">{n.title || t("common.untitled")}</p>
            <div
              className="text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: n.body || "" }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Block card (top level) ---------- */

interface BlockCardProps {
  block: EditableBlock;
  state: DayState;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onAddSection: () => void;
  onUpdateSectionTitle: (sectionIdx: number, title: string) => void;
  onDeleteSection: (sectionIdx: number) => void;
  onAddTask: (sectionIdx: number) => void;
  onUpdateTask: (sectionIdx: number, taskIdx: number, text: string) => void;
  onDeleteTask: (sectionIdx: number, taskIdx: number) => void;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
}

function BlockCard({
  block,
  state,
  onTitleChange,
  onDelete,
  onAddSection,
  onUpdateSectionTitle,
  onDeleteSection,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggle,
  onNote,
}: BlockCardProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(block.title);
  useEffect(() => setTitleDraft(block.title), [block.title]);

  const totals = block.sections.reduce(
    (acc, sec, si) => {
      const t = sec.tasks.length;
      const d = sec.tasks.filter((_, ti) => state.checks[taskKey(block.id, si, ti)]).length;
      return { done: acc.done + d, total: acc.total + t };
    },
    { done: 0, total: 0 },
  );
  const pct = totals.total ? totals.done / totals.total : 0;
  const rtl = isRTL(block.title);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
            aria-label={open ? "Collapse block" : "Expand block"}
          >
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", !open && "-rotate-90")}
            />
            <Layers className="h-4 w-4 text-primary shrink-0" />
            {editingTitle ? (
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    onTitleChange(titleDraft);
                    setEditingTitle(false);
                  }
                  if (e.key === "Escape") {
                    setTitleDraft(block.title);
                    setEditingTitle(false);
                  }
                }}
                onBlur={() => {
                  onTitleChange(titleDraft);
                  setEditingTitle(false);
                }}
                dir={isRTL(titleDraft) ? "rtl" : "ltr"}
                className="h-7 text-sm font-bold"
              />
            ) : (
              <h3
                className="font-bold text-base flex-1 min-w-0 truncate"
                dir={rtl ? "rtl" : "ltr"}
              >
                {block.title || <span className="text-muted-foreground italic">{t("day.untitledBlock")}</span>}
              </h3>
            )}
          </button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {totals.done}/{totals.total} · {Math.round(pct * 100)}%
          </span>
          {!editingTitle && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
              aria-label={t("day.renameBlock")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={t("day.deleteBlock")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="px-4 pt-1">
        <Progress value={pct * 100} className="h-1 mt-2" />
      </div>

      <CollapsibleContent>
        <div className="p-3 space-y-2">
          {block.sections.length === 0 && (
            <p className="text-xs text-muted-foreground italic px-2 py-3 text-center">
              {t("day.noSections")}
            </p>
          )}
          {block.sections.map((section, si) => (
            <SectionCard
              key={si}
              blockId={block.id}
              sectionIdx={si}
              section={section}
              state={state}
              onTitleChange={(t) => onUpdateSectionTitle(si, t)}
              onDelete={() => onDeleteSection(si)}
              onAddTask={() => onAddTask(si)}
              onUpdateTask={(ti, t) => onUpdateTask(si, ti, t)}
              onDeleteTask={(ti) => onDeleteTask(si, ti)}
              onToggle={onToggle}
              onNote={onNote}
            />
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onAddSection}
          >
            <Plus className="h-3.5 w-3.5" /> {t("day.addSection")}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---------- Section card (middle level) ---------- */

interface SectionCardProps {
  blockId: string;
  sectionIdx: number;
  section: EditableSection;
  state: DayState;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onAddTask: () => void;
  onUpdateTask: (taskIdx: number, text: string) => void;
  onDeleteTask: (taskIdx: number) => void;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
}

function SectionCard({
  blockId,
  sectionIdx,
  section,
  state,
  onTitleChange,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggle,
  onNote,
}: SectionCardProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);
  const total = section.tasks.length;
  const done = section.tasks.filter((_, ti) => state.checks[taskKey(blockId, sectionIdx, ti)]).length;
  const pct = total ? done / total : 0;
  const rtl = isRTL(section.title);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-border/70 bg-muted/30 overflow-hidden ml-2"
    >
      <header className="flex items-center gap-2 px-3 py-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 shrink-0"
            aria-label={open ? "Collapse section" : "Expand section"}
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", !open && "-rotate-90")}
            />
            <FolderOpen className="h-3.5 w-3.5 text-accent" />
          </button>
        </CollapsibleTrigger>
        <Input
          value={section.title}
          onChange={(e) => onTitleChange(e.target.value)}
          dir={rtl ? "rtl" : "ltr"}
          className="h-7 flex-1 text-xs font-semibold uppercase tracking-wider text-foreground/80 bg-transparent border-transparent hover:border-input focus:border-input px-2"
        />
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">
          {done}/{total} · {Math.round(pct * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete section"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </header>

      <CollapsibleContent>
        <div className="px-3 pb-3 ml-4">
          <ul className="space-y-2">
            {section.tasks.map((task, ti) => (
              <TaskRow
                key={ti}
                blockId={blockId}
                sectionIdx={sectionIdx}
                taskIdx={ti}
                task={task}
                state={state}
                onToggle={onToggle}
                onNote={onNote}
                onUpdateTask={(t) => onUpdateTask(ti, t)}
                onDeleteTask={() => onDeleteTask(ti)}
              />
            ))}
          </ul>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 mt-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onAddTask}
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---------- Task row (leaf) ---------- */

function TaskRow({
  blockId,
  sectionIdx,
  taskIdx,
  task,
  state,
  onToggle,
  onNote,
  onUpdateTask,
  onDeleteTask,
}: {
  blockId: string;
  sectionIdx: number;
  taskIdx: number;
  task: string;
  state: DayState;
  onToggle: (k: string, v: boolean) => void;
  onNote: (k: string, v: string) => void;
  onUpdateTask: (text: string) => void;
  onDeleteTask: () => void;
}) {
  const k = taskKey(blockId, sectionIdx, taskIdx);
  const checked = !!state.checks[k];
  const taskRTL = isRTL(task);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  useEffect(() => setDraft(task), [task]);

  return (
    <li className="group">
      <div
        className="flex items-start gap-2 rounded-lg p-1.5 -mx-1.5 hover:bg-card transition-base"
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
            dir={isRTL(draft) ? "rtl" : "ltr"}
            onBlur={() => {
              onUpdateTask(draft);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdateTask(draft);
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
              (checked ? "text-muted-foreground line-through" : "text-foreground")
            }
          >
            {task || <span className="text-muted-foreground italic">Empty task</span>}
          </button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={onDeleteTask}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Input
        value={state.notes[k] ?? ""}
        onChange={(e) => onNote(k, e.target.value)}
        className="mt-1 ml-7 h-8 text-xs bg-card border-transparent focus:bg-card focus:border-input"
        dir={taskRTL ? "rtl" : "ltr"}
      />
    </li>
  );
}
