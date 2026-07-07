"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { storage, KEYS } from "./storage";
import { uid, today } from "./format";
import { DEFAULT_SPLITS, type Split } from "./data/splits";
import type {
  Workout,
  Exercise,
  SetEntry,
  BodyWeight,
  Profile,
  FoodEntry,
} from "./types";

const DEFAULT_PROFILE: Profile = { unit: "lb", restSeconds: 90, calorieGoal: 2200 };

type Store = {
  ready: boolean;
  splits: Split[];
  workouts: Workout[];
  active: Workout | null;
  bodyweight: BodyWeight[];
  profile: Profile;
  food: FoodEntry[];

  // splits
  saveSplit: (split: Split, originalName?: string) => void;
  deleteSplit: (name: string) => void;

  // workout lifecycle
  startWorkout: (splitName: string, exerciseNames: string[]) => void;
  cancelWorkout: () => void;
  finishWorkout: (note?: string) => void;
  deleteWorkout: (id: string) => void;

  // active workout editing
  addExercise: (name: string, timed?: boolean) => void;
  removeExercise: (exId: string) => void;
  addSet: (exId: string, type?: SetEntry["type"]) => void;
  updateSet: (exId: string, setId: string, patch: Partial<SetEntry>) => void;
  removeSet: (exId: string, setId: string) => void;

  // body weight
  logBodyWeight: (weight: number, date?: string) => void;
  deleteBodyWeight: (date: string) => void;

  // profile
  updateProfile: (patch: Partial<Profile>) => void;

  // food
  addFood: (entry: Omit<FoodEntry, "id" | "createdAt">) => void;
  deleteFood: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside <StoreProvider>");
  return v;
}

function blankSet(type: SetEntry["type"] = "normal"): SetEntry {
  return { id: uid(), weight: "", reps: "", type, checked: false };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [splits, setSplits] = useState<Split[]>(DEFAULT_SPLITS);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [active, setActive] = useState<Workout | null>(null);
  const [bodyweight, setBodyweight] = useState<BodyWeight[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [food, setFood] = useState<FoodEntry[]>([]);

  // always-current ref to the active workout so actions can read it without
  // nesting state updates (which Strict Mode double-invokes)
  const activeRef = useRef<Workout | null>(active);
  activeRef.current = active;

  // hydrate once on mount (client only)
  useEffect(() => {
    setSplits(storage.get<Split[]>(KEYS.splits) ?? DEFAULT_SPLITS);
    setWorkouts(storage.get<Workout[]>(KEYS.workouts) ?? []);
    setActive(storage.get<Workout>(KEYS.active));
    setBodyweight(storage.get<BodyWeight[]>(KEYS.bodyweight) ?? []);
    // merge so profiles saved before new fields existed pick up defaults
    setProfile({ ...DEFAULT_PROFILE, ...(storage.get<Profile>(KEYS.profile) ?? {}) });
    setFood(storage.get<FoodEntry[]>(KEYS.food) ?? []);
    setReady(true);
  }, []);

  // persist slices after hydration
  const skip = useRef(true);
  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (!ready) return;
    storage.set(KEYS.splits, splits);
    storage.set(KEYS.workouts, workouts);
    storage.set(KEYS.bodyweight, bodyweight);
    storage.set(KEYS.profile, profile);
    storage.set(KEYS.food, food);
    if (active) storage.set(KEYS.active, active);
    else storage.del(KEYS.active);
  }, [ready, splits, workouts, bodyweight, profile, food, active]);

  // ---- splits ----
  const saveSplit = useCallback((split: Split, originalName?: string) => {
    setSplits((prev) => {
      const key = originalName ?? split.name;
      const idx = prev.findIndex((s) => s.name === key);
      if (idx === -1) return [{ ...split, custom: true }, ...prev];
      const copy = [...prev];
      copy[idx] = { ...split, custom: true };
      return copy;
    });
  }, []);

  const deleteSplit = useCallback((name: string) => {
    setSplits((prev) => prev.filter((s) => s.name !== name));
  }, []);

  // ---- lifecycle ----
  const startWorkout = useCallback((splitName: string, exerciseNames: string[]) => {
    const w: Workout = {
      id: uid(),
      date: today(),
      split: splitName,
      startedAt: Date.now(),
      exercises: exerciseNames.map((name) => ({
        id: uid(),
        name,
        sets: [blankSet()],
      })),
    };
    setActive(w);
  }, []);

  const cancelWorkout = useCallback(() => setActive(null), []);

  const finishWorkout = useCallback((note?: string) => {
    const cur = activeRef.current;
    if (!cur) return;
    const duration = Math.round((Date.now() - cur.startedAt) / 1000);
    const finished: Workout = {
      ...cur,
      duration,
      note: note?.trim() || undefined,
      // drop exercises with no completed sets
      exercises: cur.exercises.filter((e) => e.sets.some((s) => s.checked)),
    };
    if (finished.exercises.length > 0) {
      setWorkouts((prev) => [finished, ...prev]);
    }
    setActive(null);
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // ---- active editing ----
  const mutateActive = useCallback(
    (fn: (w: Workout) => Workout) => {
      setActive((cur) => (cur ? fn(cur) : cur));
    },
    []
  );

  const addExercise = useCallback(
    (name: string, timed?: boolean) =>
      mutateActive((w) => ({
        ...w,
        exercises: [
          ...w.exercises,
          { id: uid(), name, timed, sets: [blankSet()] },
        ],
      })),
    [mutateActive]
  );

  const removeExercise = useCallback(
    (exId: string) =>
      mutateActive((w) => ({
        ...w,
        exercises: w.exercises.filter((e) => e.id !== exId),
      })),
    [mutateActive]
  );

  const addSet = useCallback(
    (exId: string, type: SetEntry["type"] = "normal") =>
      mutateActive((w) => ({
        ...w,
        exercises: w.exercises.map((e) =>
          e.id === exId ? { ...e, sets: [...e.sets, blankSet(type)] } : e
        ),
      })),
    [mutateActive]
  );

  const updateSet = useCallback(
    (exId: string, setId: string, patch: Partial<SetEntry>) =>
      mutateActive((w) => ({
        ...w,
        exercises: w.exercises.map((e) =>
          e.id === exId
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.id === setId ? { ...s, ...patch } : s
                ),
              }
            : e
        ),
      })),
    [mutateActive]
  );

  const removeSet = useCallback(
    (exId: string, setId: string) =>
      mutateActive((w) => ({
        ...w,
        exercises: w.exercises.map((e) =>
          e.id === exId
            ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
            : e
        ),
      })),
    [mutateActive]
  );

  // ---- body weight ----
  const logBodyWeight = useCallback((weight: number, date = today()) => {
    setBodyweight((prev) => {
      const others = prev.filter((b) => b.date !== date);
      return [...others, { date, weight }].sort((a, b) =>
        a.date < b.date ? -1 : 1
      );
    });
  }, []);

  const deleteBodyWeight = useCallback((date: string) => {
    setBodyweight((prev) => prev.filter((b) => b.date !== date));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---- food ----
  const addFood = useCallback((entry: Omit<FoodEntry, "id" | "createdAt">) => {
    setFood((prev) => [
      { ...entry, id: uid(), createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const deleteFood = useCallback((id: string) => {
    setFood((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const value: Store = {
    ready,
    splits,
    workouts,
    active,
    bodyweight,
    profile,
    food,
    saveSplit,
    deleteSplit,
    startWorkout,
    cancelWorkout,
    finishWorkout,
    deleteWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    logBodyWeight,
    deleteBodyWeight,
    updateProfile,
    addFood,
    deleteFood,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
