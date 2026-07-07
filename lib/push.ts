"use client";

// Client-side push subscription helpers.

import type { ReminderPref } from "./push-server";

export type { ReminderPref };

export const DEFAULT_REMINDERS: ReminderPref[] = [
  { id: "workout", label: "Workout", time: "17:30", enabled: true },
  { id: "breakfast", label: "Log breakfast", time: "08:30", enabled: false },
  { id: "lunch", label: "Log lunch", time: "13:00", enabled: false },
  { id: "dinner", label: "Log dinner", time: "19:30", enabled: false },
];

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Ask permission, subscribe to push, and save prefs on the server.
 *  Self-heals: if the device is subscribed under a stale VAPID key
 *  (server key changed), it re-subscribes with the current one. */
export async function enableReminders(reminders: ReminderPref[]): Promise<PushSubscription> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications not allowed");

  const res = await fetch("/api/push/key");
  if (!res.ok) throw new Error("Push server unavailable");
  const { publicKey } = await res.json();
  const serverKey = urlBase64ToUint8Array(publicKey);

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (sub) {
    const raw = sub.options?.applicationServerKey;
    const current = raw ? new Uint8Array(raw) : null;
    const same =
      current !== null &&
      current.length === serverKey.length &&
      current.every((v, i) => v === serverKey[i]);
    if (!same) {
      // stale key -> Apple/Google would reject sends (VapidPkHashMismatch)
      await sub.unsubscribe().catch(() => {});
      sub = null;
    }
  }

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverKey,
    });
  }
  await savePrefs(sub, reminders);
  return sub;
}

export async function savePrefs(sub: PushSubscription, reminders: ReminderPref[]) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reminders,
    }),
  });
  if (!res.ok) throw new Error("Could not save reminders");
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function disableReminders() {
  const sub = await currentSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe();
}

export async function sendTest(sub: PushSubscription) {
  const res = await fetch("/api/push/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  if (!res.ok) throw new Error("Test send failed");
}
