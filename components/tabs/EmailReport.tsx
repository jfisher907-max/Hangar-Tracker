"use client";

import { useMemo, useRef } from "react";
import type { DateFilter, Session, UnavailPeriod } from "@/lib/types";
import { buildCSV, buildEmailText, buildReportHTML, downloadText, printHTML, todayStamp } from "@/lib/report";
import DateFilterBar from "@/components/DateFilterBar";

export default function EmailReport({
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => buildReportHTML(sessions, unavail, filter), [sessions, unavail, filter]);

  const copy = () => {
    navigator.clipboard
      .writeText(buildEmailText(sessions, unavail, filter))
      .then(() => onToast("Report copied!", "success"))
      .catch(() => onToast("Copy failed.", "error"));
  };
  const downloadTxt = () =>
    downloadText(buildEmailText(sessions, unavail, filter), `hangar-usage-report-${todayStamp()}.txt`, "text/plain");
  const downloadCsv = () => downloadText(buildCSV(sessions, filter), `hangar-sessions-${todayStamp()}.csv`, "text/csv");
  const exportPdf = () => printHTML(html);

  const sizeFrame = () => {
    const frame = frameRef.current;
    if (!frame || !frame.contentDocument) return;
    const h = frame.contentDocument.body.scrollHeight;
    frame.style.minHeight = Math.max(h + 20, 500) + "px";
  };

  return (
    <>
      <DateFilterBar filter={filter} onChange={onFilterChange} />
      <div className="email-toolbar">
        <button className="btn btn-copy" onClick={copy}>
          📋 Copy Plain Text
        </button>
        <button className="btn btn-outline" onClick={downloadTxt}>
          ⬇ Download .txt
        </button>
        <button className="btn btn-outline" onClick={downloadCsv}>
          📊 Download CSV
        </button>
        <button className="btn btn-primary" onClick={exportPdf}>
          🖨 Export PDF
        </button>
      </div>
      <div className="email-box">
        <iframe ref={frameRef} title="Report preview" srcDoc={html} onLoad={sizeFrame} />
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 9, fontWeight: 500 }}>
        Preview shown below. Export PDF opens a print-ready version — save as PDF from your browser&apos;s print dialog.
      </div>
    </>
  );
}
