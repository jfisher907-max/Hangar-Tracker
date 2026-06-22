"use client";

import { AIRCRAFT, type Session, type UnavailPeriod } from "@/lib/types";
import { completedHangarMs, fmtDT, fmtDur, fmtDurFull } from "@/lib/stats";
import QuickLogButtons from "@/components/QuickLogButtons";

export default function Dashboard({
  sessions,
  unavail,
  now,
  onQuickLog,
  onMove,
  onExit,
  onEndUnavail,
  onGoTab,
}: {
  sessions: Session[];
  unavail: UnavailPeriod[];
  now: number;
  onQuickLog: (aircraft: string, hangar: string) => void;
  onMove: (aircraft: string) => void;
  onExit: (session: Session) => void;
  onEndUnavail: (id: string) => void;
  onGoTab: (tab: string) => void;
}) {
  const open = sessions.filter((s) => !s.exit);
  const openU = unavail.find((u) => !u.end);
  const wMs = completedHangarMs(sessions, "Wings Hangar");
  const aMs = completedHangarMs(sessions, "ALNW");

  const nowD = new Date(now);
  const monthStart = new Date(nowD.getFullYear(), nowD.getMonth(), 1);
  const monthSess = sessions.filter((s) => s.exit && new Date(s.entry) >= monthStart);
  const mwMs = monthSess
    .filter((s) => s.hangar === "Wings Hangar")
    .reduce((sum, s) => sum + (new Date(s.exit as string).getTime() - new Date(s.entry).getTime()), 0);
  const maMs = monthSess
    .filter((s) => s.hangar === "ALNW")
    .reduce((sum, s) => sum + (new Date(s.exit as string).getTime() - new Date(s.entry).getTime()), 0);

  const recent = [...sessions].sort((a, b) => new Date(b.entry).getTime() - new Date(a.entry).getTime()).slice(0, 5);

  return (
    <div className="dash-grid">
      {/* Aircraft Status Cards */}
      <div className="dash-section" style={{ gridColumn: "1/-1" }}>
        <div className="dash-section-label">Live Aircraft Status</div>
        <div className="dash-ac-cards">
          {AIRCRAFT.map((ac) => {
            const s = open.find((o) => o.aircraft === ac);
            const isW = s && s.hangar === "Wings Hangar";
            const cls = !s ? "out" : isW ? "wings" : "alnw";
            const elapsedMs = s ? now - new Date(s.entry).getTime() : 0;
            return (
              <div key={ac} className={`dash-ac-card ${cls}`}>
                <div className="dash-ac-top">
                  <div>
                    <div className="dash-ac-reg">{ac}</div>
                    <div className={`dash-ac-status ${cls}`}>{s ? s.hangar : "Not in hangar"}</div>
                  </div>
                  <div className="dash-ac-dot-wrap">
                    <span className={`big-dot ${cls}`}></span>
                  </div>
                </div>
                {s ? (
                  <>
                    <div className="dash-ac-since">Since {fmtDT(s.entry)}</div>
                    <div className="dash-ac-timer">{fmtDurFull(elapsedMs)}</div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn btn-sm-exit" onClick={() => onExit(s)}>
                        Log Exit
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="dash-ac-since">Tap a quick-log button below</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Log */}
      <div className="dash-section" style={{ gridColumn: "1/-1" }}>
        <div className="dash-section-label">Quick Log</div>
        <div className="quick-log-grid">
          <QuickLogButtons sessions={sessions} onQuickLog={onQuickLog} onMove={onMove} />
        </div>
      </div>

      {/* Wings Unavailability */}
      {openU && (
        <div className="dash-section" style={{ gridColumn: "1/-1" }}>
          <div className="dash-unavail-banner">
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--red)", fontWeight: 600 }}>
                🚫 WINGS HANGAR UNAVAILABLE
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                Since {fmtDT(openU.start)}
                {openU.note ? " · " + openU.note : ""}
              </div>
            </div>
            <button className="btn btn-red" style={{ fontSize: 11, padding: "8px 16px" }} onClick={() => onEndUnavail(openU.id)}>
              Mark Available
            </button>
          </div>
        </div>
      )}

      {/* This Month */}
      <div className="dash-section">
        <div className="dash-section-label">This Month</div>
        <div className="dash-stat-grid">
          <div className="dash-stat">
            <div className="dash-stat-label">Wings Hangar</div>
            <div className="dash-stat-val" style={{ color: "var(--green)" }}>
              {(mwMs / 3600000).toFixed(1)}h
            </div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">ALNW</div>
            <div className="dash-stat-val" style={{ color: "var(--orange2)" }}>
              {(maMs / 3600000).toFixed(1)}h
            </div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">Sessions</div>
            <div className="dash-stat-val">{monthSess.length}</div>
          </div>
        </div>
      </div>

      {/* All Time */}
      <div className="dash-section">
        <div className="dash-section-label">All Time</div>
        <div className="dash-stat-grid">
          <div className="dash-stat">
            <div className="dash-stat-label">Wings Hangar</div>
            <div className="dash-stat-val" style={{ color: "var(--green)" }}>
              {(wMs / 3600000).toFixed(1)}h
            </div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">ALNW</div>
            <div className="dash-stat-val" style={{ color: "var(--orange2)" }}>
              {(aMs / 3600000).toFixed(1)}h
            </div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">Total Sessions</div>
            <div className="dash-stat-val">{sessions.filter((s) => s.exit).length}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dash-section" style={{ gridColumn: "1/-1" }}>
        <div className="dash-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Recent Activity</span>
          <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => onGoTab("history")}>
            View All →
          </button>
        </div>
        {recent.length ? (
          recent.map((s) => {
            const isW = s.hangar === "Wings Hangar";
            const dur = s.exit ? fmtDur(new Date(s.exit).getTime() - new Date(s.entry).getTime()) : null;
            const bcls = s.aircraft === "N254AL" ? "badge-n254" : "badge-n253";
            const hbcls = isW ? "hb-wings" : "hb-alnw";
            const reason = s.exitReason || s.reason || "";
            return (
              <div key={s.id} className={`dash-recent-row ${isW ? "wings" : "alnw"}`}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                  <span className={`session-badge ${bcls}`}>{s.aircraft}</span>
                  <span className={`hangar-badge ${hbcls}`}>{s.hangar}</span>
                  {!s.exit && <span className={`ongoing-tag ongoing-${isW ? "wings" : "alnw"}`}>Active</span>}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
                  <span>
                    <span style={{ color: "var(--text3)" }}>In: </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{fmtDT(s.entry)}</span>
                  </span>
                  <span>
                    <span style={{ color: "var(--text3)" }}>Out: </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{s.exit ? fmtDT(s.exit) : "—"}</span>
                  </span>
                  <span>
                    <span style={{ color: "var(--text3)" }}>Duration: </span>
                    <span className={dur ? (isW ? "sd-dur" : "sd-dur-orange") : "sd-ongoing"}>{dur || "Ongoing"}</span>
                  </span>
                  {reason && <span style={{ color: "var(--text3)", fontStyle: "italic" }}>{reason}</span>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty" style={{ padding: 24 }}>
            <div className="empty-icon">📋</div>
            No sessions yet.
          </div>
        )}
      </div>
    </div>
  );
}
