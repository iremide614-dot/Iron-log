// ===== workout domain logic (ported & typed from original) =====
import type { Workout, Exercise, SetEntry } from "./types";

/** working sets = checked, non-warmup */
export function workingSets(ex: Exercise): SetEntry[] {
  return (ex.sets || []).filter((s) => s.checked && s.type !== "warmup");
}

export function exerciseVolume(ex: Exercise): number {
  return workingSets(ex).reduce(
    (a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0),
    0
  );
}

export function countSets(w: Workout | null): number {
  if (!w) return 0;
  return (w.exercises || []).reduce((a, e) => a + workingSets(e).length, 0);
}

export function calcVolume(w: Workout | null): number {
  if (!w) return 0;
  return (w.exercises || []).reduce((a, e) => a + exerciseVolume(e), 0);
}

export function topWeight(ex: Exercise): number {
  return Math.max(0, ...workingSets(ex).map((s) => parseFloat(s.weight) || 0));
}

/** Most recent completed session containing `exName`, excluding `exceptId`. */
export function lastSessionFor(
  workouts: Workout[],
  exName: string,
  exceptId?: string
): Exercise | null {
  const sorted = [...workouts]
    .filter((w) => w.id !== exceptId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const w of sorted) {
    const ex = (w.exercises || []).find(
      (e) => e.name === exName && workingSets(e).length > 0
    );
    if (ex) return ex;
  }
  return null;
}

/** "Last: 60x8, 60x8" summary string for an exercise's previous session. */
export function lastSummary(ex: Exercise | null): string {
  if (!ex) return "";
  return workingSets(ex)
    .map((s) => `${s.weight || "?"}×${s.reps || "?"}`)
    .join(", ");
}

export type Trend = "up" | "down" | "same" | "new";

/** Compare current top weight to last session -> overload arrow. */
export function overloadTrend(current: Exercise, last: Exercise | null): Trend {
  if (!last) return "new";
  const cur = topWeight(current);
  const prev = topWeight(last);
  if (!cur || !prev) return "new";
  if (cur > prev) return "up";
  if (cur < prev) return "down";
  return "same";
}

export type PR = { name: string; weight: number; reps: number; date: string };

/** Best single-set weight per exercise across all history. */
export function personalRecords(workouts: Workout[]): PR[] {
  const best: Record<string, PR> = {};
  for (const w of workouts) {
    for (const ex of w.exercises || []) {
      for (const s of workingSets(ex)) {
        const wt = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps) || 0;
        if (!wt) continue;
        const cur = best[ex.name];
        if (!cur || wt > cur.weight) {
          best[ex.name] = { name: ex.name, weight: wt, reps, date: w.date };
        }
      }
    }
  }
  return Object.values(best).sort((a, b) => b.weight - a.weight);
}

/** Consecutive-day streak ending today or yesterday. */
export function streak(workouts: Workout[]): { current: number; best: number } {
  const dates = Array.from(new Set(workouts.map((w) => w.date))).sort();
  if (dates.length === 0) return { current: 0, best: 0 };

  const dayMs = 86400000;
  const toDay = (s: string) => Math.floor(new Date(s + "T12:00:00").getTime() / dayMs);
  const days = dates.map(toDay);

  // best streak
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) run++;
    else run = 1;
    best = Math.max(best, run);
  }

  // current streak (must include today or yesterday)
  const todayDay = Math.floor(Date.now() / dayMs);
  const lastDay = days[days.length - 1];
  let current = 0;
  if (lastDay === todayDay || lastDay === todayDay - 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (days[i] === days[i - 1] + 1) current++;
      else break;
    }
  }
  return { current, best: Math.max(best, current) };
}
