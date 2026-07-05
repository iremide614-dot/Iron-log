// Scheduled reminder sender — runs every 15 minutes on Netlify Cron.
// Sends each enabled reminder once per day when its local time comes up.

import {
  configuredWebpush,
  listRecords,
  saveRecord,
  deleteRecord,
  nowInTz,
} from "../../lib/push-server";

const MESSAGES: Record<string, { title: string; body: string }> = {
  workout: { title: "Time to train 💪", body: "Your workout is waiting — go get it." },
  breakfast: { title: "Log breakfast 🍳", body: "Snap or repeat your breakfast in RECOMP." },
  lunch: { title: "Log lunch 🍽", body: "Don't forget to log what you ate for lunch." },
  dinner: { title: "Log dinner 🌙", body: "Close out the day — log your dinner." },
};

// fire window: reminder time <= now < time + 20min (covers cron drift)
const WINDOW_MIN = 20;

export default async function handler() {
  const wp = await configuredWebpush();
  const records = await listRecords();
  let sent = 0;

  for (const { record } of records) {
    const { date, minutes } = nowInTz(record.tz || "UTC");
    let dirty = false;

    for (const rem of record.reminders) {
      if (!rem.enabled) continue;
      if (record.lastSent[rem.id] === date) continue;
      const [h, m] = rem.time.split(":").map(Number);
      const target = h * 60 + m;
      if (minutes < target || minutes >= target + WINDOW_MIN) continue;

      const msg = MESSAGES[rem.id] ?? { title: "RECOMP 🔔", body: rem.label };
      try {
        await wp.sendNotification(
          record.subscription,
          JSON.stringify({ ...msg, tag: `recomp-${rem.id}` })
        );
        record.lastSent[rem.id] = date;
        dirty = true;
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          // subscription expired/revoked — clean it up
          await deleteRecord(record.subscription.endpoint);
          dirty = false;
          break;
        }
        console.error(`send ${rem.id} failed`, status, err);
      }
    }

    if (dirty) await saveRecord(record);
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { schedule: "*/15 * * * *" };
