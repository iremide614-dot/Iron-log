// ===== persistence layer =====
// Single choke-point for reads/writes so Phase 4 can swap localStorage for
// Supabase (per-user cloud sync) without touching any UI/store code.

const PREFIX = "rc-";

export interface Storage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  del(key: string): void;
}

const memory = new Map<string, string>();

const browser: Storage = {
  get<T>(key: string): T | null {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(PREFIX + key)
          : memory.get(PREFIX + key) ?? null;
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    if (typeof window !== "undefined") window.localStorage.setItem(PREFIX + key, raw);
    else memory.set(PREFIX + key, raw);
  },
  del(key: string): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(PREFIX + key);
    else memory.delete(PREFIX + key);
  },
};

export const storage: Storage = browser;

// Stable key names (kept compatible with the original app's `rc-` schema)
export const KEYS = {
  workouts: "wk",
  active: "aw",
  bodyweight: "bw",
  splits: "splits",
  profile: "prof",
  food: "food",
} as const;
