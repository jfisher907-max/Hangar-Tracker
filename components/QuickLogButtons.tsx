"use client";

import { AIRCRAFT, HANGARS, type Session } from "@/lib/types";

export default function QuickLogButtons({
  sessions,
  onQuickLog,
  onMove,
}: {
  sessions: Session[];
  onQuickLog: (aircraft: string, hangar: string) => void;
  onMove: (aircraft: string) => void;
}) {
  const open = sessions.filter((s) => !s.exit);
  return (
    <>
      {AIRCRAFT.map((ac) => {
        const inHangar = open.find((s) => s.aircraft === ac);
        return HANGARS.map((h) => {
          const isActive = inHangar && inHangar.hangar === h;
          const isW = h === "Wings Hangar";
          if (isActive)
            return (
              <button key={`${ac}-${h}`} className="ql-btn ql-active" disabled>
                ✓ {ac} IN {h}
              </button>
            );
          if (inHangar)
            return (
              <button key={`${ac}-${h}`} className="ql-btn ql-disabled" disabled title={`${ac} already in ${inHangar.hangar}`}>
                {ac} → {h}
              </button>
            );
          return (
            <button key={`${ac}-${h}`} className={`ql-btn ${isW ? "ql-wings" : "ql-alnw"}`} onClick={() => onQuickLog(ac, h)}>
              {ac} → {h}
            </button>
          );
        });
      })}
      {AIRCRAFT.map((ac) => {
        const inHangar = open.find((s) => s.aircraft === ac);
        if (!inHangar)
          return (
            <button key={`move-${ac}`} className="ql-btn ql-disabled" disabled>
              ⇄ Move {ac}
            </button>
          );
        const dest = inHangar.hangar === "Wings Hangar" ? "ALNW" : "Wings Hangar";
        return (
          <button key={`move-${ac}`} className="ql-btn ql-move" onClick={() => onMove(ac)}>
            ⇄ {ac} → {dest}
          </button>
        );
      })}
    </>
  );
}
