"use client";

import { useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { Home } from "./screens/Home";
import { ActiveWorkout } from "./screens/ActiveWorkout";
import { History } from "./screens/History";
import { Progress } from "./screens/Progress";
import { Food } from "./screens/Food";

export type Tab = "home" | "workout" | "history" | "progress" | "food";

const NAV: { id: Tab; label: string }[] = [
  { id: "home", label: "HOME" },
  { id: "food", label: "FOOD" },
  { id: "history", label: "HISTORY" },
  { id: "progress", label: "PROGRESS" },
];

function Shell() {
  const { ready, active } = useStore();
  const [tab, setTab] = useState<Tab>("home");

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm tracking-[3px] font-bold" style={{ color: "var(--c4)" }}>
          RECOMP
        </span>
      </div>
    );
  }

  return (
    <>
      {tab === "home" && <Home go={setTab} />}
      {tab === "workout" && <ActiveWorkout go={setTab} />}
      {tab === "food" && <Food />}
      {tab === "history" && <History />}
      {tab === "progress" && <Progress />}

      {/* bottom nav (hidden while in an active workout view) */}
      {tab !== "workout" && (
        <nav
          className="flex items-stretch"
          style={{
            background: "var(--hd)",
            borderTop: "1px solid var(--bd)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className="flex-1 py-3 text-[10px] tracking-[1px]"
              style={{
                color: tab === n.id ? "var(--bl)" : "var(--c6)",
                fontWeight: tab === n.id ? 700 : 500,
              }}
            >
              {n.label}
            </button>
          ))}
          {active && (
            <button
              onClick={() => setTab("workout")}
              className="flex-1 py-3 text-[10px] tracking-[1px] font-bold"
              style={{ color: "var(--gn)" }}
            >
              ● LIVE
            </button>
          )}
        </nav>
      )}
    </>
  );
}

export function AppShell() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
