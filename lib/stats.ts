// Pure helpers ported 1:1 from the original index.html: date-range filtering,
// per-aircraft / unavailability stats, and datetime formatters. Ongoing sessions
// are counted using the current time as a provisional exit so live time is included.

import { HANGARS, type DateFilter, type Preset, type Session, type UnavailPeriod } from "./types";

// ── Date filter ───────────────────────────────────────────────
export function getDateRange(filter: DateFilter): { start: Date | null; end: Date | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (filter.preset) {
    case "this_month":
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) };
    case "last_month":
      return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59) };
    case "last_30":
      return { start: new Date(now.getTime() - 30 * 86400000), end: now };
    case "last_90":
      return { start: new Date(now.getTime() - 90 * 86400000), end: now };
    case "custom":
      return {
        start: filter.start ? new Date(filter.start) : null,
        end: filter.end ? new Date(filter.end + "T23:59:59") : null,
      };
    default:
      return { start: null, end: null };
  }
}

export function filterByDate<T>(arr: T[], key: keyof T, filter: DateFilter): T[] {
  const { start, end } = getDateRange(filter);
  return arr.filter((i) => {
    const d = new Date(i[key] as unknown as string);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

export function getPresetLabel(preset: Preset): string {
  const l: Record<Preset, string> = {
    all: "All Time",
    this_month: "This Month",
    last_month: "Last Month",
    last_30: "Last 30 Days",
    last_90: "Last 90 Days",
    custom: "Custom Range",
  };
  return l[preset] || "All Time";
}

// ── Stats ─────────────────────────────────────────────────────
export type HangarStat = { hours: string; days: string; count: number };
export type ReasonStat = { ms: number; count: number };
export type AcStats = {
  byHangar: Record<string, HangarStat>;
  totalHours: string;
  totalDays: string;
  count: number;
  uniqueDays: number;
  reasons: Record<string, ReasonStat>;
};

export function getAcStats(ac: string, sessions: Session[]): AcStats {
  const now = new Date();
  // Include ongoing sessions using current time as provisional exit so live time is counted
  const all = sessions
    .filter((s) => s.aircraft === ac)
    .map((s) => ({ ...s, exit: s.exit || now.toISOString() }));

  const byHangar: Record<string, HangarStat> = {};
  HANGARS.forEach((h) => {
    const hs = all.filter((s) => s.hangar === h);
    const ms = hs.reduce((sum, s) => sum + (new Date(s.exit).getTime() - new Date(s.entry).getTime()), 0);
    byHangar[h] = { hours: (ms / 3600000).toFixed(1), days: (ms / 86400000).toFixed(2), count: hs.length };
  });

  const totalMs = all.reduce((sum, s) => sum + (new Date(s.exit).getTime() - new Date(s.entry).getTime()), 0);

  const reasons: Record<string, ReasonStat> = {};
  all
    .filter((s) => s.exitReason || s.reason)
    .forEach((s) => {
      const r = s.exitReason || s.reason;
      if (!reasons[r]) reasons[r] = { ms: 0, count: 0 };
      reasons[r].ms += new Date(s.exit).getTime() - new Date(s.entry).getTime();
      reasons[r].count++;
    });

  return {
    byHangar,
    totalHours: (totalMs / 3600000).toFixed(1),
    totalDays: (totalMs / 86400000).toFixed(2),
    count: all.length,
    uniqueDays: new Set(all.map((s) => new Date(s.entry).toDateString())).size,
    reasons,
  };
}

export type UnavailStats = { count: number; totalHours: string; totalDays: string };

export function getUnavailStats(periods: UnavailPeriod[]): UnavailStats {
  const now = new Date();
  const all = periods.map((u) => ({ ...u, end: u.end || now.toISOString() }));
  const totalMs = all.reduce((sum, u) => sum + (new Date(u.end).getTime() - new Date(u.start).getTime()), 0);
  return {
    count: periods.length,
    totalHours: (totalMs / 3600000).toFixed(1),
    totalDays: (totalMs / 86400000).toFixed(2),
  };
}

// Sum of completed-session durations (ms) for a hangar.
export function completedHangarMs(sessions: Session[], hangar: string): number {
  return sessions
    .filter((s) => s.hangar === hangar && s.exit)
    .reduce((sum, s) => sum + (new Date(s.exit as string).getTime() - new Date(s.entry).getTime()), 0);
}

// ── Formatters ────────────────────────────────────────────────
export function fmtDT(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtShort(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDur(ms: number): string {
  if (ms <= 0) return "0h 0m";
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function fmtDurFull(ms: number): string {
  if (ms <= 0) return "0h 0m 0s";
  const s = Math.floor(ms / 1000);
  const sec = s % 60;
  const min = Math.floor(s / 60) % 60;
  const hrs = Math.floor(s / 3600);
  return `${hrs}h ${min}m ${sec}s`;
}

export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
