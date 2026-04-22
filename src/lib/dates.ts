import { TRACKER_START, TRACKER_END, WORKOUT_ROTATION, WORKOUT_ROTATION_ANCHOR } from "@/data/template";
import { differenceInCalendarDays, parseISO, format } from "date-fns";

export const startDate = parseISO(TRACKER_START);
export const endDate = parseISO(TRACKER_END);
const workoutAnchor = parseISO(WORKOUT_ROTATION_ANCHOR);

/** YYYY-MM-DD key from a Date (local). */
export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Day index from tracker start; -1 if before start. */
export function dayIndex(d: Date): number {
  return differenceInCalendarDays(d, startDate);
}

export function isInTracker(d: Date): boolean {
  const i = dayIndex(d);
  return i >= 0 && d <= endDate;
}

export function workoutForDate(d: Date): string {
  const i = differenceInCalendarDays(d, workoutAnchor);
  const len = WORKOUT_ROTATION.length;
  const idx = ((i % len) + len) % len;
  return WORKOUT_ROTATION[idx];
}

export function statusFromPercent(pct: number): {
  label: string;
  className: string;
} {
  if (pct >= 0.85) return { label: "Excellent", className: "bg-success-soft text-success" };
  if (pct >= 0.6) return { label: "Very Good", className: "bg-accent-soft text-accent" };
  if (pct >= 0.35) return { label: "Okay", className: "bg-warning-soft text-warning" };
  if (pct > 0) return { label: "Started", className: "bg-muted text-muted-foreground" };
  return { label: "Empty", className: "bg-muted text-muted-foreground" };
}
