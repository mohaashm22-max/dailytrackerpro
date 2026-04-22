import { COMMON_CATEGORIES, WORKOUT_GROUPS } from "@/data/template";

export interface DayState {
  // Map of "categoryId|groupIdx|taskIdx" -> boolean (checked)
  checks: Record<string, boolean>;
  // Map of same key -> note string
  notes: Record<string, string>;
  // Top-level free note for the day
  dayNote?: string;
}

export const emptyDayState: DayState = { checks: {}, notes: {}, dayNote: "" };

export const WORKOUT_CAT_ID = "workout";

export function taskKey(catId: string, groupIdx: number, taskIdx: number) {
  return `${catId}|${groupIdx}|${taskIdx}`;
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

  // Workout
  let wDone = 0;
  let wTotal = 0;
  WORKOUT_GROUPS.forEach((g, gi) => {
    g.tasks.forEach((_, ti) => {
      wTotal++;
      if (state.checks[taskKey(WORKOUT_CAT_ID, gi, ti)]) wDone++;
    });
  });
  perCategory.push({ id: WORKOUT_CAT_ID, title: "Workout", done: wDone, total: wTotal });
  done += wDone;
  total += wTotal;

  COMMON_CATEGORIES.forEach((cat) => {
    let cDone = 0;
    let cTotal = 0;
    cat.groups.forEach((g, gi) => {
      g.tasks.forEach((_, ti) => {
        cTotal++;
        if (state.checks[taskKey(cat.id, gi, ti)]) cDone++;
      });
    });
    perCategory.push({ id: cat.id, title: cat.title, done: cDone, total: cTotal });
    done += cDone;
    total += cTotal;
  });

  return { done, total, percent: total ? done / total : 0, perCategory };
}
