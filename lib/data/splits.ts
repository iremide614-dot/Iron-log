// ===== RECOMP split & exercise data (ported from the original app) =====

export type Split = {
  name: string;
  exercises: string[];
  /** custom = one of the user's own splits (vs. a built-in template) */
  custom: boolean;
};

export const DEFAULT_SPLITS: Split[] = [
  { name: "Bis/Chest/Shoulders", exercises: ["Cable Curl", "Incline Bench", "Cable Hammer", "Flat Chest Press", "Chest Fly", "Shoulder Lateral Raise", "Machine Preacher"], custom: true },
  { name: "Tris/Back/Rear Delts", exercises: ["Tricep Pushdown", "Overhead Tricep Extension", "Lat Pulldown", "Machine Row", "Pec Deck Machine", "Pull-Ups", "Tricep Rope"], custom: true },
  { name: "Legs", exercises: ["Squat", "Leg Press", "Hamstring Curl", "Quad Extension", "Calf Raises"], custom: true },
  { name: "SARMS", exercises: ["DB Shoulder Press", "DB Lateral Raise Drop Set", "Rear Delts", "Hammer Curl", "Cable Curl"], custom: true },
  { name: "Push (PPL)", exercises: ["Bench Press", "OHP", "Incline DB Press", "Lateral Raise", "Tricep Pushdown", "Chest Fly"], custom: false },
  { name: "Pull (PPL)", exercises: ["Barbell Row", "Pull-Ups", "Face Pull", "Barbell Curl", "Hammer Curl", "Lat Pulldown"], custom: false },
  { name: "Legs (PPL)", exercises: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raises", "Leg Extension"], custom: false },
  { name: "Upper", exercises: ["Bench Press", "Barbell Row", "OHP", "Pull-Ups", "Lateral Raise", "Barbell Curl", "Tricep Pushdown"], custom: false },
  { name: "Lower", exercises: ["Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raises"], custom: false },
  { name: "Full Body", exercises: ["Squat", "Bench Press", "Barbell Row", "OHP", "Barbell Curl", "Tricep Pushdown"], custom: false },
  { name: "Chest Day", exercises: ["Bench Press", "Incline DB Press", "Cable Fly", "Chest Dip", "Pec Deck"], custom: false },
  { name: "Back Day", exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Cable Row", "Face Pull"], custom: false },
  { name: "Arms Day", exercises: ["Barbell Curl", "Tricep Pushdown", "Hammer Curl", "Overhead Extension", "Preacher Curl", "Dips"], custom: false },
  { name: "Shoulders Day", exercises: ["OHP", "Lateral Raise", "Face Pull", "Rear Delt Fly", "Shrugs"], custom: false },
];

export const ABS_LIST = ["Plank", "Cable Crunch", "Leg Raise", "Russian Twist", "Ab Wheel", "Dead Bug", "Bicycle Crunch"];

export const CARDIO_LIST = ["Treadmill", "Cycling", "Rowing", "Stair Climber", "Jump Rope", "Elliptical"];
