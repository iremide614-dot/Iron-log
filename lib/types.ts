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

export type Profile = {
  name?: string;
  unit: "kg" | "lb";
  restSeconds: number;
};

// ===== food tracking =====

export type Macros = {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

/** What the AI (or mock) returns for a photo. */
export type FoodAnalysis = Macros & {
  name: string;
  /** true when produced by the local mock (no API key configured) */
  mock?: boolean;
};

export type FoodEntry = Macros & {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  thumb?: string; // small base64 jpeg thumbnail
  createdAt: number;
};
