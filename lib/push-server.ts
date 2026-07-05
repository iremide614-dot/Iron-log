// Server-side push helpers: VAPID keys + subscriptions live in Netlify Blobs.
// Keys are generated on first use and never leave the server.

import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export type ReminderPref = {
  id: string; // 'workout' | 'breakfast' | 'lunch' | 'dinner'
  label: string;
  time: string; // "HH:MM" local
  enabled: boolean;
};

export type PushRecord = {
  subscription: webpush.PushSubscription;
  tz: string; // IANA timezone
  reminders: ReminderPref[];
  lastSent: Record<string, string>; // reminder id -> YYYY-MM-DD (in tz)
};

const VAPID_SUBJECT = "mailto:iremide614@gmail.com";

export function pushStore() {
  return getStore("push");
}

export async function getVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const store = pushStore();
  const existing = (await store.get("vapid", { type: "json" })) as
    | { publicKey: string; privateKey: string }
    | null;
  if (existing?.publicKey && existing?.privateKey) return existing;
  const keys = webpush.generateVAPIDKeys();
  await store.setJSON("vapid", keys);
  return keys;
}

export async function configuredWebpush() {
  const keys = await getVapidKeys();
  webpush.setVapidDetails(VAPID_SUBJECT, keys.publicKey, keys.privateKey);
  return webpush;
}

/** Stable blob key for a subscription endpoint. */
export function subKey(endpoint: string): string {
  // base64url of the endpoint keeps it opaque and filesystem-safe
  return "sub-" + Buffer.from(endpoint).toString("base64url").slice(-64);
}

export async function saveRecord(record: PushRecord) {
  await pushStore().setJSON(subKey(record.subscription.endpoint), record);
}

export async function getRecord(endpoint: string): Promise<PushRecord | null> {
  return (await pushStore().get(subKey(endpoint), { type: "json" })) as PushRecord | null;
}

export async function deleteRecord(endpoint: string) {
  await pushStore().delete(subKey(endpoint));
}

export async function listRecords(): Promise<{ key: string; record: PushRecord }[]> {
  const store = pushStore();
  const { blobs } = await store.list({ prefix: "sub-" });
  const out: { key: string; record: PushRecord }[] = [];
  for (const b of blobs) {
    const record = (await store.get(b.key, { type: "json" })) as PushRecord | null;
    if (record) out.push({ key: b.key, record });
  }
  return out;
}

/** "YYYY-MM-DD" and minutes-since-midnight for `now` in an IANA timezone. */
export function nowInTz(tz: string): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: parseInt(parts.hour) * 60 + parseInt(parts.minute),
  };
}
