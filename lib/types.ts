// Domain constants and types for the Hangar Tracker.
// DB columns are mapped to these camelCase shapes in lib/data.ts.

export const AIRCRAFT = ["N254AL", "N253AL"] as const;
export const HANGARS = ["Wings Hangar", "ALNW"] as const;

export const REASONS = [
  "Wings Airways needs the space.",
  "ALNW Flight",
  "End of Month Report",
  "Other",
] as const;

export type Aircraft = (typeof AIRCRAFT)[number];
export type Hangar = (typeof HANGARS)[number];

export type Session = {
  id: string;
  aircraft: string;
  hangar: string;
  entry: string; // ISO string
  exit: string | null; // null = currently in hangar
  reason: string;
  note: string;
  exitReason: string;
  exitNote: string;
};

export type UnavailPeriod = {
  id: string;
  start: string; // ISO string
  end: string | null; // null = still unavailable
  note: string;
};

export type Preset =
  | "all"
  | "this_month"
  | "last_month"
  | "last_30"
  | "last_90"
  | "custom";

export type DateFilter = {
  preset: Preset;
  start: string | null;
  end: string | null;
};
