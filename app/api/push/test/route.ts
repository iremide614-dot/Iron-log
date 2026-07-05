import { NextResponse } from "next/server";
import { configuredWebpush, getRecord } from "@/lib/push-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    const record = await getRecord(endpoint);
    if (!record) return NextResponse.json({ error: "Not subscribed" }, { status: 404 });

    const wp = await configuredWebpush();
    await wp.sendNotification(
      record.subscription,
      JSON.stringify({
        title: "RECOMP 🔔",
        body: "Test notification — reminders are working!",
        tag: "recomp-test",
      })
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push/test failed", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
