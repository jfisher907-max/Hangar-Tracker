"use client";

import { useState } from "react";
import { AIRCRAFT, HANGARS, type Session } from "@/lib/types";
import { fmtDur, toLocalInput } from "@/lib/stats";
import { updateSession } from "@/lib/data";

export default function EditSessionModal({
  session,
  onClose,
  onToast,
}: {
  session: Session;
  onClose: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [aircraft, setAircraft] = useState(session.aircraft);
  const [hangar, setHangar] = useState(session.hangar);
  const [entry, setEntry] = useState(toLocalInput(new Date(session.entry)));
  const [exit, setExit] = useState(session.exit ? toLocalInput(new Date(session.exit)) : "");
  const [reason, setReason] = useState(session.exitReason || session.reason || "");
  const [note, setNote] = useState(session.exitNote || session.note || "");
  const [error, setError] = useState("");

  let preview = "Set an entry date and time";
  if (entry) {
    if (!exit) preview = `${aircraft} in ${hangar} · still in hangar`;
    else if (new Date(exit) > new Date(entry))
      preview = `${aircraft} in ${hangar} · ${fmtDur(new Date(exit).getTime() - new Date(entry).getTime())}`;
    else preview = "Exit must be after the entry time";
  }

  const save = async () => {
    setError("");
    if (!entry) {
      setError("Entry time is required.");
      return;
    }
    if (exit && new Date(exit) <= new Date(entry)) {
      setError("Exit must be after the entry time.");
      return;
    }
    try {
      await updateSession(session.id, { aircraft, hangar, entry, exit, reason: reason.trim(), note: note.trim() });
      onToast("Session updated.", "success");
      onClose();
    } catch {
      onToast("Save failed — check connection.", "error");
    }
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Edit session</div>
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
            <label>Hangar</label>
            <select value={hangar} onChange={(e) => setHangar(e.target.value)}>
              {HANGARS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="fg full">
            <label>Entry</label>
            <input type="datetime-local" value={entry} onChange={(e) => setEntry(e.target.value)} />
          </div>
          <div className="fg full">
            <label>
              Exit <span style={{ color: "var(--text3)", fontWeight: 300 }}>(blank = still in hangar)</span>
            </label>
            <input type="datetime-local" value={exit} onChange={(e) => setExit(e.target.value)} />
          </div>
          <div className="fg">
            <label>
              Reason <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
            </label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason…" />
          </div>
          <div className="fg">
            <label>
              Note <span style={{ color: "var(--text3)", fontWeight: 300 }}>(optional)</span>
            </label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note…" />
          </div>
        </div>
        <div className="backlog-preview">{preview}</div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={save}>
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
