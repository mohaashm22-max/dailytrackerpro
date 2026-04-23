import { addDays, isAfter } from "date-fns";
import { dateKey, isInTracker, startDate, endDate, workoutForDate } from "@/lib/dates";
import { loadJSON, saveJSON } from "@/lib/storage";
import {
  DayState,
  EditableBlock,
  EditableSection,
  emptyDayState,
  hydrateDayState,
  WORKOUT_CAT_ID,
} from "@/lib/dayProgress";

export type ScheduleScope =
  | { kind: "single"; date: Date }
  | { kind: "range"; start: Date; end: Date }
  | { kind: "all-year" };

/** Where bulk additions should land. */
export type BulkTarget =
  | { kind: "block"; title: string }                       // find/create a block by title
  | { kind: "section"; blockTitle: string; title: string }; // find/create a section inside a block

export interface ScheduleTaskInput {
  text: string;
  /** Defaults to a "Tasks" block if omitted. */
  target?: BulkTarget;
}

export interface ScheduleSectionInput {
  /** Block to put the section into (created if missing). */
  blockTitle: string;
  /** Section title to add. */
  title: string;
  initialTasks?: string[];
}

export interface ScheduleBlockInput {
  /** New top-level block title. */
  title: string;
  /** Optional starter sections inside the block. */
  sections?: { title: string; tasks: string[] }[];
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

/* ---------- low-level helpers ---------- */

function cloneBlocks(blocks: EditableBlock[]): EditableBlock[] {
  return blocks.map((b) => ({
    id: b.id,
    title: b.title,
    sections: b.sections.map((s) => ({ title: s.title, tasks: [...s.tasks] })),
  }));
}

function findOrCreateBlock(blocks: EditableBlock[], title: string): EditableBlock {
  const trimmed = title.trim();
  let block = blocks.find(
    (b) => b.title.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (!block) {
    block = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      sections: [],
    };
    blocks.push(block);
  }
  return block;
}

function findOrCreateSection(block: EditableBlock, title: string): EditableSection {
  const trimmed = title.trim();
  let sec = block.sections.find(
    (s) => s.title.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (!sec) {
    sec = { title: trimmed, tasks: [] };
    block.sections.push(sec);
  }
  return sec;
}

/* ---------- per-day operations ---------- */

export function addTaskToDay(date: Date, input: ScheduleTaskInput) {
  const k = `day:${dateKey(date)}`;
  const raw = loadJSON<DayState>(k, emptyDayState);
  const state = hydrateDayState(raw, workoutForDate(date));
  const blocks = cloneBlocks(state.blocks ?? []);

  const target = input.target ?? { kind: "block", title: "Tasks" };
  if (target.kind === "block") {
    const block = findOrCreateBlock(blocks, target.title);
    if (block.sections.length === 0) block.sections.push({ title: "", tasks: [] });
    block.sections[0].tasks.push(input.text);
  } else {
    const block = findOrCreateBlock(blocks, target.blockTitle);
    const section = findOrCreateSection(block, target.title);
    section.tasks.push(input.text);
  }

  saveJSON(k, { ...state, blocks });
}

export function addSectionToDay(date: Date, input: ScheduleSectionInput) {
  const k = `day:${dateKey(date)}`;
  const raw = loadJSON<DayState>(k, emptyDayState);
  const state = hydrateDayState(raw, workoutForDate(date));
  const blocks = cloneBlocks(state.blocks ?? []);

  const block = findOrCreateBlock(blocks, input.blockTitle);
  const section = findOrCreateSection(block, input.title);
  for (const t of input.initialTasks ?? []) section.tasks.push(t);

  saveJSON(k, { ...state, blocks });
}

export function addBlockToDay(date: Date, input: ScheduleBlockInput) {
  const k = `day:${dateKey(date)}`;
  const raw = loadJSON<DayState>(k, emptyDayState);
  const state = hydrateDayState(raw, workoutForDate(date));
  const blocks = cloneBlocks(state.blocks ?? []);

  const block = findOrCreateBlock(blocks, input.title);
  for (const s of input.sections ?? []) {
    const sec = findOrCreateSection(block, s.title);
    for (const t of s.tasks) sec.tasks.push(t);
  }

  saveJSON(k, { ...state, blocks });
}

/* ---------- bulk wrappers ---------- */

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

export function bulkAddBlock(scope: ScheduleScope, input: ScheduleBlockInput): number {
  const dates = datesForScope(scope);
  for (const d of dates) addBlockToDay(d, input);
  return dates.length;
}

export { WORKOUT_CAT_ID };
