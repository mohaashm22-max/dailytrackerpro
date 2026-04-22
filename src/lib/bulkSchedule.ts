import { addDays, isAfter } from "date-fns";
import { dateKey, isInTracker, startDate, endDate, workoutForDate } from "@/lib/dates";
import { loadJSON, saveJSON } from "@/lib/storage";
import {
  DayState,
  EditableCategory,
  EditableGroup,
  emptyDayState,
  hydrateDayState,
  WORKOUT_CAT_ID,
} from "@/lib/dayProgress";

export type ScheduleScope =
  | { kind: "single"; date: Date }
  | { kind: "range"; start: Date; end: Date }
  | { kind: "all-year" };

export interface ScheduleTaskInput {
  /** The task text to add. */
  text: string;
  /**
   * Where to put it:
   * - "workout"          → into the workout block (creates a default group if empty)
   * - { categoryTitle }  → find/create a section with this title and append the task
   */
  target:
    | { kind: "workout" }
    | { kind: "section"; title: string };
}

export interface ScheduleSectionInput {
  /** New section title to add to each day. */
  title: string;
  /** Optional initial tasks for the section. */
  initialTasks?: string[];
}

export interface ScheduleBlockInput {
  /** Section to attach the block to. Workout block, or a named section (created if missing). */
  target:
    | { kind: "workout" }
    | { kind: "section"; title: string };
  /** Block (group) title — shown above its tasks. */
  blockTitle: string;
  /** Tasks inside the block. */
  tasks: string[];
}

/** Expand a scope into the concrete list of dates within the tracker. */
export function datesForScope(scope: ScheduleScope): Date[] {
  if (scope.kind === "single") {
    return isInTracker(scope.date) ? [scope.date] : [];
  }
  const start = scope.kind === "range" ? scope.start : startDate;
  const end = scope.kind === "range" ? scope.end : endDate;
  const out: Date[] = [];
  let d = start < startDate ? startDate : start;
  const stop = end > endDate ? endDate : end;
  while (!isAfter(d, stop)) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

/** Append a task to a day's state without disturbing existing checks/notes. */
export function addTaskToDay(date: Date, input: ScheduleTaskInput) {
  const k = `day:${dateKey(date)}`;
  const raw = loadJSON<DayState>(k, emptyDayState);
  const state = hydrateDayState(raw, workoutForDate(date));

  if (input.target.kind === "workout") {
    const groups: EditableGroup[] = state.workoutGroups
      ? state.workoutGroups.map((g) => ({ title: g.title, tasks: [...g.tasks] }))
      : [];
    if (groups.length === 0) groups.push({ title: "", tasks: [] });
    groups[0].tasks.push(input.text);
    saveJSON(k, { ...state, workoutGroups: groups });
    return;
  }

  // Section target: find by title (case-insensitive) or create.
  const title = input.target.title.trim();
  const cats: EditableCategory[] = (state.categories ?? []).map((c) => ({
    ...c,
    groups: c.groups.map((g) => ({ title: g.title, tasks: [...g.tasks] })),
  }));
  let cat = cats.find((c) => c.title.trim().toLowerCase() === title.toLowerCase());
  if (!cat) {
    cat = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      groups: [{ title: "", tasks: [] }],
    };
    cats.push(cat);
  }
  if (cat.groups.length === 0) cat.groups.push({ title: "", tasks: [] });
  cat.groups[0].tasks.push(input.text);
  saveJSON(k, { ...state, categories: cats });
}

/** Add a brand-new section (with optional starter tasks) to a day. */
export function addSectionToDay(date: Date, input: ScheduleSectionInput) {
  const k = `day:${dateKey(date)}`;
  const raw = loadJSON<DayState>(k, emptyDayState);
  const state = hydrateDayState(raw, workoutForDate(date));

  const title = input.title.trim();
  const cats: EditableCategory[] = (state.categories ?? []).map((c) => ({
    ...c,
    groups: c.groups.map((g) => ({ title: g.title, tasks: [...g.tasks] })),
  }));
  // Skip if a section with the same title already exists — append starter tasks instead.
  const existing = cats.find((c) => c.title.trim().toLowerCase() === title.toLowerCase());
  if (existing) {
    if (existing.groups.length === 0) existing.groups.push({ title: "", tasks: [] });
    for (const t of input.initialTasks ?? []) existing.groups[0].tasks.push(t);
  } else {
    cats.push({
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      groups: [{ title: "", tasks: [...(input.initialTasks ?? [])] }],
    });
  }
  saveJSON(k, { ...state, categories: cats });
}

export function bulkAddTask(scope: ScheduleScope, input: ScheduleTaskInput): number {
  const dates = datesForScope(scope);
  for (const d of dates) addTaskToDay(d, input);
  return dates.length;
}

export function bulkAddSection(scope: ScheduleScope, input: ScheduleSectionInput): number {
  const dates = datesForScope(scope);
  for (const d of dates) addSectionToDay(d, input);
  return dates.length;
}

/** Append a new block (group) with its tasks to a day. */
export function addBlockToDay(date: Date, input: ScheduleBlockInput) {
  const k = `day:${dateKey(date)}`;
  const raw = loadJSON<DayState>(k, emptyDayState);
  const state = hydrateDayState(raw, workoutForDate(date));
  const newGroup: EditableGroup = {
    title: input.blockTitle.trim(),
    tasks: [...input.tasks],
  };

  if (input.target.kind === "workout") {
    const groups = (state.workoutGroups ?? []).map((g) => ({
      title: g.title,
      tasks: [...g.tasks],
    }));
    groups.push(newGroup);
    saveJSON(k, { ...state, workoutGroups: groups });
    return;
  }

  const title = input.target.title.trim();
  const cats: EditableCategory[] = (state.categories ?? []).map((c) => ({
    ...c,
    groups: c.groups.map((g) => ({ title: g.title, tasks: [...g.tasks] })),
  }));
  let cat = cats.find((c) => c.title.trim().toLowerCase() === title.toLowerCase());
  if (!cat) {
    cat = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      groups: [],
    };
    cats.push(cat);
  }
  cat.groups.push(newGroup);
  saveJSON(k, { ...state, categories: cats });
}

export function bulkAddBlock(scope: ScheduleScope, input: ScheduleBlockInput): number {
  const dates = datesForScope(scope);
  for (const d of dates) addBlockToDay(d, input);
  return dates.length;
}

/** Re-export for callers building UI. */
export { WORKOUT_CAT_ID };
