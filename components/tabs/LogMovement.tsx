"use client";

import { useState } from "react";
import { AIRCRAFT, HANGARS, REASONS, type Session } from "@/lib/types";
import { fmtDT, fmtDurFull, toLocalInput } from "@/lib/stats";
import { logSession } from "@/lib/data";
import QuickLogButtons from "@/components/QuickLogButtons";

type Alert = { type: "error" | "success"; msg: string } | null;

export default function LogMovement({
  sessions,
  now,
  onQuickLog,
  onMove,
  onExit,
}: {
  sessions: Session[];
  now: number;
  onQuickLog: (aircraft: string, hangar: string) => void;
  onMove: (aircraft: string) => void;
  onExit: (session: Session) => void;
}) {
  const [aircraft, setAircraft] = useState<string>("N254AL");
  const [hangar, setHangar] = useState<string>("Wings Hangar");
  const [entry, setEntry] = useState<string>(() => toLocalInput(new Date()));
  const [exit, setExit] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [alert, setAlert] = useState<Alert>(null);

  const open = sessions.filter((s) => !s.exit);

  const acHangarMs = (ac: string, h: string) =>
    sessions
      .filter((s) => s.aircraft === ac && s.hangar === h && s.exit)
      .reduce((sum, s) => sum + (new Date(s.exit as string).getTime() - new Date(s.entry).getTime()), 0);

  const submit = async () => {
    setAlert(null);
    if (!entry) {
      setAlert({ type: "error", msg: "Please enter an entry time." });
      return;
    }
    if (exit && new Date(exit) <= new Date(entry)) {
      setAlert({ type: "error", msg: "Exit time must be after entry time." });
      return;
    }
    if (!exit) {
      const already = sessions.find((s) => s.aircraft === aircraft && !s.exit);
      if (already) {
        setAlert({
          type: "error",
          msg: `${aircraft} is already logged in ${already.hangar}. Either add an exit time to this entry, or log the current session's exit first.`,
        });
        return;
      }
    }
    try {
      await logSession({ aircraft, hangar, entry, exit, reason, note: note.trim() });
      setAlert({ type: "success", msg: `${aircraft} logged into ${hangar}.` });
      setExit("");
      setReason("");
      setNote("");
      setEntry(toLocalInput(new Date()));
    } catch {
      setAlert({ type: "error", msg: "Save failed — check connection." });
    }
  };

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{(alert.type === "error" ? "⚠ " : "✓ ") + alert.msg}</div>}

      <div className="sl">Quick Log — One Tap</div>
      <div className="quick-log-grid" style={{ marginBottom: 18 }}>
        <QuickLogButtons sessions={sessions} onQuickLog={onQuickLog} onMove={onMove} />
      </div>

      <div>
        {open.map((s) => {
          const isW = s.hangar === "Wings Hangar";
          const cls = isW ? "wings" : "alnw";
          return (
            <div key={s.id} className={`live-strip ${cls}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={`live-strip-ac ${cls}`}>
                  ✈ {s.aircraft} — {s.hangar.toUpperCase()}
                </div>
                <div className="live-strip-since">
                  In since {fmtDT(s.entry)}
                  {s.reason ? " · " + s.reason : ""}
                </div>
                <div className="live-timer-row">
                  <span className="live-timer-label">Elapsed:</span>
                  <span className="live-timer">{fmtDurFull(now - new Date(s.entry).getTime())}</span>
                </div>
              </div>
              <div className="live-strip-actions">
                <button className={`btn ${isW ? "btn-sm-green" : "btn-sm-orange"}`} onClick={() => onExit(s)}>
                  Log Exit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="log-top-grid">
        <div>
          <div className="sl">Manual Entry</div>
          <div className="card">
            <div className="form-grid">
              <div className="fg">
                <label>Aircraft</label>
                <select value={aircraft} onChange={(e) => setAircraft(e.target.value)}>
                  {AIRCRAFT.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Destination Hangar</label>
                <select value={hangar} onChange={(e) => setHangar(e.target.value)}>
                  {HANGARS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Entry Time</label>
                <input type="datetime-local" value={entry} onChange={(e) => setEntry(e.target.value)} />
              </div>
              <div className="fg">
                <label>
                  Exit Time <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
                </label>
                <input type="datetime-local" value={exit} onChange={(e) => setExit(e.target.value)} />
                <div className="hint">Leave blank if still there</div>
              </div>
              <div className="fg full form-section-divider">
                <div className="form-section-label">Move Reason (optional)</div>
              </div>
              <div className="fg">
                <label>Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">— No specific reason —</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>
                  Note <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
                </label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional details…" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={submit}>
              + Log Entry
            </button>
          </div>
        </div>
        <div>
          <div className="sl">Hours by Hangar (All Time)</div>
          <div className="card">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 12 }}>
              {(
                [
                  ["Wings — N254AL", "N254AL", "Wings Hangar", "var(--green)"],
                  ["ALNW — N254AL", "N254AL", "ALNW", "var(--orange2)"],
                  ["Wings — N253AL", "N253AL", "Wings Hangar", "var(--green)"],
                  ["ALNW — N253AL", "N253AL", "ALNW", "var(--orange2)"],
                ] as [string, string, string, string][]
              ).map(([label, ac, h, color]) => (
                <div
                  key={label}
                  style={{
                    background: "var(--bg1)",
                    borderRadius: 5,
                    padding: 12,
                    borderLeft: `2px solid ${h === "Wings Hangar" ? "var(--green)" : "var(--orange)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.14em",
                      color: "var(--text3)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      marginBottom: 5,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 17, color }}>
                    {(acHangarMs(ac, h) / 3600000).toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
            <hr />
            <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.9, marginTop: 10 }}>
              <div style={{ color: "var(--text2)", fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
                Quick Log — tap to log instantly at current time.
              </div>
              <div>Manual Entry — use for past times or to add a reason.</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ color: "#b080f0", fontWeight: 600 }}>⇄ Move N254AL / Move N253AL</span> — moves each aircraft
                individually to the other hangar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
