"use client";

/**
 * AfricaLife – Dashboard Transport Urbain
 * Antananarivo / Madagascar
 *
 * Dépendances à installer :
 *   npm install leaflet react-leaflet recharts
 *   npm install --save-dev @types/leaflet
 *
 * Fichier à placer dans :  src/app/dashboard/page.tsx
 * (remplace ou complète ton dashboard existant)
 *
 * Variables d'env nécessaires (déjà présentes dans ton projet) :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { supabase } from "@/lib/supabase";
import AIAssistant from "@/components/AIAssistant";
import type { User } from "@/types";

// ─── Leaflet chargé côté client uniquement ────────────────────────
const MapWithNoSSR = dynamic(() => import("@/components/TrafficMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%",
      background: "#0d1520",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 20,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "2px solid rgba(0,229,255,.15)",
          borderTop: "2px solid #00E5FF",
          animation: "spin .8s linear infinite",
          margin: "0 auto 12px",
        }} />
        <p style={{ color: "rgba(255,255,255,.3)", fontSize: 12, letterSpacing: ".1em" }}>
          CHARGEMENT CARTE
        </p>
      </div>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────
interface CongestionPoint {
  time: string;
  vehicules: number;
  minute: number;
}

interface AlertItem {
  id: number;
  type: "accident" | "travaux" | "taxibe" | "info";
  zone: string;
  message: string;
  ago: string;
  confirmations: number;
}

interface TrajetItem {
  id: number;
  label: string;
  from: string;
  to: string;
  duration: string;
  icon: string;
}

// ─── Données simulées Antananarivo ────────────────────────────────
const ZONES_BOUCHON = [
  { id: 1, name: "Route des hydrocarbures", lat: -18.9005, lng: 47.5162, level: 97 },
  { id: 2, name: "Analamahitsy", lat: -18.8712, lng: 47.5412, level: 91 },
  { id: 3, name: "Ankorondrano", lat: -18.8948, lng: 47.5289, level: 85 },
  { id: 4, name: "Andohatapenaka", lat: -18.9241, lng: 47.5081, level: 74 },
  { id: 5, name: "Mahazo", lat: -18.9184, lng: 47.4921, level: 68 },
  { id: 6, name: "Ankadimbahoaka", lat: -18.9421, lng: 47.5321, level: 62 },
  { id: 7, name: "Anosizato", lat: -18.9312, lng: 47.4989, level: 55 },
];

const TRAJETS_QUOTIDIENS: TrajetItem[] = [
  { id: 1, label: "Domicile → Analakely", from: "Ivandry", to: "Analakely", duration: "38 min", icon: "🏠" },
  { id: 2, label: "Analakely → Bureau", from: "Analakely", to: "Ankorondrano", duration: "22 min", icon: "💼" },
  { id: 3, label: "Bureau → Marché", from: "Ankorondrano", to: "Andravoahangy", duration: "15 min", icon: "🛒" },
  { id: 4, label: "Retour domicile", from: "Analakely", to: "Ivandry", duration: "45 min", icon: "🌙" },
];

const ALERTS_INIT: AlertItem[] = [
  { id: 1, type: "accident", zone: "Anosy", message: "Accident — voie partiellement fermée", ago: "8 min", confirmations: 22 },
  { id: 2, type: "travaux", zone: "Ambohimiandra", message: "Nid de poule — ralentissement majeur", ago: "1h", confirmations: 11 },
  { id: 3, type: "taxibe", zone: "Tanjombato", message: "Taxi-be 154 — retard 15 min", ago: "12 min", confirmations: 0 },
  { id: 4, type: "info", zone: "By-Pass sud", message: "Circulation fluide — alternative recommandée", ago: "5 min", confirmations: 8 },
  { id: 5, type: "accident", zone: "Mahazo", message: "Camion en panne — voie droite bloquée", ago: "25 min", confirmations: 17 },
];

// ─── Génère les 30 dernières minutes de données de congestion ─────
function generateCongestionHistory(): CongestionPoint[] {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 60000);
    const h = d.getHours(), m = d.getMinutes();
    // Pic de congestion simulé autour de 7h30-9h et 17h-19h
    const isRushMorning = h >= 7 && h < 9;
    const isRushEvening = h >= 17 && h < 19;
    const base = isRushMorning ? 680 : isRushEvening ? 720 : 280;
    const noise = Math.floor((Math.random() - 0.5) * 80);
    return {
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      vehicules: Math.max(50, base + noise),
      minute: i,
    };
  });
}

// ─── Couleur selon niveau de congestion ───────────────────────────
function congestionColor(level: number): string {
  if (level >= 80) return "#FF3D00";
  if (level >= 60) return "#FFB300";
  return "#00D4A4";
}

function alertIcon(type: AlertItem["type"]): string {
  return { accident: "⚠️", travaux: "🚧", taxibe: "🚌", info: "ℹ️" }[type];
}

// ─── Composant Topbar ─────────────────────────────────────────────
function Topbar({ displayName, location, onLogout, time }: {
  displayName: string;
  location: string;
  onLogout: () => void;
  time: Date;
}) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(10,15,30,.95)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,.07)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 56,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: "#00E5FF",
          boxShadow: "0 0 8px #00E5FF", animation: "blink 1.4s infinite",
          display: "inline-block",
        }} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.02em" }}>
          Africa<span style={{ color: "#00E5FF" }}>Life</span>
        </span>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 999,
          background: "rgba(255,61,0,.15)", color: "#FF3D00",
          border: "1px solid rgba(255,61,0,.3)", fontWeight: 600, letterSpacing: ".06em",
        }}>TRAFIC LIVE</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,.4)" }}>
        <span>📍</span>
        <span style={{ color: "rgba(255,255,255,.65)" }}>{location}</span>
        <span style={{ margin: "0 4px", opacity: .4 }}>·</span>
        <span style={{ fontFamily: "monospace" }}>
          {time.toLocaleTimeString("fr-FR")}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg,#00D4A4,#F59E0B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#0A0F1E",
        }}>
          {displayName[0]?.toUpperCase()}
        </div>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.55)" }}>{displayName}</span>
        <button
          onClick={onLogout}
          style={{
            background: "rgba(255,107,107,.1)", border: "1px solid rgba(255,107,107,.25)",
            borderRadius: 8, color: "#FF6B6B", cursor: "pointer",
            padding: "5px 12px", fontSize: 12, fontWeight: 500,
            fontFamily: "inherit",
          }}
        >
          ⎋ Quitter
        </button>
      </div>
    </header>
  );
}

// ─── Salutation selon l'heure ─────────────────────────────────────
function getGreeting(h: number): string {
  if (h < 12) return "Bon matin";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

// ─── Graphique Congestion ─────────────────────────────────────────
function CongestionChart({ data }: { data: CongestionPoint[] }) {
  const latest = data[data.length - 1]?.vehicules ?? 0;
  const peak = Math.max(...data.map(d => d.vehicules));
  const isHigh = latest > 500;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase", marginBottom: 4 }}>
            Indice de congestion · Tana
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "monospace", color: isHigh ? "#FF3D00" : "#00D4A4" }}>
              {latest.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>véhicules bloqués</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginBottom: 2 }}>pic · 30 min</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#FFB300" }}>
            {peak.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(255,255,255,.25)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,.25)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0d1520", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 10, fontSize: 12,
              }}
              labelStyle={{ color: "rgba(255,255,255,.5)", fontSize: 10 }}
              itemStyle={{ color: "#00E5FF" }}
             /* formatter={(v: number) => [`${v} véhicules`, "Bloqués"]}*/
            />
            <ReferenceLine y={600} stroke="rgba(255,61,0,.3)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="vehicules"
              stroke="#00E5FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#00E5FF", stroke: "#0d1520", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <div style={{ flex: 1, background: "rgba(255,61,0,.08)", border: "1px solid rgba(255,61,0,.2)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#FF3D00", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 3 }}>Stress</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#FF3D00" }}>82<span style={{ fontSize: 10, fontWeight: 400 }}>/100</span></div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,179,0,.08)", border: "1px solid rgba(255,179,0,.2)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#FFB300", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 3 }}>Trajet moy.</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#FFB300" }}>1h47</div>
        </div>
        <div style={{ flex: 1, background: "rgba(0,212,164,.08)", border: "1px solid rgba(0,212,164,.2)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#00D4A4", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 3 }}>Départ opt.</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: "#00D4A4" }}>09h45</div>
        </div>
      </div>
    </div>
  );
}

// ─── Liste des alertes ────────────────────────────────────────────
function AlertsList({ alerts, onSignal }: { alerts: AlertItem[]; onSignal: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>
          Alertes communauté
        </div>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 999,
          background: "rgba(255,61,0,.15)", color: "#FF3D00", fontWeight: 600,
        }}>
          {alerts.length} actives
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
        {alerts.map(a => (
          <div key={a.id} style={{
            background: "rgba(255,255,255,.03)",
            border: `1px solid ${a.type === "accident" ? "rgba(255,61,0,.2)" : a.type === "info" ? "rgba(0,212,164,.15)" : "rgba(255,255,255,.07)"}`,
            borderRadius: 12, padding: "10px 12px",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{alertIcon(a.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{a.zone}</span>
                {a.confirmations > 0 && (
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>
                    {a.confirmations} conf.
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{a.message}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 3 }}>Il y a {a.ago}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panneau Trajets quotidiens ───────────────────────────────────
function TrajetsList({ trajets, onSelect }: { trajets: TrajetItem[]; onSelect: (t: TrajetItem) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: ".1em", color: "rgba(255,255,255,.35)", textTransform: "uppercase", marginBottom: 10 }}>
        Mes trajets quotidiens
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {trajets.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            style={{
              background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 12, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", textAlign: "left", width: "100%",
              fontFamily: "inherit", transition: "border-color .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,229,255,.3)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.07)")}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
                {t.from} → {t.to}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, fontFamily: "monospace",
              color: "#00E5FF", background: "rgba(0,229,255,.08)",
              padding: "3px 8px", borderRadius: 8,
            }}>{t.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Modal destination ────────────────────────────────────────────
function DestinationModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (dest: string) => void }) {
  const [value, setValue] = useState("");
  const suggestions = [
    "Analakely", "Ankorondrano", "Ivandry", "Andravoahangy",
    "Mahamasina", "67 Hectares", "Tsaralalana", "Tanjombato",
  ];
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#0d1520", border: "1px solid rgba(0,229,255,.2)",
        borderRadius: 20, padding: 24, width: 380, maxWidth: "90vw",
        animation: "fadein .2s ease",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#00E5FF" }}>🧭</span> Où vas-tu ?
        </div>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Entrez votre destination..."
          style={{
            width: "100%", background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(0,229,255,.25)", borderRadius: 12,
            padding: "10px 14px", fontSize: 14, color: "#fff",
            outline: "none", fontFamily: "inherit", marginBottom: 14,
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => setValue(s)}
              style={{
                background: value === s ? "rgba(0,229,255,.15)" : "rgba(255,255,255,.04)",
                border: `1px solid ${value === s ? "rgba(0,229,255,.4)" : "rgba(255,255,255,.1)"}`,
                borderRadius: 999, padding: "4px 12px", fontSize: 12,
                color: value === s ? "#00E5FF" : "rgba(255,255,255,.55)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
              padding: "10px", fontSize: 13, color: "rgba(255,255,255,.5)",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            style={{
              flex: 2, background: "rgba(0,229,255,.15)",
              border: "1px solid rgba(0,229,255,.35)", borderRadius: 12,
              padding: "10px", fontSize: 13, fontWeight: 600,
              color: "#00E5FF", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Lancer ARIA → {value || "destination"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
      zIndex: 300, background: "#0d1520",
      border: "1px solid rgba(0,229,255,.3)", borderRadius: 14,
      padding: "12px 20px", fontSize: 13, color: "#00E5FF",
      boxShadow: "0 4px 30px rgba(0,0,0,.5)", animation: "fadein .3s ease",
      whiteSpace: "nowrap",
    }}>
      ✓ {msg}
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState("Antananarivo, MG");
  const [congestionData, setCongestionData] = useState<CongestionPoint[]>(() => generateCongestionHistory());
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS_INIT);
  const [showDestModal, setShowDestModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedTrajet, setSelectedTrajet] = useState<TrajetItem | null>(null);
  const [signalCount, setSignalCount] = useState(0);
  const ariaRef = useRef<{ open: (msg: string) => void } | null>(null);

  // Auth
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

  // Horloge
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // GPS (browser)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        // Résolution simplifiée pour Antananarivo
        if (latitude > -19.1 && latitude < -18.7 && longitude > 47.4 && longitude < 47.7) {
          if (latitude > -18.87) setLocation("Analamahitsy / Ambohitrarahaba");
          else if (latitude > -18.91) setLocation("Centre-ville, Analakely");
          else if (latitude > -18.93) setLocation("Ankorondrano / Ivandry");
          else setLocation("Tanjombato / Andohatapenaka");
        } else {
          setLocation(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
        }
      },
      () => setLocation("Antananarivo, MG")
    );
  }, []);

  // Mise à jour congestion toutes les 60 s (simule Supabase Realtime)
  useEffect(() => {
    const id = setInterval(() => {
      setCongestionData(prev => {
        const now = new Date();
        const h = now.getHours();
        const isRush = (h >= 7 && h < 9) || (h >= 17 && h < 19);
        const last = prev[prev.length - 1]?.vehicules ?? 400;
        const delta = (Math.random() - 0.45) * 60;
        const next: CongestionPoint = {
          time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          vehicules: Math.max(50, Math.min(900, Math.round(last + delta + (isRush ? 20 : -10)))),
          minute: 29,
        };
        return [...prev.slice(1).map((p, i) => ({ ...p, minute: i })), next];
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  const handleDestConfirm = useCallback((dest: string) => {
    setShowDestModal(false);
    setToast(`ARIA calcule votre itinéraire vers ${dest}…`);
    // Déclenche ARIA avec le contexte destination
    setTimeout(() => {
      const msg = `ARIA, je veux aller à ${dest} depuis ${location}. Donne-moi le meilleur itinéraire en évitant les bouchons actuels d'Antananarivo.`;
      // Ouvre l'assistant ARIA avec ce message pré-rempli
      // (selon l'implémentation de AIAssistant, adaptez ce déclenchement)
      window.dispatchEvent(new CustomEvent("aria-open", { detail: { message: msg } }));
    }, 500);
  }, [location]);

  const handleSignal = useCallback(() => {
    setSignalCount(n => n + 1);
    setAlerts(prev => [{
      id: Date.now(),
      type: "accident",
      zone: location.split(",")[0],
      message: `Signalement #${signalCount + 1} — incident rapporté par l'utilisateur`,
      ago: "à l'instant",
      confirmations: 1,
    }, ...prev.slice(0, 4)]);
    setToast("Signalement envoyé à la communauté ✓");
  }, [location, signalCount]);

  const handleTrajetSelect = useCallback((t: TrajetItem) => {
    setSelectedTrajet(t);
    setToast(`Trajet chargé : ${t.label}`);
    window.dispatchEvent(new CustomEvent("aria-open", {
      detail: { message: `ARIA, je prends le trajet ${t.from} → ${t.to}. Quelles sont les conditions de trafic maintenant et quel est le meilleur horaire de départ ?` }
    }));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0F1E",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20,
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "2px solid rgba(0,212,164,.2)", borderTop: "2px solid #00D4A4",
          animation: "spin .8s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, letterSpacing: ".1em" }}>CHARGEMENT</p>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.email?.split("@")[0] ?? "Utilisateur";
  const greeting = getGreeting(time.getHours());

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0F1E",
      color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-ring{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.3);opacity:0}}
        @keyframes hotspot{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.4);opacity:.3}}
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:inherit;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
      `}</style>

      <Topbar
        displayName={displayName}
        location={location}
        onLogout={handleLogout}
        time={time}
      />

      {/* ── Salutation + barre du haut ── */}
      <div style={{
        padding: "14px 24px 12px",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,.01)",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginBottom: 3 }}>
            📍 {location}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em" }}>
            {greeting},{" "}
            <span style={{ background: "linear-gradient(90deg,#00D4A4,#00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {displayName}
            </span>{" "}
            👋
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
            {congestionData[congestionData.length - 1]?.vehicules ?? 0} véhicules bloqués à Tana maintenant · {ZONES_BOUCHON.length} points chauds actifs
          </div>
        </div>

        {/* Bouton Destination */}
        <button
          onClick={() => setShowDestModal(true)}
          style={{
            background: "linear-gradient(135deg,rgba(0,229,255,.15),rgba(0,212,164,.1))",
            border: "1px solid rgba(0,229,255,.35)",
            borderRadius: 14, padding: "10px 20px",
            color: "#00E5FF", fontSize: 13, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            transition: "all .2s", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg,rgba(0,229,255,.25),rgba(0,212,164,.15))")}
          onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg,rgba(0,229,255,.15),rgba(0,212,164,.1))")}
        >
          🧭 Où vais-je ?
        </button>
      </div>

      {/* ── Grille principale 60/40 ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "60fr 40fr",
        gap: 16,
        padding: "16px 24px",
        height: "calc(100vh - 140px)",
        minHeight: 600,
      }}>

        {/* ════ COLONNE GAUCHE : CARTE ════ */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 14,
          minHeight: 0,
        }}>
          {/* Carte interactive */}
          <div style={{
            flex: 1, minHeight: 0,
            background: "#0d1520",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 20, overflow: "hidden",
            position: "relative",
          }}>
            <MapWithNoSSR
              zones={ZONES_BOUCHON}
              selectedTrajet={selectedTrajet}
            />

            {/* Badge zones chaudes overlay */}
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 10,
              display: "flex", gap: 6, flexWrap: "wrap",
              pointerEvents: "none",
            }}>
              {ZONES_BOUCHON.filter(z => z.level >= 80).map(z => (
                <span key={z.id} style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 999,
                  background: "rgba(255,61,0,.85)", color: "#fff",
                  fontWeight: 600, letterSpacing: ".04em",
                  backdropFilter: "blur(8px)",
                }}>
                  🔴 {z.name}
                </span>
              ))}
            </div>
          </div>

          {/* Trajets quotidiens (bas gauche) */}
          <div style={{
            background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 18, padding: "14px 16px",
            flexShrink: 0,
          }}>
            <TrajetsList trajets={TRAJETS_QUOTIDIENS} onSelect={handleTrajetSelect} />
          </div>
        </div>

        {/* ════ COLONNE DROITE : GRAPHIQUE + ALERTES ════ */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 14,
          minHeight: 0,
        }}>
          {/* Graphique congestion */}
          <div style={{
            background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 20, padding: "16px 18px",
            height: "42%", flexShrink: 0,
          }}>
            <CongestionChart data={congestionData} />
          </div>

          {/* Alertes */}
          <div style={{
            flex: 1, minHeight: 0,
            background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 20, padding: "16px 18px",
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <AlertsList alerts={alerts} onSignal={handleSignal} />
          </div>
        </div>
      </div>

      {/* ── Bouton Signalement flottant (juste au-dessus d'ARIA) ── */}
      <button
        onClick={handleSignal}
        title="Signaler un incident"
        style={{
          position: "fixed", bottom: 96, right: 24, zIndex: 90,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,61,0,.2)",
          border: "1px solid rgba(255,61,0,.5)",
          color: "#FF3D00", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px rgba(255,61,0,.3)",
          transition: "all .2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(255,61,0,.35)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(255,61,0,.2)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        ⚠️
      </button>

      {/* ── ARIA flottant (bas droite) — composant existant ── */}
      <AIAssistant />

      {/* ── Modales ── */}
      {showDestModal && (
        <DestinationModal
          onClose={() => setShowDestModal(false)}
          onConfirm={handleDestConfirm}
        />
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
