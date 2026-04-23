import { COMMON_CATEGORIES, WORKOUT_GROUPS, Category, TaskGroup } from "@/data/template";

/**
 * Three-level hierarchy:
 *   Block (top-level container, e.g. "Workout", "Health")
 *     └── Section (group of related tasks, e.g. "Warm-up", "Hydration")
 *           └── Task (atomic checklist item)
 *
 * Storage shape is unchanged — categories+groups+tasks map 1:1 to
 * blocks+sections+tasks so all existing per-day check/note keys (which use
 * `block|sectionIdx|taskIdx`) keep working.
 */

export interface EditableSection {
  title: string;
  tasks: string[];
}
export interface EditableBlock {
  id: string;
  title: string;
  sections: EditableSection[];
}

// Backwards-compat aliases (older code referenced these names).
export type EditableGroup = EditableSection;
export type EditableCategory = { id: string; title: string; groups: EditableSection[] };

export interface DayState {
  /** Editable day/activity name shown at the top of the day view. */
  dayName?: string;
  /** Legacy field — merged into `blocks` on hydrate. */
  workoutGroups?: EditableSection[];
  /** Legacy field — merged into `blocks` on hydrate. */
  categories?: EditableCategory[];
  /** Editable list of top-level blocks for this day. */
  blocks?: EditableBlock[];
  /** Map of "blockId|sectionIdx|taskIdx" -> boolean (checked) */
  checks: Record<string, boolean>;
  /** Map of same key -> note string */
  notes: Record<string, string>;
  /** Top-level free note for the day */
  dayNote?: string;
}

export const emptyDayState: DayState = { checks: {}, notes: {}, dayNote: "" };

/** Legacy id used by the pre-hierarchy "workout" block. */
export const WORKOUT_CAT_ID = "workout";

export function taskKey(blockId: string, sectionIdx: number, taskIdx: number) {
  return `${blockId}|${sectionIdx}|${taskIdx}`;
}

/** Clone helpers so per-day edits never mutate the shared template. */
function cloneSections(groups: TaskGroup[] | EditableSection[]): EditableSection[] {
  return groups.map((g) => ({ title: g.title, tasks: [...g.tasks] }));
}
function cloneBlocksFromCategories(cats: Category[] | EditableCategory[]): EditableBlock[] {
  return cats.map((c, i) => ({
    id: c.id === "cat" ? `block-${i}` : c.id,
    title: c.title,
    sections: cloneSections(("groups" in c ? c.groups : []) as TaskGroup[]),
  }));
}

/**
 * Migrate legacy DayState (workoutGroups + categories) into the new
 * `blocks` array. Idempotent — safe to call repeatedly.
 */
function migrateLegacy(s: DayState): EditableBlock[] {
  if (s.blocks && s.blocks.length >= 0 && !s.workoutGroups && !s.categories) {
    return s.blocks.map((b) => ({
      id: b.id,
      title: b.title,
      sections: cloneSections(b.sections ?? []),
    }));
  }
  const blocks: EditableBlock[] = [];

  // Preserve the legacy workout block as the first block, keyed by WORKOUT_CAT_ID
  // so any existing checks/notes (stored as "workout|..|..") remain valid.
  if (s.workoutGroups && s.workoutGroups.length > 0) {
    blocks.push({
      id: WORKOUT_CAT_ID,
      title: s.dayName || "Workout",
      sections: cloneSections(s.workoutGroups),
    });
  }
  if (s.categories) {
    for (const c of s.categories) {
      blocks.push({
        id: c.id,
        title: c.title,
        sections: cloneSections(c.groups ?? []),
      });
    }
  }
  // Already-migrated blocks should be merged in too.
  if (s.blocks) {
    for (const b of s.blocks) {
      if (!blocks.some((x) => x.id === b.id)) {
        blocks.push({
          id: b.id,
          title: b.title,
          sections: cloneSections(b.sections ?? []),
        });
      }
    }
  }
  return blocks;
}

/** Ensure a DayState has its editable template seeded from defaults. */
export function hydrateDayState(s: DayState | undefined | null, defaultDayName: string): DayState {
  const base: DayState = { ...emptyDayState, ...(s ?? {}) };
  if (base.dayName === undefined) base.dayName = defaultDayName;
  if (!base.checks) base.checks = {};
  if (!base.notes) base.notes = {};

  const migrated = migrateLegacy(base);
  // If nothing exists yet, seed from the template defaults (currently empty).
  const seeded =
    migrated.length === 0
      ? cloneBlocksFromCategories([
          ...(WORKOUT_GROUPS.length
            ? [{ id: WORKOUT_CAT_ID, title: defaultDayName || "Workout", groups: WORKOUT_GROUPS } as Category]
            : []),
          ...COMMON_CATEGORIES,
        ])
      : migrated;

  return {
    dayName: base.dayName,
    blocks: seeded,
    checks: base.checks,
    notes: base.notes,
    dayNote: base.dayNote ?? "",
    // Drop legacy fields once normalized.
  };
}

export interface SectionStats {
  done: number;
  total: number;
  percent: number;
}
export interface BlockStats extends SectionStats {
  id: string;
  title: string;
  sections: (SectionStats & { title: string })[];
}
export interface DayStats {
  done: number;
  total: number;
  percent: number;
  blocks: BlockStats[];
  /** Backwards-compat: used by AnalysisPage. Mirrors `blocks`. */
  perCategory: { id: string; title: string; done: number; total: number }[];
}

export function computeDayStats(state: DayState): DayStats {
  const hydrated =
    state.blocks ?? migrateLegacy({ ...emptyDayState, ...state });
  const blocks: BlockStats[] = [];
  let done = 0;
  let total = 0;

  for (const block of hydrated) {
    let bDone = 0;
    let bTotal = 0;
    const sectionStats: (SectionStats & { title: string })[] = [];
    block.sections.forEach((sec, si) => {
      let sDone = 0;
      const sTotal = sec.tasks.length;
      sec.tasks.forEach((_, ti) => {
        if (state.checks?.[taskKey(block.id, si, ti)]) sDone++;
      });
      sectionStats.push({
        title: sec.title,
        done: sDone,
        total: sTotal,
        percent: sTotal ? sDone / sTotal : 0,
      });
      bDone += sDone;
      bTotal += sTotal;
    });
    blocks.push({
      id: block.id,
      title: block.title,
      sections: sectionStats,
      done: bDone,
      total: bTotal,
      percent: bTotal ? bDone / bTotal : 0,
    });
    done += bDone;
    total += bTotal;
  }

  return {
    done,
    total,
    percent: total ? done / total : 0,
    blocks,
    perCategory: blocks.map((b) => ({ id: b.id, title: b.title, done: b.done, total: b.total })),
  };
}
