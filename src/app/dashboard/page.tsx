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
import LeftDrawer from "@/components/dashboard/LeftDrawer";
import Toast from "@/components/ui/Toast";
import SkeletonDashboard from "@/components/dashboard/SkeletonDashboard";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
function DashboardContent() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syntheticLoading, setSyntheticLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("Antananarivo");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [congestionData, setCongestionData] = useState<CongestionPoint[]>(() => generateCongestionHistory());
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS_INITIALES);
  const [zones] = useState<HotZone[]>(ZONES_CRITIQUES);
  const [showDestModal, setShowDestModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" | "error" } | null>(null);
  const [selectedTrajet, setSelectedTrajet] = useState<TrajetItem | null>(null);
  const [signalCount, setSignalCount] = useState(0);
  const [simulationMode, setSimulationMode] = useState(false);

  // ─── Auth ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user as User);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setUser(session.user as User);
      else setUser(null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Horloge ───
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // ─── Chargement Synthétique (Skeleton FB/Threads) ───
  useEffect(() => {
    const timer = setTimeout(() => {
      setSyntheticLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Géoloc ───
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        const loc = await resolveLocation(pos.coords.latitude, pos.coords.longitude);
        setLocation(loc);
      },
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
    setUser(null);
    setToast({ message: "Vous êtes déconnecté", type: "info" });
  }, []);

  const handleDestConfirm = useCallback((destination: string, mode: string) => {
    setShowDestModal(false);

    // Simuler un trajet pour forcer la Map à le tracer
    setSelectedTrajet({
      id: Date.now(),
      label: `Vers ${destination}`,
      from: "CURRENT_LOCATION",
      to: destination,
      distance: "",
      durationNormal: "",
      durationCurrent: "",
      icon: "🧭",
      status: "dense",
      transportType: mode as "voiture" | "taxibe" | "marche" | "mixte"
    });

    setToast({ message: `🚀 ARIA calcule votre itinéraire vers ${destination}...`, type: "info" });
    setTimeout(() => {
      const modeText = mode === 'voiture' ? 'en voiture' : mode === 'taxibe' ? 'en taxi-be' : 'à pied';
      const message = `Je veux aller à ${destination}. Donne-moi les prévisions de temps de trajet selon l'heure de départ.`;
      const response = `D'après mes analyses de l'état actuel du trafic et de l'historique vers **${destination}** :\n\n- Si vous partez maintenant : **1h25**\n- Si vous partez à 6h40 : **25 minutes**\n- Si vous partez à 7h30 : **1h45**\n\n💡 Je vous recommande vivement d'anticiper et de partir à **6h40** pour esquiver le gros bouchon en formation.`;

      window.dispatchEvent(new CustomEvent("aria-open", { detail: { message, response } }));
    }, 600);
  }, [location, zones]);

  const handleSignalIncident = useCallback(() => {
    if (!user) {
      setToast({ message: "Veuillez vous connecter pour signaler un incident", type: "warning" });
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
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
    if (!user) {
      setToast({ message: "Veuillez vous connecter pour utiliser vos trajets personnalisés", type: "warning" });
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    setSelectedTrajet(trajet);
    setToast({ message: `Trajet chargé : ${trajet.label}`, type: "info" });
    const message = `ARIA, mon trajet : ${trajet.from} → ${trajet.to} (${trajet.distance}). Actuellement ${trajet.durationCurrent} vs ${trajet.durationNormal} normal. Comment optimiser ?`;
    window.dispatchEvent(new CustomEvent("aria-open", { detail: { message } }));
  }, []);

  if (loading || syntheticLoading) {
    return <SkeletonDashboard theme={theme} />;
  }

  const displayName = user?.email?.split("@")[0] ?? "Invité";

  return (
    <div className={`dashboard-container ${theme === 'light' ? 'light-theme' : ''}`}>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
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

      <LeftDrawer />

      <Topbar
        displayName={displayName}
        location={location}
        onLogout={handleLogout}
        time={time}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        isAuthenticated={!!user}
      />

      <HeroBar
        displayName={displayName}
        hour={time.getHours()}
        congestionData={congestionData}
        zones={zones}
        onDestinationClick={() => setShowDestModal(true)}
        onSignalClick={handleSignalIncident}
        location={location}
        signalCount={signalCount}
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
          <MapWithNoSSR zones={zones} selectedTrajet={selectedTrajet} userCoords={userCoords} simulationMode={simulationMode} />
        </div>

        {/* PANNEAU LATÉRAL */}
        <SidePanel
          onSignalIncident={handleSignalIncident}
        />
      </div>

      <AIAssistant
        displayName={displayName}
        location={location}
        criticalZones={zones.filter(z => z.level >= 85).map(z => z.name)}
      />

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

      <style jsx global>{`
        /* ── LIGHT THEME OVERRIDES ── */
        .light-theme {
          background: #F4F7FA !important;
          color: #111 !important;
        }
        .light-theme header.topbar,
        .light-theme aside.panel,
        .light-theme .left-drawer,
        .light-theme .drawer-toggle,
        .light-theme .route-info-card,
        .light-theme .modal,
        .light-theme .map-badge {
          background: rgba(255, 255, 255, 0.95) !important;
          color: #111 !important;
          border-color: rgba(0,0,0,0.08) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05) !important;
        }
        .light-theme .leaflet-layer,
        .light-theme .leaflet-control-zoom-in,
        .light-theme .leaflet-control-zoom-out,
        .light-theme .leaflet-control-attribution {
          filter: none !important;
        }
        .light-theme .brand,
        .light-theme .title,
        .light-theme .loc,
        .light-theme .trajet-title,
        .light-theme .route-dest,
        .light-theme .stat-item .val,
        .light-theme .stat b,
        .light-theme .panel-title,
        .light-theme .metric-val,
        .light-theme .alert-title,
        .light-theme .section-title,
        .light-theme .step-label,
        .light-theme .hist-route,
        .light-theme .fav-name,
        .light-theme .drawer-header h3 {
          color: #111 !important;
        }
        .light-theme .time { color: #007A55 !important; }
        .light-theme .center,
        .light-theme .name,
        .light-theme .trajet-desc,
        .light-theme .label,
        .light-theme .m-text,
        .light-theme .stat,
        .light-theme .alert-desc,
        .light-theme .metric-label,
        .light-theme .logout,
        .light-theme .theme-toggle,
        .light-theme .setting-row,
        .light-theme .total-bar {
          color: #111 !important;
          font-weight: 500;
        }
        .light-theme .input,
        .light-theme .mode,
        .light-theme .chip,
        .light-theme .stat-item,
        .light-theme .notif-item,
        .light-theme .hist-item,
        .light-theme .fav-item,
        .light-theme .sim-btn,
        .light-theme .nav-btn,
        .light-theme .step,
        .light-theme .total-bar {
          background: #fff !important;
          border-color: rgba(0,0,0,0.2) !important;
          color: #111 !important;
        }
        .light-theme .chip.active,
        .light-theme .mode.active,
        .light-theme .nav-btn.active,
        .light-theme .sim-btn.active {
          background: rgba(0, 122, 85, 0.1) !important;
          border-color: #007A55 !important;
          color: #007A55 !important;
        }
        .light-theme .tab {
          color: rgba(0,0,0,0.5) !important;
        }
        .light-theme .tab.active {
          color: #007A55 !important;
          border-bottom-color: #007A55 !important;
          background: rgba(0,122,85,0.04) !important;
        }
        .light-theme .drawer-toggle:hover {
          background: rgba(0,0,0,0.05) !important;
          color: #007A55 !important;
        }
        .light-theme .notif-text,
        .light-theme .hist-time,
        .light-theme .fav-route,
        .light-theme .section-sub,
        .light-theme .step-route,
        .light-theme .step-duration {
          color: rgba(0,0,0,0.6) !important;
        }
        .light-theme .trajet-card {
          background: #fff !important;
          border-color: rgba(0,0,0,0.15) !important;
        }
        .light-theme .trajet-card:hover {
          border-color: #007A55 !important;
          background: rgba(0,122,85,0.03) !important;
        }
        .light-theme .close { color: #111 !important; background: rgba(0,0,0,0.05) !important; }
        .light-theme .close:hover { background: #FF3D00 !important; color: #fff !important; }
        .light-theme .map-wrap::before {
          background: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%) !important;
        }
        .light-theme .stat-item.highlight {
          background: rgba(0, 122, 85, 0.1) !important;
          border: 1px solid rgba(0, 122, 85, 0.4) !important;
        }
        .light-theme .stat-item.highlight .val {
          color: #007A55 !important;
        }
        /* ── Dark Green & Dark Yellow Overrides ── */
        .light-theme .brand b,
        .light-theme .hl { color: #007A55 !important; }
        
        .light-theme .map-badge.primary .dot,
        .light-theme .pulse,
        .light-theme .dot:not(.warn) {
          background: #007A55 !important;
          box-shadow: 0 0 10px #007A55 !important;
        }
        .light-theme .cta-main,
        .light-theme .avatar,
        .light-theme .panel-icon {
          background: #007A55 !important;
          color: #fff !important;
        }
        .light-theme .live {
          color: #B28200 !important;
          border-color: rgba(178, 130, 0, 0.4) !important;
          background: rgba(178, 130, 0, 0.1) !important;
        }
        .light-theme .cta-signal {
          border-color: #B28200 !important;
          color: #B28200 !important;
        }
        .light-theme .cta-signal:hover {
          background: #B28200 !important;
          color: #fff !important;
        }
        .light-theme .dot.warn,
        .light-theme .map-badge.warn .dot {
          background: #B28200 !important;
          box-shadow: 0 0 10px rgba(178, 130, 0, 0.8) !important;
        }
        .light-theme .alert-icon {
          background: rgba(178, 130, 0, 0.15) !important;
          color: #B28200 !important;
        }
      `}</style>

      <style jsx>{`
        .dashboard-container {
          display: flex; flex-direction: column; min-height: 100vh;
          background: #050811; color: #fff; overflow-x: hidden; overflow-y: auto;
          transition: background 0.3s ease, color 0.3s ease;
          position: relative;
        }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}