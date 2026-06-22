"use client";

import { useState } from "react";
import type { DateFilter, Session, UnavailPeriod } from "@/lib/types";
import { saveNewPin } from "@/lib/data";
import { buildCSV, buildEmailText, downloadText, todayStamp } from "@/lib/report";

type Alert = { type: "error" | "success"; msg: string } | null;

export default function Settings({
  sessions,
  unavail,
  filter,
  onClearAll,
}: {
  sessions: Session[];
  unavail: UnavailPeriod[];
  filter: DateFilter;
  onClearAll: () => void;
}) {
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [alert, setAlert] = useState<Alert>(null);

  const savePin = async () => {
    const p1 = pin1.trim();
    const p2 = pin2.trim();
    if (!p1) {
      setAlert({ type: "error", msg: "Please enter a PIN." });
      return;
    }
    if (p1 !== p2) {
      setAlert({ type: "error", msg: "PINs do not match." });
      return;
    }
    if (p1.length < 4) {
      setAlert({ type: "error", msg: "PIN must be at least 4 characters." });
      return;
    }
    try {
      await saveNewPin(p1);
      setAlert({ type: "success", msg: "PIN updated." });
      setPin1("");
      setPin2("");
    } catch {
      setAlert({ type: "error", msg: "Save failed." });
    }
  };

  const downloadReport = () =>
    downloadText(buildEmailText(sessions, unavail, filter), `hangar-usage-report-${todayStamp()}.txt`, "text/plain");
  const downloadCsv = () => downloadText(buildCSV(sessions, filter), `hangar-sessions-${todayStamp()}.csv`, "text/csv");

  return (
    <>
      {alert && <div className={`alert alert-${alert.type}`}>{(alert.type === "error" ? "⚠ " : "✓ ") + alert.msg}</div>}

      <div className="card" style={{ marginBottom: 13, borderColor: "rgba(48,200,112,0.3)", borderLeft: "3px solid var(--green)" }}>
        <div className="sl">Sync Status</div>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
          ✓ Real-time sync active via Supabase. All data syncs instantly across every device.
        </div>
      </div>

      <div className="card" style={{ marginBottom: 13 }}>
        <div className="sl">Change PIN</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 13, lineHeight: 1.7 }}>
          Update the access PIN. Stored securely in Supabase — not in this app.
        </div>
        <div className="form-grid">
          <div className="fg">
            <label>New PIN</label>
            <input
              type="password"
              value={pin1}
              onChange={(e) => setPin1(e.target.value)}
              placeholder="Enter new PIN"
              autoComplete="new-password"
            />
          </div>
          <div className="fg">
            <label>Confirm PIN</label>
            <input
              type="password"
              value={pin2}
              onChange={(e) => setPin2(e.target.value)}
              placeholder="Confirm new PIN"
              autoComplete="new-password"
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={savePin}>
          Save New PIN
        </button>
      </div>

      <div className="card" style={{ marginBottom: 13 }}>
        <div className="sl">Export</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 13 }}>Download a full report or CSV of all data.</div>
        <div className="data-row">
          <button className="btn btn-primary" onClick={downloadReport}>
            ⬇ Download Report
          </button>
          <button className="btn btn-outline" onClick={downloadCsv}>
            📊 Download CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ borderColor: "#4a1a1a" }}>
        <div className="sl" style={{ color: "var(--red)" }}>
          Danger Zone
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 11 }}>
          Permanently delete all records. Cannot be undone.
        </div>
        <button className="btn btn-danger" onClick={onClearAll}>
          🗑 Clear All Data
        </button>
      </div>
    </>
  );
}
