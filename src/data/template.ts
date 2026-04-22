// Auto-generated from Daily_Tracker_Final_2026.xlsb
export interface TaskGroup { title: string; tasks: string[]; }
export interface Category { id: string; title: string; groups: TaskGroup[]; }

// Workout name rotation — kept blank so the app starts as a clean template.
// Users can rename any day directly from the calendar or day editor.
export const WORKOUT_ROTATION = ["", "", "", "", "", "", ""];

// Empty workout block — users add their own groups/tasks per day.
export const WORKOUT_GROUPS: TaskGroup[] = [];

// Empty by default — users add their own sections per day.
export const COMMON_CATEGORIES: Category[] = [];

export const TRACKER_START = '2026-01-01'; // YYYY-MM-DD
export const TRACKER_END = '2026-12-31';
// Anchor for the 7-day workout rotation (matches the original Excel sheet)
export const WORKOUT_ROTATION_ANCHOR = '2026-04-16';
