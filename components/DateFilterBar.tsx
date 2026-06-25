"use client";

import type { DateFilter, Preset } from "@/lib/types";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "all", label: "All Time" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_30", label: "Last 30 Days" },
  { key: "last_90", label: "Last 90 Days" },
  { key: "custom", label: "Custom" },
];

export default function DateFilterBar({
  filter,
  onChange,
  presets,
}: {
  filter: DateFilter;
  onChange: (f: DateFilter) => void;
  presets?: Preset[]; // when given, only these preset buttons are shown
}) {
  const shown = presets ? PRESETS.filter((p) => presets.includes(p.key)) : PRESETS;
  return (
    <div className="date-filter-bar">
      <div className="sl" style={{ marginBottom: 9 }}>
        Date Range
      </div>
      <div className="preset-row">
        {shown.map((p) => (
          <button
            key={p.key}
            className={`preset-btn${filter.preset === p.key ? " active" : ""}`}
            onClick={() => onChange({ ...filter, preset: p.key })}
          >
            {p.label}
          </button>
        ))}
      </div>
      {filter.preset === "custom" && (
        <div className="custom-range-row">
          <div className="cri">
            <label>From</label>
            <input
              type="date"
              value={filter.start ?? ""}
              onChange={(e) => onChange({ ...filter, start: e.target.value || null })}
            />
          </div>
          <div className="cri">
            <label>To</label>
            <input
              type="date"
              value={filter.end ?? ""}
              onChange={(e) => onChange({ ...filter, end: e.target.value || null })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
