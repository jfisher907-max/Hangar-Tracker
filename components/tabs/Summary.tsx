"use client";

import { HANGARS, type DateFilter, type Session, type UnavailPeriod } from "@/lib/types";
import {
  completedHangarMs,
  filterByDate,
  getAcStats,
  getPresetLabel,
  getUnavailStats,
  type AcStats,
} from "@/lib/stats";
import DateFilterBar from "@/components/DateFilterBar";
import { buildCSV, buildEmailText, buildReportHTML, downloadText, printHTML, todayStamp } from "@/lib/report";

function AcCard({ name, st, cls, vc }: { name: string; st: AcStats; cls: string; vc: string }) {
  return (
    <div className="ac-summary-card">
      <div className={`ac-summary-header ${cls}`}>
        <div>
          <div className="ac-label">Registration</div>
          <div className={`ac-reg ${cls}`}>{name}</div>
        </div>
      </div>
      <div className="ac-stats">
        <div className="ac-stat">
          <div className="ac-stat-label">Sessions</div>
          <div className={`ac-stat-val ${vc}`}>{st.count}</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat-label">Days Active</div>
          <div className={`ac-stat-val ${vc}`}>{st.uniqueDays}</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat-label">Total Hours</div>
          <div className={`ac-stat-val ${vc}`}>{st.totalHours}h</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat-label">Total Days (24h)</div>
          <div className={`ac-stat-val ${vc}`}>{st.totalDays}d</div>
        </div>
      </div>
      <div className="hangar-breakdown">
        <div className="sl" style={{ marginBottom: 8 }}>
          By Hangar
        </div>
        {HANGARS.map((h) => {
          const color = h === "Wings Hangar" ? "var(--green)" : "var(--orange2)";
          return (
            <div key={h} className="hb-row">
              <div className="hb-label" style={{ color }}>
                {h}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span className="hb-val" style={{ color }}>
                  {st.byHangar[h].hours}h
                </span>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>
                  {st.byHangar[h].count} session{st.byHangar[h].count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(st.reasons).length > 0 && (
        <div className="reason-breakdown">
          <div className="sl" style={{ marginBottom: 8 }}>
            By Reason
          </div>
          {Object.entries(st.reasons).map(([r, d]) => (
            <div key={r} className="rb-row" style={{ background: "var(--bg1)" }}>
              <div className="rb-label">{r}</div>
              <div className="rb-val">
                {(d.ms / 3600000).toFixed(1)}h ({d.count} session{d.count !== 1 ? "s" : ""})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Summary({
  sessions,
  unavail,
  filter,
  onFilterChange,
  onToast,
}: {
  sessions: Session[];
  unavail: UnavailPeriod[];
  filter: DateFilter;
  onFilterChange: (f: DateFilter) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const fSess = filterByDate(sessions, "entry", filter);
  const fUnavail = filterByDate(unavail, "start", filter);
  const s1 = getAcStats("N254AL", fSess);
  const s2 = getAcStats("N253AL", fSess);
  const us = getUnavailStats(fUnavail);
  const label = getPresetLabel(filter.preset);
  const cwMs = completedHangarMs(fSess, "Wings Hangar");
  const caMs = completedHangarMs(fSess, "ALNW");

  return (
    <>
      <DateFilterBar filter={filter} onChange={onFilterChange} presets={["all", "last_30", "custom"]} />
      <div className="email-toolbar">
        <button
          className="btn btn-copy"
          onClick={() =>
            navigator.clipboard
              .writeText(buildEmailText(sessions, unavail, filter))
              .then(() => onToast("Report copied!", "success"))
              .catch(() => onToast("Copy failed.", "error"))
          }
        >
          📋 Copy text
        </button>
        <button
          className="btn btn-outline"
          onClick={() => downloadText(buildEmailText(sessions, unavail, filter), `hangar-usage-report-${todayStamp()}.txt`, "text/plain")}
        >
          ⬇ .txt
        </button>
        <button
          className="btn btn-outline"
          onClick={() => downloadText(buildCSV(sessions, filter), `hangar-sessions-${todayStamp()}.csv`, "text/csv")}
        >
          📊 CSV
        </button>
        <button className="btn btn-primary" onClick={() => printHTML(buildReportHTML(sessions, unavail, filter))}>
          🖨 Export PDF
        </button>
      </div>
      <div className="summary-grid">
        <AcCard name="N254AL" st={s1} cls="n254" vc="val-blue" />
        <AcCard name="N253AL" st={s2} cls="n253" vc="val-gold" />
      </div>
      <div className="combined-card">
        <div className="combined-title">COMBINED TOTALS — {label.toUpperCase()}</div>
        <div className="combined-stats">
          <div className="cstat">
            <div className="cstat-label">Wings Hangar Hours</div>
            <div className="cstat-val" style={{ color: "var(--green)" }}>
              {(cwMs / 3600000).toFixed(1)}h
            </div>
          </div>
          <div className="cstat">
            <div className="cstat-label">ALNW Hours</div>
            <div className="cstat-val" style={{ color: "var(--orange2)" }}>
              {(caMs / 3600000).toFixed(1)}h
            </div>
          </div>
          <div className="cstat">
            <div className="cstat-label">Total Sessions</div>
            <div className="cstat-val">{s1.count + s2.count}</div>
          </div>
        </div>
      </div>
      <div className="unavail-summary-card">
        <div className="unavail-summary-title">🚫 Wings Hangar Unavailability — {label}</div>
        <div className="unavail-stats">
          <div className="ustat">
            <div className="ustat-label">Periods</div>
            <div className="ustat-val">{us.count}</div>
          </div>
          <div className="ustat">
            <div className="ustat-label">Total Hours</div>
            <div className="ustat-val">{us.totalHours}h</div>
          </div>
          <div className="ustat">
            <div className="ustat-label">Total Days (24h)</div>
            <div className="ustat-val">{us.totalDays}d</div>
          </div>
        </div>
      </div>
    </>
  );
}
