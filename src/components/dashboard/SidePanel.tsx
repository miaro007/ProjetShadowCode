"use client";

import { useState, useMemo } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { COLORS } from "@/lib/dashboard-data";
import { CongestionPoint, AlertItem, TrajetItem } from "@/types/dashboard";
import { timeAgo, alertIcon } from "@/utils/dashboard";

type Tab = "chart" | "alerts" | "trajets";

export default function SidePanel({ congestionData, alerts, trajets, onTrajetSelect }: {
  congestionData: CongestionPoint[];
  alerts: AlertItem[];
  trajets: TrajetItem[];
  onTrajetSelect: (t: TrajetItem) => void;
}) {
  const [tab, setTab] = useState<Tab>("chart");
  const latest = congestionData[congestionData.length - 1];

  const sortedAlerts = useMemo(() =>
    [...alerts].sort((a, b) => {
      const order = { critique: 0, élevé: 1, modéré: 2, info: 3 };
      return order[a.severity] - order[b.severity];
    }), [alerts]);

  return (
    <div className="panel">
      {/* Onglets */}
      <div className="tabs">
        <button
          className={`tab ${tab === "chart" ? "active" : ""}`}
          onClick={() => setTab("chart")}
        >
          <span>📊</span> Trafic
        </button>
        <button
          className={`tab ${tab === "alerts" ? "active" : ""}`}
          onClick={() => setTab("alerts")}
        >
          <span>📡</span> Alertes
          <span className="badge">{alerts.length}</span>
        </button>
        <button
          className={`tab ${tab === "trajets" ? "active" : ""}`}
          onClick={() => setTab("trajets")}
        >
          <span>🗺️</span> Trajets
        </button>
      </div>

      {/* Contenu */}
      <div className="content">
        {tab === "chart" && (
          <div className="chart-tab">
            <div className="big-number">
              <div className="big-value">{latest?.vehicules.toLocaleString()}</div>
              <div className="big-label">véhicules en circulation</div>
            </div>

            <div className="metrics">
              <div className="metric">
                <div className="m-val warn">{latest?.vitesse} <span>km/h</span></div>
                <div className="m-lab">Vitesse moy.</div>
              </div>
              <div className="metric">
                <div className="m-val">{Math.min(100, Math.round((latest?.vehicules || 0) / 10))}<span>/100</span></div>
                <div className="m-lab">Stress</div>
              </div>
              <div className="metric">
                <div className="m-val">{latest?.vehicules > 500 ? "19h" : "Now"}</div>
                <div className="m-lab">Départ</div>
              </div>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={congestionData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,14,26,0.95)",
                      border: `1px solid ${COLORS.primary}40`,
                      borderRadius: 10, fontSize: 12,
                    }}
                    itemStyle={{ color: COLORS.primary, fontWeight: 700 }}
                  />
                  <ReferenceLine y={600} stroke={COLORS.warn} strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Area type="monotone" dataKey="vehicules" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="alerts-tab">
            {sortedAlerts.map(a => (
              <div key={a.id} className={`alert sev-${a.severity}`}>
                <div className="a-icon">{alertIcon(a.type)}</div>
                <div className="a-body">
                  <div className="a-head">
                    <span className="a-zone">{a.zone}</span>
                    <span className={`a-sev sev-${a.severity}`}>{a.severity}</span>
                  </div>
                  <div className="a-msg">{a.message}</div>
                  <div className="a-meta">
                    <span>⏱ {timeAgo(a.timestamp)}</span>
                    {a.confirmations > 0 && <span>· ✓ {a.confirmations}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "trajets" && (
          <div className="trajets-tab">
            {trajets.map(t => (
              <button key={t.id} className={`trajet st-${t.status}`} onClick={() => onTrajetSelect(t)}>
                <div className="t-icon">{t.icon}</div>
                <div className="t-body">
                  <div className="t-label">{t.label}</div>
                  <div className="t-route">{t.from} → {t.to} · {t.distance}</div>
                  {t.savings && <div className="t-savings">⚡ {t.savings}</div>}
                </div>
                <div className="t-time">
                  <div className="t-current">{t.durationCurrent}</div>
                  <div className="t-normal">vs {t.durationNormal}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .panel {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          display: flex; flex-direction: column;
          height: 100%; overflow: hidden;
        }

        .tabs {
          display: flex;
          padding: 8px;
          gap: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .tab {
          flex: 1;
          background: transparent;
          color: rgba(255,255,255,0.5);
          padding: 12px 8px;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          gap: 6px;
          transition: all .2s;
          position: relative;
        }
        .tab:hover { color: #fff; background: rgba(255,255,255,0.03); }
        .tab.active {
          background: ${COLORS.primary};
          color: ${COLORS.bg};
        }
        .badge {
          background: ${COLORS.warn};
          color: ${COLORS.bg};
          font-size: 10px; font-weight: 900;
          padding: 2px 7px; border-radius: 999px;
        }
        .tab.active .badge { background: ${COLORS.bg}; color: ${COLORS.warn}; }

        .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

        /* ─── CHART TAB ─── */
        .chart-tab { padding: 20px; display: flex; flex-direction: column; gap: 16px; height: 100%; }
        .big-number { text-align: center; }
        .big-value {
          font-size: 44px; font-weight: 900;
          color: ${COLORS.primary};
          font-family: 'SF Mono', monospace;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .big-label {
          font-size: 11px; color: rgba(255,255,255,0.4);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-top: 6px; font-weight: 600;
        }
        .metrics {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .metric {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 8px;
          text-align: center;
        }
        .m-val {
          font-size: 18px; font-weight: 800;
          color: ${COLORS.primary};
          font-family: 'SF Mono', monospace;
        }
        .m-val.warn { color: ${COLORS.warn}; }
        .m-val span { font-size: 11px; opacity: 0.6; font-weight: 600; }
        .m-lab {
          font-size: 10px; color: rgba(255,255,255,0.45);
          text-transform: uppercase; letter-spacing: 0.06em;
          margin-top: 4px;
        }
        .chart-wrap { flex: 1; min-height: 180px; }

        /* ─── ALERTS TAB ─── */
        .alerts-tab {
          padding: 14px;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 8px;
        }
        .alert {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px;
          display: flex; gap: 11px;
          cursor: pointer;
          transition: all .2s;
        }
        .alert:hover { background: rgba(255,255,255,0.05); transform: translateX(3px); }
        .alert.sev-critique { border-left: 3px solid ${COLORS.warn}; background: rgba(255,184,0,0.06); }
        .alert.sev-élevé { border-left: 3px solid ${COLORS.warn}; }
        .alert.sev-info { border-left: 3px solid ${COLORS.primary}; background: rgba(0,229,160,0.05); }
        .a-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .a-body { flex: 1; min-width: 0; }
        .a-head { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
        .a-zone { font-size: 12px; font-weight: 700; color: #fff; }
        .a-sev {
          font-size: 9px; font-weight: 800;
          padding: 2px 7px; border-radius: 999px;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .a-sev.sev-critique, .a-sev.sev-élevé {
          background: rgba(255,184,0,0.18); color: ${COLORS.warn};
          border: 1px solid rgba(255,184,0,0.35);
        }
        .a-sev.sev-modéré {
          background: rgba(255,184,0,0.1); color: ${COLORS.warn};
        }
        .a-sev.sev-info {
          background: rgba(0,229,160,0.15); color: ${COLORS.primary};
          border: 1px solid rgba(0,229,160,0.3);
        }
        .a-msg {
          font-size: 12px; color: rgba(255,255,255,0.65);
          line-height: 1.5; margin-bottom: 6px;
        }
        .a-meta {
          font-size: 10px; color: rgba(255,255,255,0.4);
          display: flex; gap: 6px;
        }

        /* ─── TRAJETS TAB ─── */
        .trajets-tab {
          padding: 14px;
          overflow-y: auto;
          display: flex; flex-direction: column; gap: 8px;
        }
        .trajet {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
          transition: all .25s;
          text-align: left;
          width: 100%;
        }
        .trajet:hover {
          background: rgba(0,229,160,0.06);
          border-color: ${COLORS.primary}40;
          transform: translateY(-2px);
        }
        .trajet.st-bloqué { border-left: 3px solid ${COLORS.warn}; }
        .trajet.st-dense { border-left: 3px solid ${COLORS.warn}; opacity: 0.95; }
        .trajet.st-fluide { border-left: 3px solid ${COLORS.primary}; }
        .t-icon { font-size: 22px; flex-shrink: 0; }
        .t-body { flex: 1; min-width: 0; }
        .t-label { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .t-route { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .t-savings {
          font-size: 10px; color: ${COLORS.primary};
          background: rgba(0,229,160,0.1);
          padding: 3px 8px; border-radius: 999px;
          display: inline-block;
          border: 1px solid rgba(0,229,160,0.25);
          font-weight: 700;
        }
        .t-time { text-align: right; flex-shrink: 0; }
        .t-current {
          font-size: 16px; font-weight: 800;
          font-family: 'SF Mono', monospace;
          color: ${COLORS.primary};
        }
        .t-normal { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px; }
      `}</style>
    </div>
  );
}
