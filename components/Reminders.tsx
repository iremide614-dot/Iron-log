"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import {
  DEFAULT_REMINDERS,
  type ReminderPref,
  pushSupported,
  enableReminders,
  savePrefs,
  currentSubscription,
  disableReminders,
  sendTest,
} from "@/lib/push";

type Status = "unsupported" | "off" | "busy" | "on";

export function Reminders() {
  const [status, setStatus] = useState<Status>("off");
  const [prefs, setPrefs] = useState<ReminderPref[]>(DEFAULT_REMINDERS);
  const [note, setNote] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setStatus("unsupported");
      return;
    }
    setPrefs(storage.get<ReminderPref[]>("rem") ?? DEFAULT_REMINDERS);
    currentSubscription()
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  function patch(id: string, p: Partial<ReminderPref>) {
    setPrefs((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setDirty(true);
  }

  async function enable() {
    setStatus("busy");
    setNote(null);
    try {
      await enableReminders(prefs);
      storage.set("rem", prefs);
      setStatus("on");
      setDirty(false);
      setNote("Reminders on ✓");
    } catch (e) {
      setStatus("off");
      setNote(e instanceof Error ? e.message : "Could not enable");
    }
  }

  async function save() {
    setNote(null);
    try {
      const sub = await currentSubscription();
      if (!sub) return enable();
      await savePrefs(sub, prefs);
      storage.set("rem", prefs);
      setDirty(false);
      setNote("Saved ✓");
    } catch {
      setNote("Could not save — try again");
    }
  }

  async function test() {
    setNote(null);
    try {
      const sub = await currentSubscription();
      if (!sub) throw new Error("Enable reminders first");
      await sendTest(sub);
      setNote("Test sent — check your notifications");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Test failed");
    }
  }

  async function turnOff() {
    setStatus("busy");
    try {
      await disableReminders();
    } finally {
      setStatus("off");
      setNote("Reminders off");
    }
  }

  if (status === "unsupported") {
    return (
      <Card>
        <p className="text-xs" style={{ color: "var(--c4)" }}>
          🔔 Notifications aren&apos;t supported in this browser. On iPhone, install the app to
          your Home Screen first (Share → Add to Home Screen), then open it from there.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold tracking-[2px]" style={{ color: "var(--c4)" }}>
          🔔 REMINDERS
        </span>
        {status === "on" ? (
          <button onClick={turnOff} className="text-[10px] font-semibold" style={{ color: "var(--rd)" }}>
            Turn off
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {prefs.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <button
              onClick={() => patch(r.id, { enabled: !r.enabled })}
              className="w-10 h-6 rounded-full shrink-0 relative transition-all"
              style={{ background: r.enabled ? "var(--gn)" : "var(--ip)" }}
              aria-label={`${r.enabled ? "Disable" : "Enable"} ${r.label}`}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{ background: "#fff", left: r.enabled ? 18 : 2 }}
              />
            </button>
            <span className="flex-1 text-sm" style={{ color: r.enabled ? "var(--c2)" : "var(--c4)" }}>
              {r.label}
            </span>
            <input
              type="time"
              value={r.time}
              onChange={(e) => patch(r.id, { time: e.target.value })}
              disabled={!r.enabled}
              className="shrink-0"
              style={{
                background: "var(--ip)",
                border: "1px solid var(--bd)",
                borderRadius: 8,
                padding: "6px 8px",
                fontSize: 13,
                color: r.enabled ? "var(--c2)" : "var(--c5)",
                fontFamily: "var(--font-dm-mono)",
                width: 92,
                outline: "none",
              }}
            />
          </div>
        ))}
      </div>

      {status !== "on" ? (
        <button
          onClick={enable}
          disabled={status === "busy"}
          className="w-full text-sm font-bold py-3 rounded-xl"
          style={{ background: "var(--bl)", color: "#000", opacity: status === "busy" ? 0.6 : 1 }}
        >
          {status === "busy" ? "Enabling…" : "Enable reminders"}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={!dirty}
            className="flex-1 text-sm font-bold py-2.5 rounded-xl"
            style={{
              background: dirty ? "var(--bl)" : "var(--ip)",
              color: dirty ? "#000" : "var(--c4)",
            }}
          >
            Save changes
          </button>
          <button
            onClick={test}
            className="px-4 text-sm font-semibold py-2.5 rounded-xl"
            style={{ background: "var(--ip)", color: "var(--c2)" }}
          >
            Send test
          </button>
        </div>
      )}

      {note && (
        <p className="text-[11px] mt-2 text-center" style={{ color: "var(--c3)" }}>
          {note}
        </p>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
    >
      {children}
    </div>
  );
}
