"use client";

// Today's status: calories vs goal, meal slots logged, workout done.
// Also syncs a compact snapshot to the server so scheduled reminder
// pushes can include real numbers and skip what's already logged.

import { sumMacros } from "./food";
import { today } from "./format";
import type { FoodEntry, Workout, Profile } from "./types";

export type MealSlot = "breakfast" | "lunch" | "dinner";

export type TodayStatus = {
  date: string;
  eaten: number;
  goal: number;
  remaining: number; // clamped at 0
  protein: number;
  slots: Record<MealSlot, boolean>;
  workedOut: boolean;
};

/** Rough meal slot from when the entry was logged. */
export function mealSlot(createdAt: number): MealSlot {
  const h = new Date(createdAt).getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  return "dinner";
}

export function todayStatus(
  food: FoodEntry[],
  workouts: Workout[],
  profile: Profile
): TodayStatus {
  const date = today();
  const entries = food.filter((f) => f.date === date);
  const totals = sumMacros(entries);
  const slots: Record<MealSlot, boolean> = { breakfast: false, lunch: false, dinner: false };
  for (const e of entries) slots[mealSlot(e.createdAt)] = true;
  const goal = profile.calorieGoal || 2200;
  return {
    date,
    eaten: totals.calories,
    goal,
    remaining: Math.max(0, goal - totals.calories),
    protein: totals.protein,
    slots,
    workedOut: workouts.some((w) => w.date === date),
  };
}

/** Show calories-remaining on the app icon (installed PWAs; no-op elsewhere). */
export async function updateBadge(status: TodayStatus) {
  try {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (!nav.setAppBadge) return;
    if (status.remaining > 0) await nav.setAppBadge(status.remaining);
    else await nav.clearAppBadge?.();
  } catch {
    /* unsupported / permission — ignore */
  }
}

let lastSynced = "";

/** Push the snapshot to the server (deduped); reminders use it. */
export async function syncStatus(status: TodayStatus) {
  const body = JSON.stringify({
    ...status,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (body === lastSynced) return;
  try {
    const res = await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) lastSynced = body;
  } catch {
    /* offline — retry next change */
  }
}
