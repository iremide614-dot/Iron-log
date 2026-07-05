"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { personalRecords, calcVolume } from "@/lib/workouts";
import { LineChart, BarChart } from "../Chart";
import { shortDate } from "@/lib/format";

export function Progress() {
  const { workouts, bodyweight, profile, logBodyWeight } = useStore();
  const [bw, setBw] = useState("");
  const [showAllPrs, setShowAllPrs] = useState(false);

  const prs = personalRecords(workouts);

  // volume per workout (oldest -> newest), last 10
  const volSeries = [...workouts]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-10)
    .map((w) => ({ label: shortDate(w.date).split(" ")[1], value: Math.round(calcVolume(w)) }));

  const bwSeries = bodyweight.slice(-14).map((b) => ({
    label: shortDate(b.date).split(" ")[1],
    value: b.weight,
  }));

  const latestBw = bodyweight.length ? bodyweight[bodyweight.length - 1].weight : null;

  function submitBw() {
    const n = parseFloat(bw);
    if (!isNaN(n) && n > 0) {
      logBodyWeight(n);
      setBw("");
    }
  }

  return (
    <div className="scroll-area px-5 py-4 pb-24">
      {/* volume */}
      <Section title="VOLUME (last 10)">
        <BarChart data={volSeries} color="var(--bl)" />
      </Section>

      {/* bodyweight */}
      <Section title="BODY WEIGHT">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            inputMode="decimal"
            placeholder={`Today's weight (${profile.unit})`}
            value={bw}
            onChange={(e) => setBw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitBw()}
          />
          <button
            onClick={submitBw}
            className="px-4 py-2.5 rounded-lg text-sm font-bold shrink-0"
            style={{ background: "var(--bl)", color: "#000" }}
          >
            Log
          </button>
        </div>
        {latestBw !== null && (
          <div className="mb-2 text-xs" style={{ color: "var(--c3)" }}>
            Latest:{" "}
            <span style={{ color: "var(--c1)", fontWeight: 700 }}>
              {latestBw} {profile.unit}
            </span>
          </div>
        )}
        <LineChart data={bwSeries} color="var(--gn)" />
      </Section>

      {/* PRs */}
      <Section title={`PERSONAL RECORDS · ${prs.length}`}>
        {prs.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--c4)" }}>
            Complete some sets to start tracking PRs.
          </p>
        ) : (
          <>
            <div className="flex flex-col">
              {(showAllPrs ? prs : prs.slice(0, 6)).map((pr, i) => (
                <div
                  key={pr.name}
                  className="flex items-center justify-between gap-3 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--bd)" }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--c2)" }}>
                      {pr.name}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--c4)" }}>
                      {shortDate(pr.date)}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0"
                    style={{
                      background: "rgba(176,128,48,.12)",
                      color: "var(--gl)",
                      fontFamily: "var(--font-dm-mono)",
                    }}
                  >
                    {pr.weight}{profile.unit} × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
            {prs.length > 6 && (
              <button
                onClick={() => setShowAllPrs((v) => !v)}
                className="w-full text-xs font-semibold mt-2 py-2 rounded-lg"
                style={{ background: "var(--ip)", color: "var(--c3)" }}
              >
                {showAllPrs ? "Show less" : `Show all ${prs.length}`}
              </button>
            )}
          </>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: "var(--cd)", border: "1px solid var(--bd)" }}
    >
      <div className="text-[10px] font-semibold tracking-[2px] mb-3" style={{ color: "var(--c4)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
