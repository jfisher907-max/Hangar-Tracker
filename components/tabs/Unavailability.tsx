"use client";

import { useState } from "react";
import type { UnavailPeriod } from "@/lib/types";
import { fmtDT, fmtDur, toLocalInput } from "@/lib/stats";
import { logUnavail } from "@/lib/data";

type Alert = { type: "error" | "success"; msg: string } | null;

export default function Unavailability({
  unavail,
  onEndUnavail,
  onDeleteUnavail,
}: {
  unavail: UnavailPeriod[];
  onEndUnavail: (id: string) => void;
  onDeleteUnavail: (id: string) => void;
}) {
  const [start, setStart] = useState<string>(() => toLocalInput(new Date()));
  const [end, setEnd] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [alert, setAlert] = useState<Alert>(null);

  const openU = unavail.find((u) => !u.end);
  const sorted = [...unavail].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  const submit = async () => {
    setAlert(null);
    if (!start) {
      setAlert({ type: "error", msg: "Please enter a start time." });
      return;
    }
    if (end && new Date(end) <= new Date(start)) {
      setAlert({ type: "error", msg: "End must be after start." });
      return;
    }
    if (unavail.find((u) => !u.end)) {
      setAlert({ type: "error", msg: "An open unavailability period already exists." });
      return;
    }
    try {
      await logUnavail({ start, end, note: note.trim() });
      setAlert({ type: "success", msg: "Unavailability logged." });
      setEnd("");
      setNote("");
      setStart(toLocalInput(new Date()));
    } catch {
      setAlert({ type: "error", msg: "Save failed." });
    }
  };

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{(alert.type === "error" ? "⚠ " : "✓ ") + alert.msg}</div>}

      {openU && (
        <div className="live-strip unavail" style={{ marginBottom: 16 }}>
          <div>
            <div className="live-strip-ac unavail">🚫 Wings Hangar — UNAVAILABLE</div>
            <div className="live-strip-since">
              Since {fmtDT(openU.start)}
              {openU.note ? " · " + openU.note : ""}
            </div>
          </div>
          <div className="live-strip-actions">
            <button className="btn btn-red" style={{ fontSize: 11, padding: "8px 14px" }} onClick={() => onEndUnavail(openU.id)}>
              Mark Available
            </button>
          </div>
        </div>
      )}

      <div className="log-top-grid">
        <div>
          <div className="sl">Log Unavailability Period</div>
          <div className="card">
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14, lineHeight: 1.6 }}>
              Record periods when Wings Hangar is unavailable because the owner needs the space. Used for rent proration.
            </div>
            <div className="form-grid">
              <div className="fg">
                <label>Start Time</label>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="fg">
                <label>
                  End Time <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
                </label>
                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                <div className="hint">Leave blank if still unavailable</div>
              </div>
              <div className="fg full">
                <label>Reason / Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Owner stored personal aircraft, annual event, etc."
                />
              </div>
            </div>
            <button className="btn btn-red" onClick={submit}>
              🚫 Log Unavailability
            </button>
          </div>
        </div>
        <div>
          <div className="sl">Unavailability Log</div>
          <div>
            {sorted.length ? (
              sorted.map((u) => {
                const dur = u.end ? fmtDur(new Date(u.end).getTime() - new Date(u.start).getTime()) : null;
                return (
                  <div key={u.id} className="session-row unavail">
                    <div className="session-badge-col">
                      <span className="hangar-badge hb-unavail">UNAVAIL</span>
                      {!u.end && (
                        <span className="ongoing-tag ongoing-unavail" style={{ marginTop: 4 }}>
                          Active
                        </span>
                      )}
                    </div>
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
                      {u.note && (
                        <div className="sd-item">
                          <div className="sd-label">Note</div>
                          <div className="sd-note">{u.note}</div>
                        </div>
                      )}
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
          </div>
        </div>
      </div>
    </>
  );
}
