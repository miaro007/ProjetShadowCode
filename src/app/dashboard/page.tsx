"use client";

/**
 * 🏆 AfricaLife – TRANSPORT URBAIN INTELLIGENT
 * Design Hackathon : 3 couleurs · Map XXL · CTA prioritaires
 * 
 * 🎨 PALETTE STRICTE :
 * - #0A0E1A (Noir profond)  → fond & structure
 * - #00E5A0 (Vert électrique) → primaire, navigation, succès
 * - #FFB800 (Ambre/Or)       → alertes, CTA secondaires
 * (+ blanc/transparences pour le texte)
 */

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area, CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabase";
import AIAssistant from "@/components/AIAssistant";
import type { User } from "@/types";

// ═══════════════════════════════════════════════════════════════════
// 🎨 PALETTE 3 COULEURS
// ═══════════════════════════════════════════════════════════════════
const COLORS = {
  bg: "#0A0E1A",         // Noir profond
  primary: "#00E5A0",    // Vert électrique
  warn: "#FFB800",       // Ambre/Or
};

// ═══════════════════════════════════════════════════════════════════
// 🗺️ CARTE INTERACTIVE
// ═══════════════════════════════════════════════════════════════════
const MapWithNoSSR = dynamic(() => import("@/components/TrafficMap"), {
  ssr: false,
  loading: () => (
    <div className="loading-map">
      <div className="spinner" />
      <p>CHARGEMENT CARTE TEMPS RÉEL</p>
      <style jsx>{`
        .loading-map {
          width: 100%; height: 100%; background: #0A0E1A;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
        }
        .spinner {
          width: 56px; height: 56px; border-radius: 50%;
          border: 3px solid rgba(0,229,160,.15);
          border-top-color: #00E5A0;
          animation: spin .8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        p {
          color: rgba(255,255,255,.5);
          font-size: 11px;
          letter-spacing: .14em;
          font-weight: 700;
        }
      `}</style>
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════
interface CongestionPoint {
  time: string;
  vehicules: number;
  vitesse: number;
  minute: number;
}

interface AlertItem {
  id: number;
  type: "accident" | "travaux" | "taxibe" | "manifestation" | "pluie" | "info";
  zone: string;
  message: string;
  timestamp: Date;
  confirmations: number;
  severity: "critique" | "élevé" | "modéré" | "info";
  reportedBy?: string;
}

interface TrajetItem {
  id: number;
  label: string;
  from: string;
  to: string;
  distance: string;
  durationNormal: string;
  durationCurrent: string;
  icon: string;
  status: "fluide" | "dense" | "bloqué";
  savings?: string;
  transportType: "voiture" | "taxibe" | "marche" | "mixte";
}

interface HotZone {
  id: number;
  name: string;
  lat: number;
  lng: number;
  level: number;
  vehicleCount: number;
  avgSpeed: number;
  trend: "increasing" | "stable" | "decreasing";
  alternativeRoute?: string;
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 DONNÉES RÉALISTES - ANTANANARIVO
// ═══════════════════════════════════════════════════════════════════
const ZONES_CRITIQUES: HotZone[] = [
  { id: 1, name: "Route des Hydrocarbures", lat: -18.9005, lng: 47.5162, level: 98, vehicleCount: 847, avgSpeed: 4, trend: "increasing", alternativeRoute: "Contournement par Ambodivona" },
  { id: 2, name: "Analamahitsy (carrefour)", lat: -18.8712, lng: 47.5412, level: 94, vehicleCount: 623, avgSpeed: 7, trend: "stable", alternativeRoute: "Via Ambohitrarahaba" },
  { id: 3, name: "Ankorondrano - 67Ha", lat: -18.8948, lng: 47.5289, level: 87, vehicleCount: 512, avgSpeed: 12, trend: "decreasing" },
  { id: 4, name: "Andohatapenaka", lat: -18.9241, lng: 47.5081, level: 76, vehicleCount: 389, avgSpeed: 18, trend: "stable" },
  { id: 5, name: "Mahazo - Behoririka", lat: -18.9184, lng: 47.4921, level: 71, vehicleCount: 294, avgSpeed: 15, trend: "increasing" },
  { id: 6, name: "Ambanidia (Tunnel)", lat: -18.9087, lng: 47.5234, level: 68, vehicleCount: 278, avgSpeed: 22, trend: "stable" },
  { id: 7, name: "Anosizato Est", lat: -18.9312, lng: 47.4989, level: 59, vehicleCount: 187, avgSpeed: 28, trend: "decreasing" },
  { id: 8, name: "By-Pass (Tanjombato)", lat: -18.9621, lng: 47.4812, level: 32, vehicleCount: 94, avgSpeed: 52, trend: "stable", alternativeRoute: "✅ Route alternative recommandée" },
];

const TRAJETS_QUOTIDIENS: TrajetItem[] = [
  { id: 1, label: "Maison → Travail", from: "Ivandry", to: "Analakely", distance: "8.4 km", durationNormal: "18 min", durationCurrent: "52 min", icon: "🏢", status: "bloqué", savings: "Départ 6h45 = -34 min", transportType: "voiture" },
  { id: 2, label: "Courses au marché", from: "Analakely", to: "Andravoahangy", distance: "3.2 km", durationNormal: "8 min", durationCurrent: "11 min", icon: "🛒", status: "dense", transportType: "marche" },
  { id: 3, label: "Retour domicile", from: "Analakely", to: "Ivandry", distance: "8.4 km", durationNormal: "18 min", durationCurrent: "1h14", icon: "🏠", status: "bloqué", savings: "Départ 18h45 = -47 min", transportType: "taxibe" },
  { id: 4, label: "Visite famille", from: "Ivandry", to: "Ambohimanarina", distance: "12.1 km", durationNormal: "25 min", durationCurrent: "28 min", icon: "👨‍👩‍👧", status: "fluide", transportType: "voiture" },
];

const ALERTS_INITIALES: AlertItem[] = [
  { id: 1, type: "accident", zone: "Anosy (Tunnel)", message: "Collision 3 véhicules – voie gauche fermée. Détour par Mahamasina.", timestamp: new Date(Date.now() - 8 * 60000), confirmations: 34, severity: "critique", reportedBy: "Police Tana" },
  { id: 2, type: "travaux", zone: "Ambohimiandra", message: "Nid-de-poule ÉNORME. Circulation au compte-gouttes.", timestamp: new Date(Date.now() - 47 * 60000), confirmations: 28, severity: "élevé" },
  { id: 3, type: "taxibe", zone: "Ligne 154 (Ivato-Analakely)", message: "Retard important – panne mécanique. Attente 20 min.", timestamp: new Date(Date.now() - 12 * 60000), confirmations: 7, severity: "modéré" },
  { id: 4, type: "pluie", zone: "Haute-Ville (Faravohitra)", message: "Forte pluie – routes glissantes signalées.", timestamp: new Date(Date.now() - 5 * 60000), confirmations: 12, severity: "élevé" },
  { id: 5, type: "info", zone: "By-Pass Sud", message: "✅ Circulation fluide ! Route recommandée.", timestamp: new Date(Date.now() - 3 * 60000), confirmations: 19, severity: "info" },
  { id: 6, type: "manifestation", zone: "Analakely - 13 Mai", message: "Manifestation étudiante. Avenue fermée jusqu'à 16h.", timestamp: new Date(Date.now() - 92 * 60000), confirmations: 41, severity: "critique" },
];

// ═══════════════════════════════════════════════════════════════════
// 🔧 UTILS
// ═══════════════════════════════════════════════════════════════════
function generateCongestionHistory(): CongestionPoint[] {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 60000);
    const h = d.getHours();
    const m = d.getMinutes();
    const isRushMorning = (h === 6 && m >= 30) || (h >= 7 && h < 9);
    const isRushEvening = (h === 16 && m >= 30) || (h >= 17 && h < 20);
    let base = 180;
    if (isRushMorning) base = 720;
    if (isRushEvening) base = 850;
    const noise = Math.floor((Math.random() - 0.5) * 120);
    const vehicules = Math.max(50, base + noise);
    const vitesse = Math.max(5, Math.min(60, 3500 / vehicules));
    return {
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      vehicules,
      vitesse: Math.round(vitesse),
      minute: i,
    };
  });
}

function alertIcon(type: AlertItem["type"]): string {
  const icons = { accident: "🚨", travaux: "🚧", taxibe: "🚌", manifestation: "⚠️", pluie: "🌧️", info: "ℹ️" };
  return icons[type];
}

function timeAgo(timestamp: Date): string {
  const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${minutes % 60 > 0 ? String(minutes % 60).padStart(2, '0') : ''}`;
  return `${Math.floor(hours / 24)}j`;
}

function getGreeting(hour: number): string {
  if (hour < 5) return "Bonne nuit";
  if (hour < 12) return "Salama";
  if (hour < 18) return "Bon après-midi";
  if (hour < 22) return "Bonsoir";
  return "Bonne soirée";
}

function resolveLocation(lat: number, lng: number): string {
  if (lat < -19.1 || lat > -18.7 || lng < 47.4 || lng > 47.7) return "Hors Antananarivo";
  if (lat > -18.87 && lng > 47.53) return "Analamahitsy";
  if (lat > -18.90 && lat < -18.87) return "Ankorondrano";
  if (lat > -18.92 && lat < -18.90) return "Analakely";
  if (lat > -18.94 && lng < 47.52) return "Andohatapenaka";
  if (lng < 47.50) return "Anosizato";
  if (lat < -18.94) return "Tanjombato";
  return "Antananarivo";
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 TOPBAR — Minimaliste
// ═══════════════════════════════════════════════════════════════════
function Topbar({ displayName, location, onLogout, time }: {
  displayName: string;
  location: string;
  onLogout: () => void;
  time: Date;
}) {
  return (
    <header className="topbar">
      <div className="left">
        <div className="logo">
          <div className="pulse" />
          <span className="brand">Africa<b>Life</b></span>
        </div>
        <span className="live">● LIVE</span>
      </div>

      <div className="center">
        <span className="loc">📍 {location}</span>
        <span className="sep">·</span>
        <span className="time">{time.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="right">
        <div className="user">
          <div className="avatar">{displayName[0]?.toUpperCase()}</div>
          <span className="name">{displayName}</span>
        </div>
        <button className="logout" onClick={onLogout}>⎋</button>
      </div>

      <style jsx>{`
        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(10, 14, 26, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 60px;
        }
        .left, .center, .right { display: flex; align-items: center; gap: 14px; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .pulse {
          width: 10px; height: 10px; border-radius: 50%;
          background: ${COLORS.primary};
          box-shadow: 0 0 16px ${COLORS.primary};
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .brand { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .brand b { color: ${COLORS.primary}; font-weight: 800; }
        .live {
          font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
          color: ${COLORS.warn};
          background: rgba(255, 184, 0, 0.12);
          padding: 4px 10px; border-radius: 999px;
          border: 1px solid rgba(255, 184, 0, 0.3);
        }
        .center { font-size: 13px; color: rgba(255,255,255,0.6); }
        .loc { color: #fff; font-weight: 500; }
        .sep { opacity: 0.3; }
        .time { font-family: 'SF Mono', monospace; font-weight: 700; color: ${COLORS.primary}; }
        .user { display: flex; align-items: center; gap: 10px; }
        .avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: ${COLORS.primary}; color: ${COLORS.bg};
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px;
        }
        .name { font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500; }
        .logout {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.6);
          font-size: 16px; cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center; justify-content: center;
        }
        .logout:hover { background: rgba(255,184,0,0.12); color: ${COLORS.warn}; }
      `}</style>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 HERO BAR + CTA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
function HeroBar({ displayName, hour, congestionData, zones, onDestinationClick, onSignalClick }: {
  displayName: string;
  hour: number;
  congestionData: CongestionPoint[];
  zones: HotZone[];
  onDestinationClick: () => void;
  onSignalClick: () => void;
}) {
  const greeting = getGreeting(hour);
  const current = congestionData[congestionData.length - 1];
  const criticalZones = zones.filter(z => z.level >= 85).length;
  const timeLostToday = Math.floor(Math.random() * 90) + 45;

  return (
    <div className="hero">
      <div className="hero-info">
        <h1 className="title">
          {greeting}, <span className="hl">{displayName}</span> 👋
        </h1>
        <div className="stats">
          <div className="stat">
            <span className="dot warn" />
            <b>{current?.vehicules.toLocaleString()}</b> véhicules bloqués
          </div>
          <div className="stat">
            <span className="dot warn" />
            <b>{criticalZones}</b> zones critiques
          </div>
          <div className="stat">
            <span className="dot" />
            <b>{timeLostToday} min</b> perdues aujourd&apos;hui
          </div>
        </div>
      </div>

      <div className="hero-actions">
        <button className="cta-signal" onClick={onSignalClick}>
          <span className="cta-icon">⚠️</span>
          <span className="cta-text">SIGNALER</span>
        </button>

        <button className="cta-main" onClick={onDestinationClick}>
          <div className="cta-main-icon">🧭</div>
          <div className="cta-main-content">
            <span className="cta-main-title">OÙ VAIS-JE ?</span>
            <span className="cta-main-sub">Itinéraire optimal avec ARIA</span>
          </div>
          <div className="cta-arrow">→</div>
        </button>
      </div>

      <style jsx>{`
        .hero {
          padding: 18px 24px;
          background: linear-gradient(180deg, rgba(0,229,160,0.04) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
        }
        .title { font-size: 24px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.02em; }
        .hl { color: ${COLORS.primary}; }
        .stats { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
        .stat {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: rgba(255,255,255,0.6);
        }
        .stat b { color: #fff; font-weight: 800; font-family: 'SF Mono', monospace; }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${COLORS.primary};
        }
        .dot.warn { background: ${COLORS.warn}; box-shadow: 0 0 8px ${COLORS.warn}; }

        .hero-actions { display: flex; gap: 12px; align-items: center; }

        .cta-signal {
          background: transparent;
          border: 2px solid ${COLORS.warn};
          color: ${COLORS.warn};
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 13px; font-weight: 800;
          letter-spacing: 0.06em;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: all .25s cubic-bezier(.4,0,.2,1);
        }
        .cta-signal:hover {
          background: ${COLORS.warn};
          color: ${COLORS.bg};
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,184,0,0.4);
        }
        .cta-icon { font-size: 18px; }

        .cta-main {
          background: ${COLORS.primary};
          color: ${COLORS.bg};
          border-radius: 16px;
          padding: 14px 22px;
          cursor: pointer;
          display: flex; align-items: center; gap: 14px;
          transition: all .3s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 6px 24px rgba(0,229,160,0.35);
          position: relative; overflow: hidden;
        }
        .cta-main::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform .6s;
        }
        .cta-main:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(0,229,160,0.5);
        }
        .cta-main:hover::before { transform: translateX(100%); }
        .cta-main-icon { font-size: 26px; }
        .cta-main-content { display: flex; flex-direction: column; align-items: flex-start; }
        .cta-main-title { font-size: 15px; font-weight: 900; letter-spacing: 0.04em; }
        .cta-main-sub { font-size: 11px; opacity: 0.7; font-weight: 600; }
        .cta-arrow { font-size: 22px; font-weight: 800; margin-left: 4px; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 📊 PANNEAU LATÉRAL UNIFIÉ (Onglets)
// ═══════════════════════════════════════════════════════════════════
type Tab = "chart" | "alerts" | "trajets";

function SidePanel({ congestionData, alerts, trajets, onTrajetSelect }: {
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

// ═══════════════════════════════════════════════════════════════════
// 🎯 MODAL DESTINATION
// ═══════════════════════════════════════════════════════════════════
function DestinationModal({ onClose, onConfirm }: {
  onClose: () => void;
  onConfirm: (dest: string, mode: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState<"voiture" | "taxibe" | "marche">("voiture");

  const suggestions = ["Analakely", "Ankorondrano", "Ivandry", "Andravoahangy", "Mahamasina", "67 Hectares", "Tanjombato", "Aéroport Ivato"];

  const handleSubmit = () => {
    if (destination.trim()) onConfirm(destination.trim(), mode);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="header">
          <div className="title">🧭 Où voulez-vous aller ?</div>
          <button className="close" onClick={onClose}>✕</button>
        </div>

        <div className="body">
          <label className="label">DESTINATION</label>
          <input
            autoFocus
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Tapez votre destination..."
            className="input"
          />

          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setDestination(s)}
                className={`chip ${destination === s ? 'active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="label">MODE DE TRANSPORT</label>
          <div className="modes">
            {[
              { id: "voiture", icon: "🚗", label: "Voiture" },
              { id: "taxibe", icon: "🚌", label: "Taxi-be" },
              { id: "marche", icon: "🚶", label: "Marche" }
            ].map(m => (
              <button
                key={m.id}
                className={`mode ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id as "voiture" | "taxibe" | "marche")}
              >
                <span className="m-icon">{m.icon}</span>
                <span className="m-text">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!destination.trim()}>
            🚀 LANCER ARIA
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fade .2s ease;
        }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: ${COLORS.bg};
          border: 1px solid ${COLORS.primary}40;
          border-radius: 20px;
          width: 520px; max-width: 92vw;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 60px ${COLORS.primary}15;
          animation: slide .3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: space-between;
        }
        .title { font-size: 18px; font-weight: 800; color: #fff; }
        .close {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.5);
          font-size: 18px; cursor: pointer;
          transition: all .2s;
        }
        .close:hover { background: ${COLORS.warn}; color: ${COLORS.bg}; }
        .body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
        .label {
          font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
        }
        .input {
          background: rgba(255,255,255,0.05);
          border: 2px solid ${COLORS.primary}40;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 15px; color: #fff;
          outline: none; width: 100%;
          transition: all .2s;
        }
        .input:focus {
          border-color: ${COLORS.primary};
          background: rgba(0,229,160,0.05);
        }
        .input::placeholder { color: rgba(255,255,255,0.3); }
        .suggestions { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          transition: all .2s;
        }
        .chip:hover { border-color: ${COLORS.primary}50; color: ${COLORS.primary}; }
        .chip.active {
          background: ${COLORS.primary};
          color: ${COLORS.bg};
          border-color: ${COLORS.primary};
          font-weight: 700;
        }
        .modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .mode {
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 16px 12px;
          cursor: pointer;
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          transition: all .2s;
        }
        .mode:hover { border-color: ${COLORS.primary}40; }
        .mode.active {
          background: rgba(0,229,160,0.1);
          border-color: ${COLORS.primary};
        }
        .m-icon { font-size: 26px; }
        .m-text {
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.65);
        }
        .mode.active .m-text { color: ${COLORS.primary}; }
        .footer {
          padding: 18px 24px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; gap: 10px;
        }
        .btn-cancel {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.6);
          padding: 14px;
          border-radius: 12px;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          transition: all .2s;
        }
        .btn-cancel:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .btn-submit {
          flex: 2;
          background: ${COLORS.primary};
          color: ${COLORS.bg};
          padding: 14px;
          border-radius: 12px;
          font-size: 14px; font-weight: 900;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all .25s;
          box-shadow: 0 4px 20px ${COLORS.primary}40;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px ${COLORS.primary}60;
        }
        .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 TOAST
// ═══════════════════════════════════════════════════════════════════
function Toast({ message, type = "info", onClose }: {
  message: string;
  type?: "success" | "info" | "warning" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isPrimary = type === "success" || type === "info";
  const color = isPrimary ? COLORS.primary : COLORS.warn;
  const icons = { success: "✓", info: "ℹ️", warning: "⚠️", error: "✕" };

  return (
    <div className="toast">
      <span className="icon">{icons[type]}</span>
      <span className="msg">{message}</span>
      <button className="close" onClick={onClose}>✕</button>
      <style jsx>{`
        .toast {
          position: fixed;
          bottom: 110px; left: 50%;
          transform: translateX(-50%);
          z-index: 300;
          background: ${COLORS.bg};
          border: 2px solid ${color};
          border-radius: 14px;
          padding: 14px 20px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 32px ${color}30;
          animation: slide .3s cubic-bezier(.4,0,.2,1);
          max-width: 500px;
        }
        @keyframes slide {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .icon { font-size: 18px; }
        .msg { font-size: 13px; color: ${color}; font-weight: 700; flex: 1; }
        .close {
          width: 24px; height: 24px; border-radius: 6px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          font-size: 12px; cursor: pointer;
          transition: all .2s;
        }
        .close:hover { background: rgba(255,255,255,0.15); color: #fff; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🏆 DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("Antananarivo");
  const [congestionData, setCongestionData] = useState<CongestionPoint[]>(() => generateCongestionHistory());
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS_INITIALES);
  const [zones] = useState<HotZone[]>(ZONES_CRITIQUES);
  const [showDestModal, setShowDestModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" | "error" } | null>(null);
  const [selectedTrajet, setSelectedTrajet] = useState<TrajetItem | null>(null);
  const [signalCount, setSignalCount] = useState(0);

  // ─── Auth ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else { setUser(session.user as User); setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push("/login");
      else { setUser(session.user as User); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // ─── Horloge ───
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // ─── Géoloc ───
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(resolveLocation(pos.coords.latitude, pos.coords.longitude)),
      () => setLocation("Antananarivo"),
      { enableHighAccuracy: true }
    );
  }, []);

  // ─── Live data ───
  useEffect(() => {
    const i = setInterval(() => {
      setCongestionData((prev) => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const isRushM = (h === 6 && m >= 30) || (h >= 7 && h < 9);
        const isRushE = (h === 16 && m >= 30) || (h >= 17 && h < 20);
        const last = prev[prev.length - 1];
        let target = 180;
        if (isRushM) target = 720;
        if (isRushE) target = 850;
        const delta = (target - last.vehicules) * 0.15 + (Math.random() - 0.5) * 60;
        const newV = Math.max(50, Math.min(950, Math.round(last.vehicules + delta)));
        const newS = Math.max(5, Math.min(60, Math.round(3500 / newV)));
        return [...prev.slice(1).map((p, i) => ({ ...p, minute: i })), {
          time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
          vehicules: newV, vitesse: newS, minute: 29,
        }];
      });
    }, 60000);
    return () => clearInterval(i);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  const handleDestConfirm = useCallback((destination: string, mode: string) => {
    setShowDestModal(false);
    setToast({ message: `🚀 ARIA calcule votre itinéraire vers ${destination}...`, type: "info" });
    setTimeout(() => {
      const modeText = mode === 'voiture' ? 'en voiture' : mode === 'taxibe' ? 'en taxi-be' : 'à pied';
      const message = `ARIA, je veux aller à ${destination} depuis ${location} ${modeText}. Donne-moi le meilleur itinéraire en évitant les ${zones.filter(z => z.level >= 80).length} zones critiques. Quel est le meilleur moment de départ ?`;
      window.dispatchEvent(new CustomEvent("aria-open", { detail: { message } }));
    }, 600);
  }, [location, zones]);

  const handleSignalIncident = useCallback(() => {
    const newAlert: AlertItem = {
      id: Date.now(),
      type: Math.random() > 0.5 ? "accident" : "travaux",
      zone: location.split(",")[0],
      message: `Incident signalé par utilisateur #${signalCount + 1}. En attente de confirmations.`,
      timestamp: new Date(),
      confirmations: 1,
      severity: "modéré",
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 5)]);
    setSignalCount((n) => n + 1);
    setToast({ message: "✓ Signalement envoyé à la communauté", type: "success" });
  }, [location, signalCount]);

  const handleTrajetSelect = useCallback((trajet: TrajetItem) => {
    setSelectedTrajet(trajet);
    setToast({ message: `Trajet chargé : ${trajet.label}`, type: "info" });
    const message = `ARIA, mon trajet : ${trajet.from} → ${trajet.to} (${trajet.distance}). Actuellement ${trajet.durationCurrent} vs ${trajet.durationNormal} normal. Comment optimiser ?`;
    window.dispatchEvent(new CustomEvent("aria-open", { detail: { message } }));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: COLORS.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: `3px solid ${COLORS.primary}20`,
          borderTopColor: COLORS.primary,
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{
          color: "rgba(255,255,255,0.5)", fontSize: 13,
          letterSpacing: "0.14em", fontWeight: 700,
        }}>CHARGEMENT</p>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;
  const displayName = user.email?.split("@")[0] ?? "Utilisateur";

  return (
    <div className="dashboard">
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          background: ${COLORS.bg};
        }
        button { font-family: inherit; border: none; background: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.primary}40; }
      `}</style>

      <style jsx>{`
        .dashboard { min-height: 100vh; background: ${COLORS.bg}; color: #fff; }
        .main {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          padding: 16px 24px 24px;
          height: calc(100vh - 168px);
          min-height: 600px;
        }
        .map-wrap {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .map-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(180deg, ${COLORS.bg}aa 0%, transparent 100%);
          pointer-events: none;
          z-index: 2;
        }
        .map-overlay {
          position: absolute;
          top: 16px; left: 16px;
          z-index: 3;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .map-badge {
          background: rgba(10,14,26,0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 8px 14px;
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700;
          color: #fff;
        }
        .map-badge.primary { border-color: ${COLORS.primary}50; }
        .map-badge.warn { border-color: ${COLORS.warn}50; }
        .map-badge .dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: ${COLORS.primary};
          box-shadow: 0 0 10px ${COLORS.primary};
          animation: pulse 1.5s infinite;
        }
        .map-badge.warn .dot { background: ${COLORS.warn}; box-shadow: 0 0 10px ${COLORS.warn}; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>

      <Topbar
        displayName={displayName}
        location={location}
        onLogout={handleLogout}
        time={time}
      />

      <HeroBar
        displayName={displayName}
        hour={time.getHours()}
        congestionData={congestionData}
        zones={zones}
        onDestinationClick={() => setShowDestModal(true)}
        onSignalClick={handleSignalIncident}
      />

      <div className="main">
        {/* CARTE XXL */}
        <div className="map-wrap">
          <div className="map-overlay">
            <div className="map-badge primary">
              <span className="dot" />
              CARTE TEMPS RÉEL
            </div>
            <div className="map-badge warn">
              <span className="dot" />
              {zones.filter(z => z.level >= 85).length} zones critiques
            </div>
          </div>
          <MapWithNoSSR zones={zones} selectedTrajet={selectedTrajet} />
        </div>

        {/* PANNEAU LATÉRAL */}
        <SidePanel
          congestionData={congestionData}
          alerts={alerts}
          trajets={TRAJETS_QUOTIDIENS}
          onTrajetSelect={handleTrajetSelect}
        />
      </div>

      <AIAssistant />

      {showDestModal && (
        <DestinationModal
          onClose={() => setShowDestModal(false)}
          onConfirm={handleDestConfirm}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}