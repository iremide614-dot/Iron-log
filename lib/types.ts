// ===== RECOMP domain types =====

export type SetType = "normal" | "warmup";

export type SetEntry = {
  id: string;
  weight: string; // kept as string for free input; parsed when needed
  reps: string;
  type: SetType;
  checked: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  /** timed exercises (planks etc.) log seconds in `reps` */
  timed?: boolean;
  sets: SetEntry[];
};

export type Workout = {
  id: string;
  date: string; // YYYY-MM-DD
  split: string;
  startedAt: number; // epoch ms
  duration?: number; // seconds
  note?: string;
  exercises: Exercise[];
};

export type BodyWeight = {
  date: string; // YYYY-MM-DD
  weight: number;
};

export type GoalMode = "cut" | "maintain" | "bulk";

export type Profile = {
  name?: string;
  unit: "kg" | "lb";
  restSeconds: number;
  /** cutting / maintaining / bulking — drives the calorie target */
  goalMode?: GoalMode;
  /** daily calorie target for the Today card / icon badge */
  calorieGoal: number;
  /** daily protein target (g) */
  proteinGoal?: number;
};

// ===== food tracking =====

export type Macros = {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

/** One detected food within a meal. */
export type FoodItem = Macros & {
  id: string;
  name: string;
};

/** What the AI (or mock) returns for a photo: an itemized breakdown. */
export type FoodAnalysis = {
  name: string;
  items: (Macros & { name: string })[];
  /** true when produced by the local mock (no API key configured) */
  mock?: boolean;
};

export type FoodEntry = Macros & {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  /** itemized breakdown (entries saved before this feature won't have it) */
  items?: FoodItem[];
  thumb?: string; // small base64 jpeg thumbnail
  createdAt: number;
};
