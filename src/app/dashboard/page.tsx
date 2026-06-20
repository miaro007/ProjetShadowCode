"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import AIAssistant from "@/components/AIAssistant";
import type { User } from "@/types";

import { COLORS, ZONES_CRITIQUES, TRAJETS_QUOTIDIENS, ALERTS_INITIALES } from "@/lib/dashboard-data";
import { resolveLocation, generateCongestionHistory } from "@/utils/dashboard";
import { CongestionPoint, AlertItem, HotZone, TrajetItem } from "@/types/dashboard";

import Topbar from "@/components/dashboard/Topbar";
import HeroBar from "@/components/dashboard/HeroBar";
import SidePanel from "@/components/dashboard/SidePanel";
import DestinationModal from "@/components/dashboard/DestinationModal";
import Toast from "@/components/ui/Toast";

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