import { NextResponse } from "next/server";
import { pushStore } from "@/lib/push-server";

export const runtime = "nodejs";

// Compact daily snapshot from the client (single-user app) — lets the
// scheduled reminder function personalize and skip already-logged meals.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
    await pushStore().setJSON("status", {
      date: String(body.date),
      eaten: Number(body.eaten) || 0,
      goal: Number(body.goal) || 0,
      remaining: Math.max(0, Number(body.remaining) || 0),
      protein: Number(body.protein) || 0,
      slots: {
        breakfast: !!body.slots?.breakfast,
        lunch: !!body.slots?.lunch,
        dinner: !!body.slots?.dinner,
      },
      workedOut: !!body.workedOut,
      tz: typeof body.tz === "string" ? body.tz : "UTC",
      updatedAt: Date.now(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("status save failed", err);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}
