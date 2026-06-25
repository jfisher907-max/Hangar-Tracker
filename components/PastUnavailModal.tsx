"use client";

import { useState } from "react";
import type { UnavailPeriod } from "@/lib/types";
import { fmtDT, fmtDur, toLocalInput } from "@/lib/stats";
import { logUnavail } from "@/lib/data";

export default function PastUnavailModal({
  unavail,
  onClose,
  onToast,
}: {
  unavail: UnavailPeriod[];
  onClose: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [start, setStart] = useState<string>(() => toLocalInput(new Date()));
  const [end, setEnd] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  let preview = "Choose when it became unavailable";
  if (start) {
    if (!end) preview = `Wings unavailable · since ${fmtDT(start)} · still unavailable`;
    else if (new Date(end) > new Date(start))
      preview = `Wings unavailable · ${fmtDT(start)} → ${fmtDT(end)} · ${fmtDur(new Date(end).getTime() - new Date(start).getTime())}`;
    else preview = "Until must be after the start time";
  }

  const save = async () => {
    setError("");
    if (!start) {
      setError("Choose when Wings became unavailable.");
      return;
    }
    if (end && new Date(end) <= new Date(start)) {
      setError("Until must be after the start time.");
      return;
    }
    if (!end && unavail.find((u) => !u.end)) {
      setError("An open unavailability period already exists. Add an until time, or end the current one first.");
      return;
    }
    try {
      await logUnavail({ start, end, note: reason.trim() });
      onToast("Unavailability added to the log.", "success");
      onClose();
    } catch {
      onToast("Save failed — check connection.", "error");
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Log past unavailability</div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <div className="form-grid">
          <div className="fg full">
            <label>Unavailable from</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Until <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional — leave blank if still unavailable)</span>
            </label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Reason <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
            </label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. owner needs the space" />
          </div>
        </div>
        <div className="backlog-preview">{preview}</div>
        <div className="modal-actions">
          <button className="btn btn-red" onClick={save}>
            Save unavailability
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
