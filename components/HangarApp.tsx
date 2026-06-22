"use client";

import { useEffect, useState } from "react";
import { AIRCRAFT, type Session } from "@/lib/types";
import { completedHangarMs, fmtShort } from "@/lib/stats";
import {
  clearAllData,
  confirmExit as confirmExitDb,
  deleteSession as deleteSessionDb,
  deleteUnavail as deleteUnavailDb,
  endUnavailNow as endUnavailDb,
  moveAircraft as moveAircraftDb,
  quickLog as quickLogDb,
  useLiveData,
} from "@/lib/data";
import Dashboard from "@/components/tabs/Dashboard";
import LogMovement from "@/components/tabs/LogMovement";
import Unavailability from "@/components/tabs/Unavailability";
import History from "@/components/tabs/History";
import Summary from "@/components/tabs/Summary";
import EmailReport from "@/components/tabs/EmailReport";
import Settings from "@/components/tabs/Settings";
import ExitModal from "@/components/ExitModal";
import type { DateFilter } from "@/lib/types";

type TabKey = "dashboard" | "log" | "unavail" | "history" | "summary" | "email" | "data";

const NAV: { key: TabKey; icon: string; label: string; mobile: string }[] = [
  { key: "dashboard", icon: "🏠", label: "Dashboard", mobile: "Home" },
  { key: "log", icon: "📋", label: "Log Movement", mobile: "Log" },
  { key: "unavail", icon: "🚫", label: "Unavailability", mobile: "Unavail" },
  { key: "history", icon: "📁", label: "History", mobile: "History" },
  { key: "summary", icon: "📊", label: "Summary", mobile: "Summary" },
  { key: "email", icon: "✉️", label: "Email Report", mobile: "Email" },
  { key: "data", icon: "💾", label: "Settings", mobile: "Settings" },
];

const TAB_META: Record<TabKey, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "Hangar Usage Tracker", title: "Dashboard" },
  log: { eyebrow: "Hangar Usage Tracker", title: "Log Aircraft Movement" },
  unavail: { eyebrow: "Wings Hangar", title: "Hangar Unavailability" },
  history: { eyebrow: "Hangar Usage Tracker", title: "Session History" },
  summary: { eyebrow: "Hangar Usage Tracker", title: "Usage Summary" },
  email: { eyebrow: "Hangar Usage Tracker", title: "Email Report" },
  data: { eyebrow: "Hangar Usage Tracker", title: "Settings & Data" },
};

export default function HangarApp({ onLock }: { onLock: () => void }) {
  const { sessions, unavail, sync } = useLiveData();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [now, setNow] = useState<number>(() => Date.now());
  const [filter, setFilter] = useState<DateFilter>({ preset: "all", start: null, end: null });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [exitTarget, setExitTarget] = useState<Session | null>(null);

  // 1s clock for live timers + header clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });

  const open = sessions.filter((s) => !s.exit);
  const openU = unavail.find((u) => !u.end);

  // ── Actions ──────────────────────────────────────────────
  const handleQuickLog = async (aircraft: string, hangar: string) => {
    const already = sessions.find((s) => s.aircraft === aircraft && !s.exit);
    if (already) {
      showToast(`${aircraft} is already in ${already.hangar}. Log exit first.`, "error");
      return;
    }
    try {
      await quickLogDb(aircraft, hangar);
      showToast(`✓ ${aircraft} → ${hangar}`, "success");
    } catch {
      showToast("Save failed — check connection.", "error");
    }
  };

  const handleMove = async (aircraft: string) => {
    const current = open.find((s) => s.aircraft === aircraft);
    if (!current) {
      showToast(`${aircraft} is not currently in a hangar.`, "error");
      return;
    }
    const dest = current.hangar === "Wings Hangar" ? "ALNW" : "Wings Hangar";
    try {
      await moveAircraftDb(current);
      showToast(`✓ ${aircraft} moved to ${dest}`, "success");
    } catch {
      showToast("Move failed — check connection.", "error");
    }
  };

  const handleConfirmExit = async (exitTime: string, reason: string, note: string) => {
    if (!exitTarget) return;
    try {
      await confirmExitDb(exitTarget, exitTime, reason, note);
      setExitTarget(null);
    } catch {
      alert("Save failed.");
    }
  };

  const handleEndUnavail = async (id: string) => {
    try {
      await endUnavailDb(id);
    } catch {
      alert("Save failed.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      await deleteSessionDb(id);
    } catch {
      alert("Delete failed.");
    }
  };

  const handleDeleteUnavail = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await deleteUnavailDb(id);
    } catch {
      alert("Delete failed.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL sessions and unavailability records permanently?")) return;
    if (!confirm("Final confirmation — cannot be undone.")) return;
    try {
      await clearAllData();
      showToast("All data cleared.", "success");
    } catch (e) {
      alert("Clear failed: " + (e as Error).message);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem("wh_auth");
    onLock();
  };

  // ── Header bits ──────────────────────────────────────────
  const acHeader = (ac: string) => {
    const o = open.find((s) => s.aircraft === ac);
    if (o) {
      const w = o.hangar === "Wings Hangar";
      return { text: w ? "WINGS" : "ALNW", cls: w ? "live-wings" : "live-alnw" };
    }
    return { text: "OUT", cls: "" };
  };
  const wHrs = (completedHangarMs(sessions, "Wings Hangar") / 3600000).toFixed(1);
  const aHrs = (completedHangarMs(sessions, "ALNW") / 3600000).toFixed(1);

  const syncMap: Record<string, [string, string]> = {
    connecting: ["#f0c050", "Connecting…"],
    live: ["#30c870", "Live"],
    error: ["#e05050", "Offline"],
  };
  const [syncColor, syncLabel] = syncMap[sync] || syncMap.connecting;

  const meta = TAB_META[tab];

  return (
    <div id="app">
      {toast && <div className={`toast toast-${toast.type} show`}>{toast.msg}</div>}

      <header>
        <div className="header-brand">
          <div className="header-icon">✈</div>
          <div className="brand-text">
            <div className="brand-sub">Operations Log</div>
            <div className="brand-name">Hangar Usage</div>
          </div>
        </div>
        <div className="header-stats">
          {AIRCRAFT.map((ac) => {
            const h = acHeader(ac);
            return (
              <div className="hstat" key={ac}>
                <div className="hstat-label">{ac}</div>
                <div className={`hstat-value ${h.cls}`}>{h.text}</div>
              </div>
            );
          })}
          <div className="hstat">
            <div className="hstat-label">Wings Hrs</div>
            <div className="hstat-value">{wHrs}h</div>
          </div>
          <div className="hstat">
            <div className="hstat-label">ALNW Hrs</div>
            <div className="hstat-value">{aHrs}h</div>
          </div>
          <div className="hstat">
            <div className="hstat-label">Unavail</div>
            <div className={`hstat-value${openU ? " unavail" : ""}`}>{openU ? "UNAVAIL" : "—"}</div>
          </div>
        </div>
        <div className="header-right">
          <div className="sync-indicator">
            <div
              className="sync-dot"
              style={{ background: syncColor, boxShadow: sync === "live" ? `0 0 6px ${syncColor}` : "none" }}
            ></div>
            <div className="sync-label">{syncLabel}</div>
          </div>
          <div className="clock">{new Date(now).toLocaleTimeString("en-US", { hour12: false })}</div>
          <button className="lock-btn" onClick={handleLock}>
            🔒 Lock
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-nav">
            <div className="nav-section-label">Navigation</div>
            {NAV.map((n) => (
              <button key={n.key} className={`nav-item${tab === n.key ? " active" : ""}`} onClick={() => setTab(n.key)}>
                <span className="nav-icon">{n.icon}</span> {n.label}
              </button>
            ))}
          </div>
          <div className="sidebar-status">
            <div className="nav-section-label">Live Status</div>
            {AIRCRAFT.map((ac) => {
              const o = open.find((s) => s.aircraft === ac);
              const dotCls = o ? (o.hangar === "Wings Hangar" ? "dot-wings" : "dot-alnw") : "dot-out";
              const color = ac === "N254AL" ? "var(--blue2)" : "var(--gold2)";
              return (
                <div className="status-card" key={ac}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span className={`status-dot ${dotCls}`}></span>
                    <span className="status-ac" style={{ color }}>
                      {ac}
                    </span>
                  </div>
                  <div className="status-line">{o ? `In ${o.hangar} since ${fmtShort(o.entry)}` : "Not in a hangar"}</div>
                </div>
              );
            })}
            {openU && (
              <div className="status-card">
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span className="status-dot dot-unavail"></span>
                  <span className="status-ac" style={{ color: "var(--red)" }}>
                    Wings Hangar
                  </span>
                </div>
                <div className="status-line">Unavailable since {fmtShort(openU.start)}</div>
              </div>
            )}
          </div>
        </aside>

        <div className="content">
          <div className="panel active">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <div className="panel-eyebrow">{meta.eyebrow}</div>
                <div className="panel-title">{meta.title}</div>
              </div>
            </div>

            {tab === "dashboard" && (
              <Dashboard
                sessions={sessions}
                unavail={unavail}
                now={now}
                onQuickLog={handleQuickLog}
                onMove={handleMove}
                onExit={setExitTarget}
                onEndUnavail={handleEndUnavail}
                onGoTab={(t) => setTab(t as TabKey)}
              />
            )}
            {tab === "log" && (
              <LogMovement sessions={sessions} now={now} onQuickLog={handleQuickLog} onMove={handleMove} onExit={setExitTarget} />
            )}
            {tab === "unavail" && (
              <Unavailability unavail={unavail} onEndUnavail={handleEndUnavail} onDeleteUnavail={handleDeleteUnavail} />
            )}
            {tab === "history" && (
              <History
                sessions={sessions}
                unavail={unavail}
                onExit={setExitTarget}
                onDeleteSession={handleDeleteSession}
                onEndUnavail={handleEndUnavail}
                onDeleteUnavail={handleDeleteUnavail}
              />
            )}
            {tab === "summary" && <Summary sessions={sessions} unavail={unavail} filter={filter} onFilterChange={setFilter} />}
            {tab === "email" && (
              <EmailReport sessions={sessions} unavail={unavail} filter={filter} onFilterChange={setFilter} onToast={showToast} />
            )}
            {tab === "data" && <Settings sessions={sessions} unavail={unavail} filter={filter} onClearAll={handleClearAll} />}
          </div>
        </div>
      </div>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map((n) => (
            <button key={n.key} className={`mnav-item${tab === n.key ? " active" : ""}`} onClick={() => setTab(n.key)}>
              <span className="mnav-icon">{n.icon}</span>
              {n.mobile}
            </button>
          ))}
        </div>
      </nav>

      <ExitModal
        key={exitTarget?.id ?? "none"}
        session={exitTarget}
        onClose={() => setExitTarget(null)}
        onConfirm={handleConfirmExit}
      />
    </div>
  );
}
