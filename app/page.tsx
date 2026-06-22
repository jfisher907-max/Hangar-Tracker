"use client";

import { useEffect, useState } from "react";
import PinGate from "@/components/PinGate";
import HangarApp from "@/components/HangarApp";

type AuthState = "loading" | "authed" | "locked";

export default function Home() {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    // Read persisted auth from sessionStorage once on mount (browser-only API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(sessionStorage.getItem("wh_auth") === "1" ? "authed" : "locked");
  }, []);

  if (state === "loading") return null;
  return state === "authed" ? (
    <HangarApp onLock={() => setState("locked")} />
  ) : (
    <PinGate onUnlock={() => setState("authed")} />
  );
}
