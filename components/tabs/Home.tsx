"use client";

import { AIRCRAFT, type DateFilter, type Session, type UnavailPeriod } from "@/lib/types";
import { filterByDate, fmtDT, fmtDur, fmtDurFull, getUnavailStats } from "@/lib/stats";

const SWITCH: { label: string; val: string; cls: string }[] = [
  { label: "Wings", val: "Wings Hangar", cls: "sw-wings" },
  { label: "ALNW", val: "ALNW", cls: "sw-alnw" },
  { label: "Out", val: "Out", cls: "sw-out" },
];

const THIS_MONTH: DateFilter = { preset: "this_month", start: null, end: null };

export default function Home({
  sessions,
  unavail,
  now,
  onSetLocation,
  onToggleWings,
  onPastMove,
  onPastUnavail,
}: {
  sessions: Session[];
  unavail: UnavailPeriod[];
  now: number;
  onSetLocation: (aircraft: string, target: string) => void;
  onToggleWings: (makeUnavailable: boolean) => void;
  onPastMove: () => void;
  onPastUnavail: () => void;
}) {
  const open = sessions.filter((s) => !s.exit);
  const openU = unavail.find((u) => !u.end);
  const monthHrs = getUnavailStats(filterByDate(unavail, "start", THIS_MONTH)).totalHours;

  return (
    <>
      <div className="sl">Live positions — tap to log a move</div>
      <div className="board-jets">
        {AIRCRAFT.map((ac) => {
          const s = open.find((o) => o.aircraft === ac);
          const loc = s ? s.hangar : "Out";
          return (
            <div className="jet-card" key={ac}>
              <div className="jet-top">
                <div className="jet-reg">{ac}</div>
                <div className="jet-elapsed">{s ? fmtDurFull(now - new Date(s.entry).getTime()) : ""}</div>
              </div>
              <div className="jet-since">{s ? `In ${s.hangar} · since ${fmtDT(s.entry)}` : "Not in a hangar"}</div>
              <div className="switch">
                {SWITCH.map((opt) => (
                  <button
                    key={opt.val}
                    className={`${opt.cls}${loc === opt.val ? " on" : ""}`}
                    onClick={() => onSetLocation(ac, opt.val)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`wings-block${openU ? " unavail" : ""}`}>
        <div className="wb-head">
          <div className="wb-title">Wings Hangar</div>
          <div className={`wb-pill ${openU ? "no" : "ok"}`}>{openU ? "Unavailable" : "Available"}</div>
        </div>
        <div className="wb-sub">
          {openU
            ? `Unavailable since ${fmtDT(openU.start)} · ${fmtDur(now - new Date(openU.start).getTime())}`
            : "Usable now — not accruing unavailable time"}
        </div>
        <button className={`btn ${openU ? "btn-sm-green" : "btn-red"}`} style={{ width: "100%", justifyContent: "center" }} onClick={() => onToggleWings(!openU)}>
          {openU ? "Mark available" : "🚫 Mark unavailable"}
        </button>
        <div className="wb-metric">
          <span className="l">Unavailable this month</span>
          <span className="v">{monthHrs} hrs</span>
        </div>
      </div>

      <div className="backlog-row">
        <button className="backlog-btn" onClick={onPastMove}>
          ＋ Log past move
        </button>
        <button className="backlog-btn" onClick={onPastUnavail}>
          ＋ Log past unavailability
        </button>
      </div>
    </>
  );
}
