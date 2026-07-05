import { NextResponse } from "next/server";
import {
  saveRecord,
  getRecord,
  deleteRecord,
  type PushRecord,
  type ReminderPref,
} from "@/lib/push-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    subscription?: PushRecord["subscription"];
    tz?: string;
    reminders?: ReminderPref[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { subscription, tz, reminders } = body;
  if (!subscription?.endpoint || !tz || !Array.isArray(reminders)) {
    return NextResponse.json({ error: "Missing subscription, tz or reminders" }, { status: 400 });
  }

  try {
    const existing = await getRecord(subscription.endpoint);
    await saveRecord({
      subscription,
      tz,
      reminders: reminders.map((r) => ({
        id: String(r.id),
        label: String(r.label),
        time: /^\d{2}:\d{2}$/.test(r.time) ? r.time : "12:00",
        enabled: !!r.enabled,
      })),
      lastSent: existing?.lastSent ?? {},
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push/subscribe failed", err);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    if (endpoint) await deleteRecord(endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not unsubscribe" }, { status: 500 });
  }
}
