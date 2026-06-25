"use client";

import { useState } from "react";
import { AIRCRAFT, HANGARS, type Session } from "@/lib/types";
import { fmtDT, fmtDur, toLocalInput } from "@/lib/stats";
import { logSession } from "@/lib/data";

export default function PastMoveModal({
  sessions,
  onClose,
  onToast,
}: {
  sessions: Session[];
  onClose: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [aircraft, setAircraft] = useState<string>("N254AL");
  const [hangar, setHangar] = useState<string>("Wings Hangar");
  const [arrived, setArrived] = useState<string>(() => toLocalInput(new Date()));
  const [left, setLeft] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string>("");

  let preview = "Choose an arrival date and time";
  if (arrived) {
    if (!left) preview = `${aircraft} in ${hangar} · since ${fmtDT(arrived)} · still there`;
    else if (new Date(left) > new Date(arrived))
      preview = `${aircraft} in ${hangar} · ${fmtDT(arrived)} → ${fmtDT(left)} · ${fmtDur(new Date(left).getTime() - new Date(arrived).getTime())}`;
    else preview = "Left time must be after the arrived time";
  }

  const save = async () => {
    setError("");
    if (!arrived) {
      setError("Choose an arrival date and time.");
      return;
    }
    if (left && new Date(left) <= new Date(arrived)) {
      setError("Left time must be after the arrived time.");
      return;
    }
    if (!left) {
      const already = sessions.find((s) => s.aircraft === aircraft && !s.exit);
      if (already) {
        setError(`${aircraft} already has an open session in ${already.hangar}. Add a left time, or close the current one first.`);
        return;
      }
    }
    try {
      await logSession({ aircraft, hangar, entry: arrived, exit: left, reason: "", note: note.trim() });
      onToast("Past move added to history.", "success");
      onClose();
    } catch {
      onToast("Save failed — check connection.", "error");
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Log a past move</div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
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
            <label>Location</label>
            <select value={hangar} onChange={(e) => setHangar(e.target.value)}>
              {HANGARS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="fg full">
            <label>Arrived</label>
            <input type="datetime-local" value={arrived} onChange={(e) => setArrived(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Left <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional — leave blank if still there)</span>
            </label>
            <input type="datetime-local" value={left} onChange={(e) => setLeft(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Note <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
            </label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional details…" />
          </div>
        </div>
        <div className="backlog-preview">{preview}</div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={save}>
            Save past move
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
