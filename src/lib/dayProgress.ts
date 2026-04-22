import { COMMON_CATEGORIES, WORKOUT_GROUPS, Category, TaskGroup } from "@/data/template";

export interface EditableGroup {
  title: string;
  tasks: string[];
}
export interface EditableCategory {
  id: string;
  title: string;
  groups: EditableGroup[];
}

export interface DayState {
  /** Editable day/activity name (was workout label). */
  dayName?: string;
  /** Editable workout block groups for this day. */
  workoutGroups?: EditableGroup[];
  /** Editable list of categories (sections) for this day. */
  categories?: EditableCategory[];
  /** Map of "categoryId|groupIdx|taskIdx" -> boolean (checked) */
  checks: Record<string, boolean>;
  /** Map of same key -> note string */
  notes: Record<string, string>;
  /** Top-level free note for the day */
  dayNote?: string;
}

export const emptyDayState: DayState = { checks: {}, notes: {}, dayNote: "" };

export const WORKOUT_CAT_ID = "workout";

export function taskKey(catId: string, groupIdx: number, taskIdx: number) {
  return `${catId}|${groupIdx}|${taskIdx}`;
}

/** Clone helpers so per-day edits never mutate the shared template. */
function cloneGroups(groups: TaskGroup[]): EditableGroup[] {
  return groups.map((g) => ({ title: g.title, tasks: [...g.tasks] }));
}
function cloneCategories(cats: Category[]): EditableCategory[] {
  return cats.map((c, i) => ({
    id: c.id === "cat" ? `cat-${i}` : c.id,
    title: c.title,
    groups: cloneGroups(c.groups),
  }));
}

/** Ensure a DayState has its editable template seeded from defaults. */
export function hydrateDayState(s: DayState | undefined | null, defaultDayName: string): DayState {
  const base: DayState = { ...emptyDayState, ...(s ?? {}) };
  if (!base.workoutGroups) base.workoutGroups = cloneGroups(WORKOUT_GROUPS);
  if (!base.categories) base.categories = cloneCategories(COMMON_CATEGORIES);
  if (base.dayName === undefined) base.dayName = defaultDayName;
  if (!base.checks) base.checks = {};
  if (!base.notes) base.notes = {};
  return base;
}

export interface DayStats {
  done: number;
  total: number;
  percent: number;
  perCategory: { id: string; title: string; done: number; total: number }[];
}

export function computeDayStats(state: DayState): DayStats {
  const perCategory: DayStats["perCategory"] = [];
  let done = 0;
  let total = 0;

  const workoutGroups = state.workoutGroups ?? cloneGroups(WORKOUT_GROUPS);
  const categories = state.categories ?? cloneCategories(COMMON_CATEGORIES);

  // Workout
  let wDone = 0;
  let wTotal = 0;
  workoutGroups.forEach((g, gi) => {
    g.tasks.forEach((_, ti) => {
      wTotal++;
      if (state.checks?.[taskKey(WORKOUT_CAT_ID, gi, ti)]) wDone++;
    });
  });
  perCategory.push({
    id: WORKOUT_CAT_ID,
    title: state.dayName || "Workout",
    done: wDone,
    total: wTotal,
  });
  done += wDone;
  total += wTotal;

  categories.forEach((cat) => {
    let cDone = 0;
    let cTotal = 0;
    cat.groups.forEach((g, gi) => {
      g.tasks.forEach((_, ti) => {
        cTotal++;
        if (state.checks?.[taskKey(cat.id, gi, ti)]) cDone++;
      });
    });
    perCategory.push({ id: cat.id, title: cat.title, done: cDone, total: cTotal });
    done += cDone;
    total += cTotal;
  });

  return { done, total, percent: total ? done / total : 0, perCategory };
}
