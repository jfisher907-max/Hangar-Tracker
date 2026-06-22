"use client";

import { useState } from "react";
import { AIRCRAFT, HANGARS, type Session, type UnavailPeriod } from "@/lib/types";
import { fmtDT, fmtDur } from "@/lib/stats";

export default function History({
  sessions,
  unavail,
  onExit,
  onDeleteSession,
  onEndUnavail,
  onDeleteUnavail,
}: {
  sessions: Session[];
  unavail: UnavailPeriod[];
  onExit: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onEndUnavail: (id: string) => void;
  onDeleteUnavail: (id: string) => void;
}) {
  const [filterAc, setFilterAc] = useState<string>("All");
  const [filterHangar, setFilterHangar] = useState<string>("All");
  const [tab, setTab] = useState<"sessions" | "unavail">("sessions");

  let filtered = [...sessions];
  if (filterAc !== "All") filtered = filtered.filter((s) => s.aircraft === filterAc);
  if (filterHangar !== "All") filtered = filtered.filter((s) => s.hangar === filterHangar);
  filtered.sort((a, b) => new Date(b.entry).getTime() - new Date(a.entry).getTime());

  const sortedU = [...unavail].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return (
    <>
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <select className="filter-select" value={filterAc} onChange={(e) => setFilterAc(e.target.value)}>
          <option value="All">All Aircraft</option>
          {AIRCRAFT.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select className="filter-select" value={filterHangar} onChange={(e) => setFilterHangar(e.target.value)}>
          <option value="All">All Hangars</option>
          {HANGARS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === "sessions" ? " active" : ""}`} onClick={() => setTab("sessions")}>
          Aircraft Sessions
        </button>
        <button className={`tab-btn${tab === "unavail" ? " active" : ""}`} onClick={() => setTab("unavail")}>
          Unavailability Log
        </button>
      </div>

      {tab === "sessions" ? (
        filtered.length ? (
          filtered.map((s) => {
            const dur = s.exit ? fmtDur(new Date(s.exit).getTime() - new Date(s.entry).getTime()) : null;
            const isW = s.hangar === "Wings Hangar";
            const bcls = s.aircraft === "N254AL" ? "badge-n254" : "badge-n253";
            const hbcls = isW ? "hb-wings" : "hb-alnw";
            const durCls = dur ? (isW ? "sd-dur" : "sd-dur-orange") : "sd-ongoing";
            const reason = s.exitReason || s.reason || "";
            const note = s.exitNote || s.note || "";
            return (
              <div key={s.id} className={`session-row ${isW ? "wings" : "alnw"}`}>
                <div className="session-badge-col">
                  <span className={`session-badge ${bcls}`}>{s.aircraft}</span>
                  <span className={`hangar-badge ${hbcls}`}>{s.hangar}</span>
                  {!s.exit && (
                    <span className={`ongoing-tag ${isW ? "ongoing-wings" : "ongoing-alnw"}`} style={{ marginTop: 2 }}>
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <div className="session-data">
                    <div className="sd-item">
                      <div className="sd-label">Entry</div>
                      <div className="sd-val">{fmtDT(s.entry)}</div>
                    </div>
                    <div className="sd-item">
                      <div className="sd-label">Exit</div>
                      <div className="sd-val">{s.exit ? fmtDT(s.exit) : "—"}</div>
                    </div>
                    <div className="sd-item">
                      <div className="sd-label">Duration</div>
                      <div className={`sd-val ${durCls}`}>{dur || "Ongoing"}</div>
                    </div>
                  </div>
                  {reason && <div className="sd-reason" style={{ marginTop: 5 }}>Reason: {reason}</div>}
                  {note && <div className="sd-note">Note: {note}</div>}
                </div>
                <div className="session-actions">
                  {!s.exit && (
                    <button className="btn btn-sm-green" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => onExit(s)}>
                      Exit
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={() => onDeleteSession(s.id)}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <div className="empty-icon">📋</div>
            No sessions found.
          </div>
        )
      ) : sortedU.length ? (
        sortedU.map((u) => {
          const dur = u.end ? fmtDur(new Date(u.end).getTime() - new Date(u.start).getTime()) : null;
          return (
            <div key={u.id} className="session-row unavail">
              <div className="session-badge-col">
                <span className="hangar-badge hb-unavail">WINGS UNAVAIL</span>
                {!u.end && (
                  <span className="ongoing-tag ongoing-unavail" style={{ marginTop: 4 }}>
                    Active
                  </span>
                )}
              </div>
              <div>
                <div className="session-data">
                  <div className="sd-item">
                    <div className="sd-label">Start</div>
                    <div className="sd-val">{fmtDT(u.start)}</div>
                  </div>
                  <div className="sd-item">
                    <div className="sd-label">End</div>
                    <div className="sd-val">{u.end ? fmtDT(u.end) : "—"}</div>
                  </div>
                  <div className="sd-item">
                    <div className="sd-label">Duration</div>
                    <div className={`sd-val ${dur ? "sd-dur-red" : "sd-ongoing"}`}>{dur || "Ongoing"}</div>
                  </div>
                </div>
                {u.note && <div className="sd-note" style={{ marginTop: 5 }}>{u.note}</div>}
              </div>
              <div className="session-actions">
                {!u.end && (
                  <button className="btn btn-red" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => onEndUnavail(u.id)}>
                    End
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => onDeleteUnavail(u.id)}>
                  ✕
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty">
          <div className="empty-icon">🚫</div>
          No unavailability periods logged.
        </div>
      )}
    </>
  );
}
