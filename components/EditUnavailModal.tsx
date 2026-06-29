"use client";

import { useState } from "react";
import type { UnavailPeriod } from "@/lib/types";
import { fmtDur, toLocalInput } from "@/lib/stats";
import { updateUnavail } from "@/lib/data";

export default function EditUnavailModal({
  period,
  onClose,
  onToast,
}: {
  period: UnavailPeriod;
  onClose: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [start, setStart] = useState(toLocalInput(new Date(period.start)));
  const [end, setEnd] = useState(period.end ? toLocalInput(new Date(period.end)) : "");
  const [note, setNote] = useState(period.note || "");
  const [error, setError] = useState("");

  let preview = "Set a start date and time";
  if (start) {
    if (!end) preview = "Wings unavailable · still unavailable";
    else if (new Date(end) > new Date(start))
      preview = `Wings unavailable · ${fmtDur(new Date(end).getTime() - new Date(start).getTime())}`;
    else preview = "Until must be after the start time";
  }

  const save = async () => {
    setError("");
    if (!start) {
      setError("Start time is required.");
      return;
    }
    if (end && new Date(end) <= new Date(start)) {
      setError("Until must be after the start time.");
      return;
    }
    try {
      await updateUnavail(period.id, { start, end, note: note.trim() });
      onToast("Unavailability updated.", "success");
      onClose();
    } catch {
      onToast("Save failed — check connection.", "error");
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Edit unavailability</div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <div className="form-grid">
          <div className="fg full">
            <label>Unavailable from</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Until <span style={{ color: "var(--text3)", fontWeight: 300 }}>(blank = still unavailable)</span>
            </label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Reason <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
            </label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. owner needs the space" />
          </div>
        </div>
        <div className="backlog-preview">{preview}</div>
        <div className="modal-actions">
          <button className="btn btn-red" onClick={save}>
            Save changes
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
