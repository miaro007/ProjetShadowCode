"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { COLORS } from "@/lib/dashboard-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════════════
// SIDEPANEL – 5 Fonctionnalités Hackathon (TEMPS RÉEL)
// Palette : #0A0E1A · #00E5A0 · #FFB800  (+ rouge pour alertes)
// ═══════════════════════════════════════════════════════════════════

type Tab = "multimodal" | "vocal" | "meteo" | "confiance" | "escape";

// ── Types ──
interface ItineraryStep {
  type: string;
  label: string;
  from: string;
  to: string;
  duration: string;
  durationMin: number;
  status: "dense" | "fluide" | "ok" | "critique";
  icon: "bus" | "walk";
}

interface Prediction {
  jour: string;
  heure: string;
  niveau: number;
  label: string;
  detail: string;
}

interface LigneData {
  num: string;
  trajet: string;
  fiabilite: number;
  votes: number;
  etat: "fluide" | "dense" | "critique";
  color: string;
}

interface EscapeCongestionPoint {
  km: number;
  level: number;
  label: string;
}

// ── Helpers ──
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function timeAgo(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "à l'instant";
  if (diff < 60) return `il y a ${diff}s`;
  return `il y a ${Math.floor(diff / 60)}min`;
}

function getStatusFromDuration(durMin: number, baseDurMin: number): "fluide" | "dense" | "ok" | "critique" {
  const ratio = durMin / baseDurMin;
  if (ratio <= 1.1) return "fluide";
  if (ratio <= 1.5) return "dense";
  if (ratio <= 2.0) return "dense";
  return "critique";
}

function getLabelFromNiveau(n: number): string {
  if (n >= 85) return "SATURÉ";
  if (n >= 65) return "DENSE";
  if (n >= 40) return "MODÉRÉ";
  return "FLUIDE";
}

function getEtatFromFiabilite(f: number): "fluide" | "dense" | "critique" {
  if (f >= 70) return "fluide";
  if (f >= 40) return "dense";
  return "critique";
}

function getColorFromEtat(etat: string): string {
  if (etat === "fluide") return "#00E5A0";
  if (etat === "dense") return "#FFB800";
  return "#FF3D00";
}

// ── Données initiales ──
const INITIAL_ITINERARY: ItineraryStep[] = [
  { type: "taxibe", label: "Ligne 140", from: "Ivandry", to: "Anosizato", duration: "12 min", durationMin: 12, status: "dense", icon: "bus" },
  { type: "walk", label: "Mandeha tongotra", from: "Anosizato", to: "Pont Ampasika", duration: "8 min (800m)", durationMin: 8, status: "ok", icon: "walk" },
  { type: "taxibe", label: "Ligne 194", from: "Pont Ampasika", to: "Analakely", duration: "9 min", durationMin: 9, status: "fluide", icon: "bus" },
];

const INITIAL_PREDICTIONS: Prediction[] = [
  { jour: "Dimanche (aujourd'hui)", heure: "15h–19h", niveau: 60, label: "MODÉRÉ", detail: "Retour de week-end" },
  { jour: "Lundi matin", heure: "07h–09h", niveau: 85, label: "SATURÉ", detail: "Rentrée scolaire + marché Anosibe" },
  { jour: "Lundi soir", heure: "17h–19h", niveau: 90, label: "SATURÉ", detail: "Heure de pointe" },
];

const INITIAL_LIGNES: LigneData[] = [
  { num: "140", trajet: "Ivandry → Analakely", fiabilite: 87, votes: 214, etat: "fluide", color: "#00E5A0" },
  { num: "194", trajet: "Ampasika → Soarano", fiabilite: 62, votes: 98, etat: "dense", color: "#FFB800" },
  { num: "167", trajet: "Anosizato → 67ha", fiabilite: 31, votes: 47, etat: "critique", color: "#FF3D00" },
  { num: "119", trajet: "Ambohipo → Analakely", fiabilite: 79, votes: 133, etat: "fluide", color: "#00E5A0" },
];

const INITIAL_ESCAPE_CONGESTION: EscapeCongestionPoint[] = [
  { km: 0, level: 20, label: "Votre position" },
  { km: 0.3, level: 45, label: "" },
  { km: 0.6, level: 72, label: "" },
  { km: 1.0, level: 95, label: "Zone rouge" },
  { km: 1.4, level: 98, label: "" },
  { km: 1.8, level: 92, label: "" },
  { km: 2.2, level: 85, label: "Fin zone rouge" },
  { km: 2.6, level: 40, label: "" },
  { km: 3.0, level: 15, label: "Axe fluide" },
];

const ESCAPE_STEPS = [
  { action: "Descendre", detail: "Prochain arrêt dans 150m — Anosizato Marché", color: "#FF3D00", step: "01" },
  { action: "Marcher 800m", detail: "Via Rue Razafindrakoto vers l'axe parallèle", color: "#FFB800", step: "02" },
  { action: "Prendre Ligne 194", detail: "Axe fluide — Analakely en 12 min", color: "#00E5A0", step: "03" },
];

// ═══════════════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════════════
function IconBus({ color = "currentColor", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function IconWalk({ color = "currentColor", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/>
      <path d="m13 10-3 3 2 5-4 2"/>
      <path d="m13 10 2 3 4-2"/>
      <path d="m9 20 2-3"/>
    </svg>
  );
}

function IconMic({ color = "currentColor", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function IconStop({ color = "currentColor", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <rect x="5" y="5" width="14" height="14" rx="2"/>
    </svg>
  );
}

function IconThumbUp({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );
}

function IconThumbDown({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  );
}

function IconAlert({ color = "currentColor", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconRoute({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/>
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
      <circle cx="18" cy="5" r="3"/>
    </svg>
  );
}

function IconRadar({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function IconStar({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function IconEscape({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}

function IconAriaAI({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="rgba(0,229,160,0.12)" stroke="#00E5A0" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#00E5A0"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIVE BADGE
// ═══════════════════════════════════════════════════════════════════
function LiveBadge({ lastUpdate }: { lastUpdate: Date }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const i = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="live-badge">
      <span className="live-dot" />
      <span className="live-text">LIVE</span>
      <span className="live-ago">{timeAgo(lastUpdate)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function SidePanel({
  onSignalIncident,
  simulationMode = false,
  onToggleSimulation
}: {
  onSignalIncident?: () => void;
  simulationMode?: boolean;
  onToggleSimulation?: () => void;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("multimodal");
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing" | "done">("idle");
  const [votes, setVotes] = useState<Record<string, "up" | "down" | null>>({});
  const [escapeActive, setEscapeActive] = useState(false);
  const [escapeAnalyzing, setEscapeAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Real-time state
  const [itinerarySteps, setItinerarySteps] = useState<ItineraryStep[]>(INITIAL_ITINERARY);
  const [totalDuration, setTotalDuration] = useState(29);
  const [predictions, setPredictions] = useState<Prediction[]>(INITIAL_PREDICTIONS);
  const [lignes, setLignes] = useState<LigneData[]>(INITIAL_LIGNES);
  const [escapeCongestion, setEscapeCongestion] = useState<EscapeCongestionPoint[]>(INITIAL_ESCAPE_CONGESTION);
  const [escapeWaitTime, setEscapeWaitTime] = useState(45);

  const [itineraryLastUpdate, setItineraryLastUpdate] = useState(new Date());
  const [predictionLastUpdate, setPredictionLastUpdate] = useState(new Date());
  const [lignesLastUpdate, setLignesLastUpdate] = useState(new Date());
  const [escapeLastUpdate, setEscapeLastUpdate] = useState(new Date());

  // Real-time intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setItinerarySteps(prev => {
        const updated = prev.map(step => {
          const baseDur = step.type === "walk" ? 8 : step.durationMin;
          const variance = step.type === "walk" ? 0.05 : 0.15;
          const delta = (Math.random() - 0.5) * 2 * variance * baseDur;
          const newDur = clamp(Math.round(baseDur + delta), Math.max(3, baseDur - 5), baseDur + 10);
          const newStatus = step.type === "walk"
            ? "ok" as const
            : getStatusFromDuration(newDur, baseDur);
          const durStr = step.type === "walk" ? `${newDur} min (800m)` : `${newDur} min`;
          return { ...step, duration: durStr, durationMin: newDur, status: newStatus };
        });
        const total = updated.reduce((sum, s) => sum + s.durationMin, 0);
        setTotalDuration(total);
        return updated;
      });
      setItineraryLastUpdate(new Date());
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPredictions(prev => prev.map(p => {
        const delta = Math.round((Math.random() - 0.5) * 8);
        const newNiveau = clamp(p.niveau + delta, 15, 99);
        return { ...p, niveau: newNiveau, label: getLabelFromNiveau(newNiveau) };
      }));
      setPredictionLastUpdate(new Date());
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLignes(prev => prev.map(l => {
        const fiabDelta = Math.round((Math.random() - 0.5) * 6);
        const voteDelta = Math.random() > 0.6 ? Math.round(Math.random() * 3) : 0;
        const newFiab = clamp(l.fiabilite + fiabDelta, 10, 99);
        const newVotes = l.votes + voteDelta;
        const newEtat = getEtatFromFiabilite(newFiab);
        const newColor = getColorFromEtat(newEtat);
        return { ...l, fiabilite: newFiab, votes: newVotes, etat: newEtat, color: newColor };
      }));
      setLignesLastUpdate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!escapeActive) return;
    const interval = setInterval(() => {
      setEscapeCongestion(prev => prev.map(p => ({
        ...p,
        level: clamp(p.level + Math.round((Math.random() - 0.5) * 10), 5, 100)
      })));
      setEscapeWaitTime(prev => clamp(prev + Math.round((Math.random() - 0.5) * 4), 20, 80));
      setEscapeLastUpdate(new Date());
    }, 9000);
    return () => clearInterval(interval);
  }, [escapeActive]);

  // Recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecordingStatus("processing");
        await new Promise(r => setTimeout(r, 1200));
        setTranscription("Gros bouchon à Anosizato, ça ne bouge plus !");
        setRecordingStatus("done");
      };
      mr.start();
      setIsRecording(true);
      setRecordingStatus("recording");
    } catch {
      setTranscription("Microphone non disponible");
      setRecordingStatus("done");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleVote = useCallback((num: string, dir: "up" | "down") => {
    setVotes(prev => ({ ...prev, [num]: prev[num] === dir ? null : dir }));
    setLignes(prev => prev.map(l => {
      if (l.num !== num) return l;
      const delta = dir === "up" ? 1 : -1;
      const newFiab = clamp(l.fiabilite + delta * 2, 10, 99);
      return { ...l, fiabilite: newFiab, votes: l.votes + 1, etat: getEtatFromFiabilite(newFiab), color: getColorFromEtat(getEtatFromFiabilite(newFiab)) };
    }));
    onSignalIncident?.();
  }, [onSignalIncident]);

  const triggerEscapeAnalysis = useCallback(() => {
    setEscapeActive(false);
    setEscapeAnalyzing(true);
    setTimeout(() => {
      setEscapeAnalyzing(false);
      setEscapeActive(true);
      setEscapeLastUpdate(new Date());
    }, 2000);
  }, []);

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "multimodal", icon: <IconRoute />, label: "Itinéraire" },
    { id: "vocal",      icon: <IconMic size={14} />, label: "Vocal" },
    { id: "meteo",      icon: <IconRadar />, label: "Prédiction" },
    { id: "confiance",  icon: <IconStar />, label: "Confiance" },
    { id: "escape",     icon: <IconEscape />, label: "Secours" },
  ];

  return (
    <aside className="panel">
      {/* Simulation toggle */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={onToggleSimulation}
          className={`sim-btn ${simulationMode ? "active" : ""}`}
        >
          {simulationMode ? "Arrêter la simulation" : "Lancer la simulation"}
        </button>
      </div>

      {/* Onglets */}
      <div className="tabs">
        {TABS.map(tData => (
          <button
            key={tData.id}
            className={`tab ${tab === tData.id ? "active" : ""}`}
            onClick={() => setTab(tData.id)}
            title={tData.label}
          >
            <span className="tab-icon">{tData.icon}</span>
            <span className="tab-label">{tData.label}</span>
          </button>
        ))}
      </div>

      {/* ── 1. ITINÉRAIRE MULTIMODAL ── */}
      {tab === "multimodal" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("route.title")}</h2>
            <span className="section-sub">{t("route.sub")}</span>
          </div>

          <LiveBadge lastUpdate={itineraryLastUpdate} />

          <div className="alert-banner">
            <IconAlert color="#FFB800" size={14} />
            <span>{t("route.alert")}</span>
          </div>

          <div className="steps">
            {itinerarySteps.map((step, i) => (
              <div key={i} className="step">
                <div className="step-icon-wrap">
                  <div className={`step-icon step-icon--${step.status}`}>
                    {step.icon === "bus"
                      ? <IconBus color={step.status === "fluide" || step.status === "ok" ? "#00E5A0" : step.status === "dense" ? "#FFB800" : "#FF3D00"} size={14} />
                      : <IconWalk color="rgba(255,255,255,0.6)" size={14} />
                    }
                  </div>
                  {i < itinerarySteps.length - 1 && <div className="step-line" />}
                </div>
                <div className="step-body">
                  <div className="step-top">
                    <span className="step-label">{step.type === 'walk' ? t("route.walk") : step.label}</span>
                    <span className={`step-badge status-${step.status}`}>{step.status}</span>
                  </div>
                  <div className="step-route">{step.from} → {step.to}</div>
                  <div className="step-duration realtime-value">{step.duration}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="total-bar">
            <span>{t("route.total")}</span>
            <strong className="realtime-value">{totalDuration} min</strong>
          </div>

          <button className="cta-btn" onClick={() => window.dispatchEvent(new CustomEvent("aria-open", { detail: { message: "ARIA, donne-moi le meilleur itinéraire multimodal depuis Ivandry vers Analakely en combinant Taxi-be et marche à pied. Il y a un bouchon à Anosizato." } }))}>
            {t("route.ask")}
          </button>
        </div>
      )}

      {/* ── 2. SIGNALEMENT VOCAL ── */}
      {tab === "vocal" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("voice.title")}</h2>
            <span className="section-sub">{t("voice.sub")}</span>
          </div>

          <div className="voice-center">
            <button
              className={`mic-btn ${isRecording ? "recording" : ""}`}
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
            >
              {isRecording
                ? <IconStop color="#FF3D00" size={22} />
                : <IconMic color="#00E5A0" size={26} />
              }
              <span className="mic-label">
                {isRecording ? t("voice.release") : t("voice.hold")}
              </span>
            </button>
            {isRecording && (
              <div className="waves">
                <div className="wave" />
                <div className="wave" />
                <div className="wave" />
              </div>
            )}
          </div>

          <div className="examples">
            <p className="example-title">{t("voice.examples")}</p>
            <p className="example">&ldquo;Gros bouchon à Anosizato, ça ne bouge plus !&rdquo;</p>
            <p className="example">&ldquo;Misy hery be eto Ampasika.&rdquo;</p>
          </div>

          {recordingStatus === "processing" && (
            <div className="processing">
              <div className="spinner-sm" /> {t("voice.analyze")}
            </div>
          )}

          {recordingStatus === "done" && transcription && (
            <div className="transcription-box">
              <div className="trans-label">{t("voice.transcription")}</div>
              <div className="trans-text">&ldquo;{transcription}&rdquo;</div>
              <button className="confirm-btn" onClick={() => { setTranscription(""); setRecordingStatus("idle"); onSignalIncident?.(); }}>
                {t("voice.confirm")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. MÉTÉO TRAFIC ── */}
      {tab === "meteo" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("meteo.title")}</h2>
            <span className="section-sub">{t("meteo.sub")}</span>
          </div>

          <LiveBadge lastUpdate={predictionLastUpdate} />

          <div className="aria-prediction">
            <div className="aria-avatar"><IconAriaAI size={20} /></div>
            <div className="aria-bubble">{t("meteo.aria")}</div>
          </div>

          <div className="predictions">
            {predictions.map((p, i) => (
              <div key={i} className="pred-card">
                <div className="pred-top">
                  <div>
                    <div className="pred-jour">{p.jour}</div>
                    <div className="pred-heure">{p.heure}</div>
                  </div>
                  <div className={`pred-badge niveau-${p.niveau >= 80 ? 'high' : p.niveau >= 50 ? 'mid' : 'low'}`}>
                    {p.label}
                  </div>
                </div>
                <div className="pred-bar-wrap">
                  <div className="pred-bar" style={{ width: `${p.niveau}%`, background: p.niveau >= 80 ? '#FF3D00' : p.niveau >= 50 ? '#FFB800' : '#00E5A0' }} />
                </div>
                <div className="pred-detail">{p.detail}</div>
                <div className="pred-niveau-value">{p.niveau}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. CONFIANCE LIGNES ── */}
      {tab === "confiance" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("trust.title")}</h2>
            <span className="section-sub">{t("trust.sub")}</span>
          </div>

          <LiveBadge lastUpdate={lignesLastUpdate} />

          <div className="lignes">
            {lignes.map((l) => (
              <div key={l.num} className="ligne-card">
                <div className="ligne-top">
                  <div className="ligne-num" style={{ background: `${l.color}1A`, color: l.color }}>
                    L.{l.num}
                  </div>
                  <div className="ligne-info">
                    <div className="ligne-trajet">{l.trajet}</div>
                    <div className="ligne-votes realtime-value">{l.votes} {t("trust.votes")}</div>
                  </div>
                  <div className={`ligne-etat etat-${l.etat}`}>{l.etat}</div>
                </div>
                <div className="trust-bar-wrap">
                  <div className="trust-bar" style={{ width: `${l.fiabilite}%`, background: l.color }} />
                </div>
                <div className="vote-row">
                  <span className="trust-pct realtime-value" style={{ color: l.color }}>{l.fiabilite}% {t("trust.reliable")}</span>
                  <div className="vote-btns">
                    <button
                      className={`vote-btn up ${votes[l.num] === "up" ? "active" : ""}`}
                      onClick={() => handleVote(l.num, "up")}
                      title="Fiable"
                    >
                      <IconThumbUp color={votes[l.num] === "up" ? "#00E5A0" : "rgba(255,255,255,0.5)"} size={13} />
                    </button>
                    <button
                      className={`vote-btn down ${votes[l.num] === "down" ? "active" : ""}`}
                      onClick={() => handleVote(l.num, "down")}
                      title="Peu fiable"
                    >
                      <IconThumbDown color={votes[l.num] === "down" ? "#FF3D00" : "rgba(255,255,255,0.5)"} size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. SORTIE DE SECOURS ── */}
      {tab === "escape" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("escape.title")}</h2>
            <span className="section-sub">{t("escape.sub")}</span>
          </div>

          {!escapeActive && !escapeAnalyzing && (
            <div className="escape-intro">
              <div className="escape-intro-icon">
                <IconEscape color="#FF3D00" size={36} />
              </div>
              <p>{t("escape.intro")}</p>
              <button className="escape-scan-btn" onClick={triggerEscapeAnalysis}>
                {t("escape.scan")}
              </button>
            </div>
          )}

          {escapeAnalyzing && (
            <div className="escape-analyzing">
              <div className="radar-wrap">
                <div className="radar" />
                <div className="radar-dot" />
              </div>
              <p>{t("escape.scanning")}</p>
              <div className="scan-bars">
                <div className="scan-bar" style={{ animationDelay: '0s' }} />
                <div className="scan-bar" style={{ animationDelay: '0.2s' }} />
                <div className="scan-bar" style={{ animationDelay: '0.4s' }} />
                <div className="scan-bar" style={{ animationDelay: '0.6s' }} />
                <div className="scan-bar" style={{ animationDelay: '0.8s' }} />
              </div>
            </div>
          )}

          {escapeActive && (
            <>
              <LiveBadge lastUpdate={escapeLastUpdate} />

              <div className="escape-alert">
                <IconAlert color="#FF3D00" size={18} />
                <div>
                  <strong>{t("escape.blocked")}</strong>
                  <p>{t("escape.wait")} <b className="realtime-value" style={{ color: '#FF3D00' }}>~{escapeWaitTime} min</b></p>
                </div>
              </div>

              <div className="congestion-graph">
                <div className="graph-title">{t("escape.graph")}</div>
                <div className="graph-bars">
                  {escapeCongestion.map((d, i) => (
                    <div key={i} className="graph-col">
                      <div
                        className="graph-bar"
                        style={{
                          height: `${d.level}%`,
                          background: d.level >= 80 ? '#FF3D00' : d.level >= 50 ? '#FFB800' : '#00E5A0',
                        }}
                      />
                      <span className="graph-km">{d.km}km</span>
                    </div>
                  ))}
                </div>
                <div className="graph-legend">
                  <span className="leg"><span className="leg-dot" style={{ background: '#00E5A0' }} /> {t("escape.fluid")}</span>
                  <span className="leg"><span className="leg-dot" style={{ background: '#FFB800' }} /> {t("escape.dense")}</span>
                  <span className="leg"><span className="leg-dot" style={{ background: '#FF3D00' }} /> {t("escape.blocked_short")}</span>
                </div>
              </div>

              <div className="aria-prediction">
                <div className="aria-avatar"><IconAriaAI size={20} /></div>
                <div className="aria-bubble">{t("escape.aria")}</div>
              </div>

              <div className="escape-steps">
                {ESCAPE_STEPS.map((s, i) => (
                  <div key={i} className="escape-step">
                    <div className="escape-step-num" style={{ background: `${s.color}1A`, color: s.color }}>
                      {s.step}
                    </div>
                    <div className="escape-step-body">
                      <div className="escape-step-action">{s.action}</div>
                      <div className="escape-step-detail">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-bar">
                <span>{t("escape.gain")}</span>
                <strong style={{ color: '#00E5A0' }}>{t("escape.gain_val")}</strong>
              </div>

              <button className="cta-btn" onClick={() => window.dispatchEvent(new CustomEvent("aria-open", { detail: { message: "ARIA, mon bus est bloqué à Anosizato depuis 10 min. Analyse ma position GPS et donne-moi la sortie de secours la plus rapide. Quel arrêt descendre, quelle route à pied, et quel autre bus prendre ?" } }))}>
                {t("escape.ask")}
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        /* ── BASE ── */
        .panel {
          display: flex; flex-direction: column;
          background: rgba(10,14,26,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
          height: 100%;
        }

        /* ── SIMULATION BTN ── */
        .sim-btn {
          width: 100%; padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.08);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .sim-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .sim-btn.active {
          background: rgba(0,229,160,0.1);
          border-color: rgba(0,229,160,0.4);
          color: #00E5A0;
          animation: pulse-sim 2.2s infinite;
        }
        @keyframes pulse-sim {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,160,0.15); }
          50% { box-shadow: 0 0 0 6px rgba(0,229,160,0); }
        }

        /* ── LIVE BADGE ── */
        .live-badge {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,61,0,0.07);
          border: 1px solid rgba(255,61,0,0.2);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 10px; font-weight: 800;
          width: fit-content;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #FF3D00;
          box-shadow: 0 0 5px #FF3D00;
          animation: live-blink 1.2s infinite;
        }
        @keyframes live-blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        .live-text { color: #FF3D00; letter-spacing: 0.1em; }
        .live-ago { color: rgba(255,255,255,0.3); font-weight: 500; }

        /* ── REALTIME ── */
        .realtime-value { transition: all 0.4s ease; }

        /* ── TABS ── */
        .tabs {
          display: grid; grid-template-columns: repeat(5, 1fr);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .tab {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; padding: 10px 4px;
          font-size: 9px; font-weight: 700;
          color: rgba(255,255,255,0.3);
          cursor: pointer; transition: all .2s;
          letter-spacing: 0.03em;
          border-bottom: 2px solid transparent;
          border: none; background: none;
        }
        .tab-icon {
          display: flex; align-items: center; justify-content: center;
          width: 20px; height: 20px;
        }
        .tab-label { font-size: 9px; }
        .tab:hover { color: rgba(255,255,255,0.6); }
        .tab.active {
          color: #00E5A0;
          border-bottom: 2px solid #00E5A0;
          background: rgba(0,229,160,0.04);
        }

        /* ── CONTENT ── */
        .content {
          flex: 1; overflow-y: auto;
          padding: 14px;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .section-header { display: flex; flex-direction: column; gap: 2px; }
        .section-title { font-size: 14px; font-weight: 800; color: #fff; margin: 0; }
        .section-sub { font-size: 11px; color: rgba(255,255,255,0.38); }

        /* ── ALERT BANNER ── */
        .alert-banner {
          display: flex; gap: 8px; align-items: flex-start;
          background: rgba(255,184,0,0.07);
          border: 1px solid rgba(255,184,0,0.22);
          border-radius: 10px; padding: 10px 12px;
          font-size: 12px; color: #FFB800;
        }

        /* ── STEPS ── */
        .steps { display: flex; flex-direction: column; }
        .step { display: flex; gap: 12px; }
        .step-icon-wrap { display: flex; flex-direction: column; align-items: center; }
        .step-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .step-line { flex: 1; width: 1px; background: rgba(255,255,255,0.07); min-height: 14px; margin: 4px auto; }
        .step-body { flex: 1; padding-bottom: 14px; }
        .step-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
        .step-label { font-size: 13px; font-weight: 700; color: #fff; }
        .step-badge {
          font-size: 9px; font-weight: 700; padding: 2px 8px;
          border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .status-fluide { background: rgba(0,229,160,0.12); color: #00E5A0; }
        .status-ok     { background: rgba(0,229,160,0.12); color: #00E5A0; }
        .status-dense  { background: rgba(255,184,0,0.12); color: #FFB800; }
        .status-critique { background: rgba(255,61,0,0.12); color: #FF3D00; }
        .step-route { font-size: 11px; color: rgba(255,255,255,0.38); }
        .step-duration { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        /* ── TOTAL BAR ── */
        .total-bar {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(0,229,160,0.06);
          border: 1px solid rgba(0,229,160,0.18);
          border-radius: 10px; padding: 10px 14px;
          font-size: 13px; color: rgba(255,255,255,0.65);
        }
        .total-bar strong { color: #00E5A0; font-size: 16px; font-weight: 800; }

        /* ── CTA BUTTON ── */
        .cta-btn {
          background: #00E5A0; color: #0A0E1A;
          border-radius: 12px; padding: 12px;
          width: 100%; font-size: 13px; font-weight: 800;
          cursor: pointer; transition: all .2s;
          letter-spacing: 0.02em; border: none;
        }
        .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,229,160,0.3); }

        /* ── VOCAL ── */
        .voice-center { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .mic-btn {
          width: 90px; height: 90px; border-radius: 50%;
          background: rgba(0,229,160,0.07);
          border: 2px solid rgba(0,229,160,0.25);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; transition: all .2s; gap: 5px;
          user-select: none;
        }
        .mic-btn.recording {
          background: rgba(255,61,0,0.12);
          border-color: rgba(255,61,0,0.5);
          animation: mic-pulse 0.8s infinite;
        }
        @keyframes mic-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,61,0,0.25); }
          50% { box-shadow: 0 0 0 14px rgba(255,61,0,0); }
        }
        .mic-label { font-size: 9px; color: rgba(255,255,255,0.4); font-weight: 700; text-align: center; letter-spacing: 0.05em; }
        .waves { display: flex; gap: 5px; align-items: center; height: 22px; }
        .wave {
          width: 3px; background: #00E5A0; border-radius: 2px;
          animation: wave-anim 0.6s infinite ease-in-out alternate;
        }
        .wave:nth-child(1) { height: 10px; animation-delay: 0s; }
        .wave:nth-child(2) { height: 20px; animation-delay: 0.2s; }
        .wave:nth-child(3) { height: 12px; animation-delay: 0.4s; }
        @keyframes wave-anim { to { height: 22px; } }

        .examples { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; }
        .example-title { font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .example { font-size: 12px; color: rgba(255,255,255,0.65); margin-bottom: 4px; font-style: italic; }

        .processing { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.5); }
        .spinner-sm {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(0,229,160,0.2);
          border-top-color: #00E5A0;
          animation: spin .7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .transcription-box {
          background: rgba(0,229,160,0.05);
          border: 1px solid rgba(0,229,160,0.18);
          border-radius: 12px; padding: 14px;
        }
        .trans-label { font-size: 10px; color: #00E5A0; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .trans-text { font-size: 13px; color: #fff; margin-bottom: 12px; font-style: italic; }
        .confirm-btn {
          background: #00E5A0; color: #0A0E1A;
          border-radius: 8px; padding: 8px 16px;
          font-size: 12px; font-weight: 800; cursor: pointer; width: 100%;
          transition: all .2s; border: none;
        }
        .confirm-btn:hover { opacity: 0.85; }

        /* ── MÉTÉO TRAFIC ── */
        .aria-prediction {
          display: flex; gap: 10px;
          background: rgba(0,229,160,0.04);
          border: 1px solid rgba(0,229,160,0.12);
          border-radius: 12px; padding: 12px;
        }
        .aria-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .aria-bubble { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.55; }
        .aria-bubble b { color: #00E5A0; }

        .predictions { display: flex; flex-direction: column; gap: 10px; }
        .pred-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px;
          position: relative;
        }
        .pred-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .pred-jour { font-size: 12px; font-weight: 700; color: #fff; }
        .pred-heure { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }
        .pred-badge {
          font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 999px;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .niveau-high { background: rgba(255,61,0,0.12); color: #FF3D00; }
        .niveau-mid  { background: rgba(255,184,0,0.12); color: #FFB800; }
        .niveau-low  { background: rgba(0,229,160,0.12); color: #00E5A0; }
        .pred-bar-wrap { height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; margin-bottom: 8px; overflow: hidden; }
        .pred-bar { height: 100%; border-radius: 2px; transition: width .6s ease, background .6s ease; }
        .pred-detail { font-size: 11px; color: rgba(255,255,255,0.38); }
        .pred-niveau-value {
          position: absolute; top: 12px; right: 12px;
          font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.2);
        }

        /* ── CONFIANCE LIGNES ── */
        .lignes { display: flex; flex-direction: column; gap: 10px; }
        .ligne-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px;
          transition: border-color .2s;
        }
        .ligne-card:hover { border-color: rgba(255,255,255,0.1); }
        .ligne-top { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }
        .ligne-num {
          padding: 4px 9px; border-radius: 8px;
          font-size: 12px; font-weight: 900; white-space: nowrap; flex-shrink: 0;
          letter-spacing: 0.03em;
        }
        .ligne-info { flex: 1; }
        .ligne-trajet { font-size: 12px; font-weight: 600; color: #fff; }
        .ligne-votes { font-size: 10px; color: rgba(255,255,255,0.38); margin-top: 2px; }
        .ligne-etat {
          font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 999px;
          white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .etat-fluide   { background: rgba(0,229,160,0.12); color: #00E5A0; }
        .etat-dense    { background: rgba(255,184,0,0.12); color: #FFB800; }
        .etat-critique { background: rgba(255,61,0,0.12); color: #FF3D00; }
        .trust-bar-wrap { height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; margin-bottom: 8px; overflow: hidden; }
        .trust-bar { height: 100%; border-radius: 2px; transition: width .6s ease, background .6s ease; }
        .vote-row { display: flex; justify-content: space-between; align-items: center; }
        .trust-pct { font-size: 11px; font-weight: 700; }
        .vote-btns { display: flex; gap: 5px; }
        .vote-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; transition: all .2s;
          display: flex; align-items: center; justify-content: center;
        }
        .vote-btn.up.active  { background: rgba(0,229,160,0.12); border-color: rgba(0,229,160,0.3); }
        .vote-btn.down.active { background: rgba(255,61,0,0.12); border-color: rgba(255,61,0,0.3); }
        .vote-btn:hover { transform: scale(1.12); }

        /* ── ESCAPE ── */
        .escape-intro {
          text-align: center;
          background: rgba(255,61,0,0.04);
          border: 1px solid rgba(255,61,0,0.14);
          border-radius: 14px; padding: 24px 16px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .escape-intro-icon { opacity: 0.9; }
        .escape-intro p { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.6; margin: 0; }
        .escape-scan-btn {
          background: #FF3D00; color: #fff;
          border-radius: 12px; padding: 11px 24px;
          font-size: 13px; font-weight: 800; cursor: pointer;
          transition: all .2s; letter-spacing: 0.03em; border: none;
          animation: scan-glow 2.2s infinite;
        }
        .escape-scan-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        @keyframes scan-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,61,0,0.25); }
          50% { box-shadow: 0 0 0 8px rgba(255,61,0,0); }
        }

        .escape-analyzing {
          text-align: center; padding: 20px 0;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
        }
        .escape-analyzing p { font-size: 12px; color: rgba(255,255,255,0.45); }
        .radar-wrap { width: 72px; height: 72px; position: relative; }
        .radar {
          width: 100%; height: 100%; border-radius: 50%;
          border: 1.5px solid rgba(255,61,0,0.2); position: relative;
        }
        .radar::after {
          content: ''; position: absolute; top: 50%; left: 50%;
          width: 50%; height: 1.5px; background: linear-gradient(90deg, #FF3D00, transparent);
          transform-origin: left center;
          animation: radar-sweep 1.5s linear infinite;
        }
        @keyframes radar-sweep { to { transform: rotate(360deg); } }
        .radar-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #FF3D00;
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          box-shadow: 0 0 8px #FF3D00;
        }
        .scan-bars { display: flex; gap: 4px; align-items: flex-end; height: 18px; }
        .scan-bar {
          width: 3px; background: #FF3D00; border-radius: 2px;
          animation: scan-wave 0.8s ease-in-out infinite alternate;
        }
        @keyframes scan-wave {
          from { height: 4px; opacity: 0.25; }
          to { height: 18px; opacity: 1; }
        }

        .escape-alert {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(255,61,0,0.07);
          border: 1px solid rgba(255,61,0,0.25);
          border-radius: 12px; padding: 12px;
          animation: alert-flash 2.2s ease-in-out infinite;
        }
        @keyframes alert-flash {
          0%,100% { border-color: rgba(255,61,0,0.25); }
          50% { border-color: rgba(255,61,0,0.5); }
        }
        .escape-alert strong { font-size: 12px; color: #FF3D00; display: block; margin-bottom: 3px; }
        .escape-alert p { font-size: 11px; color: rgba(255,255,255,0.55); margin: 0; }

        /* Congestion graph */
        .congestion-graph {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px;
        }
        .graph-title {
          font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4);
          margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .graph-bars { display: flex; gap: 3px; align-items: flex-end; height: 70px; }
        .graph-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
        .graph-bar { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.6s ease, background 0.6s ease; }
        .graph-km { font-size: 7px; color: rgba(255,255,255,0.25); }
        .graph-legend { display: flex; gap: 12px; margin-top: 8px; justify-content: center; }
        .leg { font-size: 9px; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 4px; }
        .leg-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .escape-steps { display: flex; flex-direction: column; gap: 7px; }
        .escape-step {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 10px;
        }
        .escape-step-num {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 900; flex-shrink: 0; letter-spacing: 0;
        }
        .escape-step-body { flex: 1; }
        .escape-step-action { font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .escape-step-detail { font-size: 11px; color: rgba(255,255,255,0.4); }
      `}</style>

      <style jsx global>{`
        /* ── LIGHT THEME OVERRIDES ── */
        .light-theme .panel {
          background: rgba(245,247,250,0.95);
          border-color: rgba(0,0,0,0.08);
        }
        .light-theme .sim-btn {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.08);
          color: rgba(0,0,0,0.65);
        }
        .light-theme .sim-btn:hover { background: rgba(0,0,0,0.07); color: #0A0E1A; }
        .light-theme .sim-btn.active { background: rgba(0,122,85,0.08); border-color: rgba(0,122,85,0.35); color: #007A55; }
        .light-theme .tabs { border-bottom-color: rgba(0,0,0,0.07); }
        .light-theme .tab { color: rgba(0,0,0,0.3); }
        .light-theme .tab:hover { color: rgba(0,0,0,0.6); }
        .light-theme .tab.active { color: #007A55; border-bottom-color: #007A55; background: rgba(0,122,85,0.04); }
        .light-theme .section-title { color: #0A0E1A; }
        .light-theme .section-sub { color: rgba(0,0,0,0.4); }
        .light-theme .pred-jour { color: #0A0E1A; }
        .light-theme .pred-heure { color: rgba(0,0,0,0.4); }
        .light-theme .pred-detail { color: rgba(0,0,0,0.4); }
        .light-theme .ligne-trajet { color: #0A0E1A; }
        .light-theme .ligne-votes { color: rgba(0,0,0,0.4); }
        .light-theme .trans-text { color: #0A0E1A; }
        .light-theme .escape-step-action { color: #0A0E1A; }
        .light-theme .escape-step-detail { color: rgba(0,0,0,0.4); }
        .light-theme .aria-bubble { color: rgba(0,0,0,0.65); }
        .light-theme .example { color: rgba(0,0,0,0.6); }
        .light-theme .example-title { color: rgba(0,0,0,0.45); }
        .light-theme .mic-label { color: rgba(0,0,0,0.45); }
        .light-theme .processing { color: rgba(0,0,0,0.5); }
        .light-theme .live-ago { color: rgba(0,0,0,0.35); }
        .light-theme .step-route { color: rgba(0,0,0,0.4); }
        .light-theme .step-duration { color: rgba(0,0,0,0.5); }
        .light-theme .graph-title { color: rgba(0,0,0,0.4); }
        .light-theme .graph-km { color: rgba(0,0,0,0.3); }
        .light-theme .leg { color: rgba(0,0,0,0.4); }
        .light-theme .pred-niveau-value { color: rgba(0,0,0,0.2); }
        .light-theme .pred-card,
        .light-theme .ligne-card,
        .light-theme .escape-step,
        .light-theme .congestion-graph,
        .light-theme .examples {
          background: #fff;
          border-color: rgba(0,0,0,0.08);
        }
        .light-theme .total-bar {
          background: rgba(0,122,85,0.06);
          border-color: rgba(0,122,85,0.18);
          color: rgba(0,0,0,0.65);
        }
        .light-theme .total-bar strong { color: #007A55; }
        .light-theme .cta-btn { background: #007A55; }
        .light-theme .confirm-btn { background: #007A55; }
        .light-theme .aria-prediction {
          background: rgba(0,122,85,0.04);
          border-color: rgba(0,122,85,0.12);
        }
        .light-theme .alert-banner { background: rgba(255,184,0,0.07); border-color: rgba(255,184,0,0.2); }
        .light-theme .transcription-box { background: rgba(0,122,85,0.05); border-color: rgba(0,122,85,0.18); }
        .light-theme .trans-label { color: #007A55; }
        .light-theme .escape-intro { background: rgba(255,61,0,0.04); border-color: rgba(255,61,0,0.12); }
        .light-theme .escape-intro p { color: rgba(0,0,0,0.55); }
        .light-theme .escape-analyzing p { color: rgba(0,0,0,0.45); }
        .light-theme .escape-alert p { color: rgba(0,0,0,0.55); }
        .light-theme .mic-btn {
          background: rgba(0,122,85,0.06);
          border-color: rgba(0,122,85,0.22);
        }
        .light-theme .trust-bar-wrap,
        .light-theme .pred-bar-wrap { background: rgba(0,0,0,0.08); }
        .light-theme .vote-btn {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.08);
        }
        .light-theme .vote-btn.up.active  { background: rgba(0,122,85,0.1); border-color: rgba(0,122,85,0.3); }
        .light-theme .vote-btn.down.active { background: rgba(255,61,0,0.1); border-color: rgba(255,61,0,0.3); }
        .light-theme .step-icon { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.07); }
        .light-theme .step-line { background: rgba(0,0,0,0.08); }
        .light-theme .step-label { color: #0A0E1A; }
      `}</style>
    </aside>
  );
}
