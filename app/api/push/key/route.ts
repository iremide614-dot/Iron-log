import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/push-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { publicKey } = await getVapidKeys();
    return NextResponse.json({ publicKey });
  } catch (err) {
    console.error("push/key failed", err);
    return NextResponse.json({ error: "Push not available" }, { status: 500 });
  }
}
