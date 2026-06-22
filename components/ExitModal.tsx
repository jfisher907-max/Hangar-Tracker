"use client";

import { useState } from "react";
import { REASONS, type Session } from "@/lib/types";
import { toLocalInput } from "@/lib/stats";

// Rendered with a `key` tied to the session id, so each open remounts fresh and
// the field initializers below set the current time / empty inputs.
export default function ExitModal({
  session,
  onClose,
  onConfirm,
}: {
  session: Session | null;
  onClose: () => void;
  onConfirm: (exitTime: string, reason: string, note: string) => void;
}) {
  const [time, setTime] = useState(() => toLocalInput(new Date()));
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  if (!session) return null;

  const confirm = () => {
    if (!time) {
      alert("Please enter an exit time.");
      return;
    }
    onConfirm(time, reason, note.trim());
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Log Aircraft Exit</div>
        <div className="form-grid">
          <div className="fg full">
            <label>Exit Time</label>
            <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="fg">
            <label>Exit Reason</label>
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
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={confirm}>
            Confirm Exit
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
