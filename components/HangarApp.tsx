"use client";

import { useEffect, useState } from "react";
import { AIRCRAFT, type Session } from "@/lib/types";
import { completedHangarMs } from "@/lib/stats";
import {
  clearAllData,
  confirmExit as confirmExitDb,
  deleteSession as deleteSessionDb,
  deleteUnavail as deleteUnavailDb,
  endUnavailNow as endUnavailDb,
  logUnavail as logUnavailDb,
  setJetLocation as setJetLocationDb,
  useLiveData,
} from "@/lib/data";
import Home from "@/components/tabs/Home";
import History from "@/components/tabs/History";
import Summary from "@/components/tabs/Summary";
import Settings from "@/components/tabs/Settings";
import ExitModal from "@/components/ExitModal";
import PastMoveModal from "@/components/PastMoveModal";
import PastUnavailModal from "@/components/PastUnavailModal";
import EditSessionModal from "@/components/EditSessionModal";
import EditUnavailModal from "@/components/EditUnavailModal";
import type { DateFilter, UnavailPeriod } from "@/lib/types";

type TabKey = "home" | "history" | "reports" | "data";

const NAV: { key: TabKey; icon: string; label: string }[] = [
  { key: "home", icon: "🏠", label: "Home" },
  { key: "history", icon: "📁", label: "History" },
  { key: "reports", icon: "📊", label: "Reports" },
  { key: "data", icon: "💾", label: "Settings" },
];

const TAB_META: Record<TabKey, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Hangar Usage Tracker", title: "Home" },
  history: { eyebrow: "Hangar Usage Tracker", title: "History" },
  reports: { eyebrow: "Hangar Usage Tracker", title: "Reports" },
  data: { eyebrow: "Hangar Usage Tracker", title: "Settings & Data" },
};

export default function HangarApp({ onLock }: { onLock: () => void }) {
  const { sessions, unavail, sync } = useLiveData();
  const [tab, setTab] = useState<TabKey>("home");
  const [now, setNow] = useState<number>(() => Date.now());
  const [filter, setFilter] = useState<DateFilter>({ preset: "all", start: null, end: null });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [exitTarget, setExitTarget] = useState<Session | null>(null);
  const [pastMove, setPastMove] = useState(false);
  const [pastUnavail, setPastUnavail] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editUnavail, setEditUnavail] = useState<UnavailPeriod | null>(null);

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
  const handleSetLocation = async (aircraft: string, target: string) => {
    const current = open.find((s) => s.aircraft === aircraft);
    if (current && current.hangar === target) return; // already there
    try {
      await setJetLocationDb(aircraft, current, target);
      showToast(`✓ ${aircraft} → ${target === "Out" ? "Out" : target}`, "success");
    } catch {
      showToast("Save failed — check connection.", "error");
    }
  };

  const handleToggleWings = async (makeUnavailable: boolean) => {
    try {
      if (makeUnavailable) {
        if (openU) return;
        await logUnavailDb({ start: new Date().toISOString(), end: "", note: "" });
        showToast("Wings Hangar marked unavailable.", "success");
      } else {
        if (!openU) return;
        await endUnavailDb(openU.id);
        showToast("Wings Hangar back available.", "success");
      }
    } catch {
      showToast("Save failed — check connection.", "error");
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

      <nav className="top-nav">
        {NAV.map((n) => (
          <button key={n.key} className={`topnav-item${tab === n.key ? " active" : ""}`} onClick={() => setTab(n.key)}>
            <span className="topnav-icon">{n.icon}</span>
            <span className="topnav-label">{n.label}</span>
          </button>
        ))}
      </nav>

      <main className="content">
          <div className="panel active">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <div className="panel-eyebrow">{meta.eyebrow}</div>
                <div className="panel-title">{meta.title}</div>
              </div>
            </div>

            {tab === "home" && (
              <Home
                sessions={sessions}
                unavail={unavail}
                now={now}
                onSetLocation={handleSetLocation}
                onToggleWings={handleToggleWings}
                onPastMove={() => setPastMove(true)}
                onPastUnavail={() => setPastUnavail(true)}
              />
            )}
            {tab === "history" && (
              <History
                sessions={sessions}
                unavail={unavail}
                onExit={setExitTarget}
                onEditSession={setEditSession}
                onDeleteSession={handleDeleteSession}
                onEndUnavail={handleEndUnavail}
                onEditUnavail={setEditUnavail}
                onDeleteUnavail={handleDeleteUnavail}
              />
            )}
            {tab === "reports" && (
              <Summary sessions={sessions} unavail={unavail} filter={filter} onFilterChange={setFilter} onToast={showToast} />
            )}
            {tab === "data" && <Settings sessions={sessions} unavail={unavail} filter={filter} onClearAll={handleClearAll} />}
          </div>
      </main>

      <ExitModal
        key={exitTarget?.id ?? "none"}
        session={exitTarget}
        onClose={() => setExitTarget(null)}
        onConfirm={handleConfirmExit}
      />
      {pastMove && <PastMoveModal sessions={sessions} onClose={() => setPastMove(false)} onToast={showToast} />}
      {pastUnavail && <PastUnavailModal unavail={unavail} onClose={() => setPastUnavail(false)} onToast={showToast} />}
      {editSession && (
        <EditSessionModal key={editSession.id} session={editSession} onClose={() => setEditSession(null)} onToast={showToast} />
      )}
      {editUnavail && (
        <EditUnavailModal key={editUnavail.id} period={editUnavail} onClose={() => setEditUnavail(null)} onToast={showToast} />
      )}
    </div>
  );
}
