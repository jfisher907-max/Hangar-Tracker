"use client";

// Supabase data layer — replaces the Firestore CRUD + onSnapshot listeners from
// the original index.html. DB columns (snake_case, start_time/end_time) are mapped
// to the camelCase domain shapes in lib/types.ts.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session, UnavailPeriod } from "./types";

type SessionRow = {
  id: string;
  aircraft: string;
  hangar: string;
  entry: string;
  exit: string | null;
  reason: string;
  note: string;
  exit_reason: string;
  exit_note: string;
};

type UnavailRow = {
  id: string;
  start_time: string;
  end_time: string | null;
  note: string;
};

function mapSession(r: SessionRow): Session {
  return {
    id: r.id,
    aircraft: r.aircraft,
    hangar: r.hangar,
    entry: r.entry,
    exit: r.exit,
    reason: r.reason,
    note: r.note,
    exitReason: r.exit_reason,
    exitNote: r.exit_note,
  };
}

function mapUnavail(r: UnavailRow): UnavailPeriod {
  return { id: r.id, start: r.start_time, end: r.end_time, note: r.note };
}

// ── Fetch ─────────────────────────────────────────────────────
export async function fetchSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("entry", { ascending: false });
  if (error) throw error;
  return (data as SessionRow[]).map(mapSession);
}

export async function fetchUnavail(): Promise<UnavailPeriod[]> {
  const { data, error } = await supabase
    .from("unavailability")
    .select("*")
    .order("start_time", { ascending: false });
  if (error) throw error;
  return (data as UnavailRow[]).map(mapUnavail);
}

// ── Session mutations ─────────────────────────────────────────
export async function quickLog(aircraft: string, hangar: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("sessions").insert({
    aircraft,
    hangar,
    entry: now,
    exit: null,
    reason: "",
    note: "",
    exit_reason: "",
    exit_note: "",
  });
  if (error) throw error;
}

export async function moveAircraft(current: Session): Promise<void> {
  const now = new Date().toISOString();
  const dest = current.hangar === "Wings Hangar" ? "ALNW" : "Wings Hangar";
  const upd = await supabase
    .from("sessions")
    .update({ exit: now, exit_reason: "Aircraft moved", exit_note: "" })
    .eq("id", current.id);
  if (upd.error) throw upd.error;
  const ins = await supabase.from("sessions").insert({
    aircraft: current.aircraft,
    hangar: dest,
    entry: now,
    exit: null,
    reason: "Aircraft moved",
    note: "",
    exit_reason: "",
    exit_note: "",
  });
  if (ins.error) throw ins.error;
}

// One-tap board action: set a jet's current location.
// target: "Wings Hangar" | "ALNW" | "Out". Closes any open session, then opens a
// new one unless the jet is going Out. No-op if already in the target hangar.
export async function setJetLocation(
  aircraft: string,
  openSession: Session | undefined,
  target: string,
): Promise<void> {
  if (openSession && openSession.hangar === target) return;
  const now = new Date().toISOString();
  if (openSession) {
    const upd = await supabase
      .from("sessions")
      .update({ exit: now, exit_reason: target === "Out" ? "Departed" : "Aircraft moved", exit_note: "" })
      .eq("id", openSession.id);
    if (upd.error) throw upd.error;
  }
  if (target !== "Out") {
    const ins = await supabase.from("sessions").insert({
      aircraft,
      hangar: target,
      entry: now,
      exit: null,
      reason: openSession ? "Aircraft moved" : "",
      note: "",
      exit_reason: "",
      exit_note: "",
    });
    if (ins.error) throw ins.error;
  }
}

export async function logSession(input: {
  aircraft: string;
  hangar: string;
  entry: string; // datetime-local value
  exit: string; // datetime-local value or ""
  reason: string;
  note: string;
}): Promise<void> {
  const { error } = await supabase.from("sessions").insert({
    aircraft: input.aircraft,
    hangar: input.hangar,
    entry: new Date(input.entry).toISOString(),
    exit: input.exit ? new Date(input.exit).toISOString() : null,
    reason: input.reason || "",
    note: input.note || "",
    exit_reason: "",
    exit_note: "",
  });
  if (error) throw error;
}

export async function confirmExit(
  session: Session,
  exitTime: string,
  reason: string,
  note: string,
): Promise<void> {
  const exit_note = note ? (session.note ? session.note + " | " + note : note) : session.note || "";
  const { error } = await supabase
    .from("sessions")
    .update({
      exit: new Date(exitTime).toISOString(),
      exit_reason: reason || session.reason || "",
      exit_note,
    })
    .eq("id", session.id);
  if (error) throw error;
}

// Edit an existing session. Writes the reason/note to both the entry and exit
// fields so the value shows regardless of which the row display prefers.
export async function updateSession(
  id: string,
  input: { aircraft: string; hangar: string; entry: string; exit: string; reason: string; note: string },
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({
      aircraft: input.aircraft,
      hangar: input.hangar,
      entry: new Date(input.entry).toISOString(),
      exit: input.exit ? new Date(input.exit).toISOString() : null,
      reason: input.reason || "",
      exit_reason: input.reason || "",
      note: input.note || "",
      exit_note: input.note || "",
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

// ── Unavailability mutations ──────────────────────────────────
export async function logUnavail(input: { start: string; end: string; note: string }): Promise<void> {
  const { error } = await supabase.from("unavailability").insert({
    start_time: new Date(input.start).toISOString(),
    end_time: input.end ? new Date(input.end).toISOString() : null,
    note: input.note || "",
  });
  if (error) throw error;
}

export async function endUnavailNow(id: string): Promise<void> {
  const { error } = await supabase
    .from("unavailability")
    .update({ end_time: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateUnavail(
  id: string,
  input: { start: string; end: string; note: string },
): Promise<void> {
  const { error } = await supabase
    .from("unavailability")
    .update({
      start_time: new Date(input.start).toISOString(),
      end_time: input.end ? new Date(input.end).toISOString() : null,
      note: input.note || "",
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteUnavail(id: string): Promise<void> {
  const { error } = await supabase.from("unavailability").delete().eq("id", id);
  if (error) throw error;
}

// ── PIN ───────────────────────────────────────────────────────
export async function checkPin(entered: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("app_config").select("pin").eq("id", "auth").maybeSingle();
    if (error) throw error;
    if (!data) return true; // no PIN configured → open (mirrors original)
    return data.pin === entered;
  } catch {
    return false;
  }
}

export async function saveNewPin(pin: string): Promise<void> {
  const { error } = await supabase
    .from("app_config")
    .upsert({ id: "auth", pin, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ── Clear all ─────────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  const a = await supabase.from("sessions").delete().gte("created_at", "1970-01-01");
  if (a.error) throw a.error;
  const b = await supabase.from("unavailability").delete().gte("created_at", "1970-01-01");
  if (b.error) throw b.error;
}

// ── Live data hook (initial fetch + realtime refetch) ─────────
export type SyncStatus = "connecting" | "live" | "error";

export function useLiveData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [unavail, setUnavail] = useState<UnavailPeriod[]>([]);
  const [sync, setSync] = useState<SyncStatus>("connecting");
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([fetchSessions(), fetchUnavail()]);
      setSessions(s);
      setUnavail(u);
      setSync((prev) => (prev === "error" ? "live" : prev));
    } catch (e) {
      console.error(e);
      setSync("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load + realtime subscription (synchronizing with an external system).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
    const channel = supabase
      .channel("hangar-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "unavailability" }, () => refetch())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSync("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSync("error");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { sessions, unavail, sync, loading, refetch };
}
