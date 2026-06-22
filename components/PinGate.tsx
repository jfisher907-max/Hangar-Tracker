"use client";

import { useEffect, useRef, useState } from "react";
import { checkPin } from "@/lib/data";

export default function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    const val = pin.trim();
    if (!val) return;
    setError("Checking…");
    const ok = await checkPin(val);
    if (ok) {
      sessionStorage.setItem("wh_auth", "1");
      onUnlock();
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
      inputRef.current?.focus();
    }
  };

  return (
    <div id="pinOverlay">
      <div className="pin-box">
        <div className="pin-icon">✈</div>
        <div className="pin-title">Wings Hangar</div>
        <div className="pin-sub">Enter your PIN to access operations</div>
        <input
          ref={inputRef}
          className="pin-input"
          type="password"
          maxLength={10}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoComplete="off"
        />
        <div className="pin-error">{error}</div>
        <button className="pin-btn" onClick={submit}>
          Unlock
        </button>
      </div>
    </div>
  );
}
