"use client";

import { useState, useRef, useCallback } from "react";
import { COLORS } from "@/lib/dashboard-data";
import { useLanguage } from "@/contexts/LanguageContext";

// ═══════════════════════════════════════════════════════════════════
// 🏆 SIDEPANEL – 5 Fonctionnalités Phares Hackathon
// ═══════════════════════════════════════════════════════════════════

type Tab = "multimodal" | "vocal" | "meteo" | "confiance" | "escape";

// ── Données Sortie de Secours ──
const ESCAPE_CONGESTION_DATA = [
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
  { icon: "🚨", action: "Descendre", detail: "Prochain arrêt dans 150m (Anosizato Marché)", color: "#FF3D00" },
  { icon: "🚶", action: "Marcher 800m", detail: "Vers l'axe parallèle via Rue Razafindrakoto", color: "#FFB800" },
  { icon: "🚌", action: "Prendre Ligne 194", detail: "Axe fluide → Analakely en 12 min", color: "#00E5A0" },
];

// ── Données Mockées ──
const ITINERARY_STEPS = [
  { type: "taxibe", label: "Ligne 140", from: "Ivandry", to: "Anosizato", duration: "12 min", status: "dense", icon: "🚌" },
  { type: "walk", label: "Mandeha tongotra", from: "Anosizato", to: "Pont Ampasika", duration: "8 min (800m)", status: "ok", icon: "🚶" },
  { type: "taxibe", label: "Ligne 194", from: "Pont Ampasika", to: "Analakely", duration: "9 min", status: "fluide", icon: "🚌" },
];

const PREDICTIONS = [
  { jour: "Vendredi (demain)", heure: "15h–19h", niveau: 95, label: "SATURÉ", detail: "Fin de mois fonctionnaires + pluie probable" },
  { jour: "Lundi matin", heure: "07h–09h", niveau: 75, label: "DENSE", detail: "Rentrée scolaire + marché Anosibe" },
  { jour: "Mercredi soir", heure: "17h–19h", niveau: 55, label: "MODÉRÉ", detail: "Trafic normal" },
];

const LIGNES = [
  { num: "140", trajet: "Ivandry → Analakely", fiabilite: 87, votes: 214, etat: "fluide", color: "#00E5A0" },
  { num: "194", trajet: "Ampasika → Soarano", fiabilite: 62, votes: 98, etat: "dense", color: "#FFB800" },
  { num: "167", trajet: "Anosizato → 67ha", fiabilite: 31, votes: 47, etat: "critique", color: "#FF3D00" },
  { num: "119", trajet: "Ambohipo → Analakely", fiabilite: 79, votes: 133, etat: "fluide", color: "#00E5A0" },
];

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

  // ── Enregistrement Vocal ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        setRecordingStatus("processing");
        setTimeout(() => {
          setTranscription("Gros embouteillage à Ampasika, ça ne bouge plus !");
          setRecordingStatus("done");
        }, 1500);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordingStatus("recording");
    } catch {
      setTranscription("Microphone non disponible.");
      setRecordingStatus("done");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleVote = (ligneNum: string, dir: "up" | "down") => {
    setVotes(prev => ({ ...prev, [ligneNum]: prev[ligneNum] === dir ? null : dir }));
  };

  const triggerEscapeAnalysis = useCallback(() => {
    setEscapeAnalyzing(true);
    setEscapeActive(false);
    setTimeout(() => {
      setEscapeAnalyzing(false);
      setEscapeActive(true);
    }, 2000);
  }, []);

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "multimodal", icon: "🔀", label: "Itinéraire" },
    { id: "vocal", icon: "🎙️", label: "Vocal" },
    { id: "meteo", icon: "🔮", label: "Prédiction" },
    { id: "confiance", icon: "⭐", label: "Confiance" },
    { id: "escape", icon: "🚨", label: "Secours" },
  ];

  return (
    <aside className="panel">
      {/* Bouton Simulation Jury */}
      <div style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={onToggleSimulation}
          className={`sim-btn ${simulationMode ? "active" : ""}`}
        >
          {simulationMode ? t("sim.stop") : t("sim.start")}
        </button>
      </div>

      {/* Onglets */}
      <div className="tabs">
        {TABS.map(tData => (
          <button
            key={tData.id}
            className={`tab ${tab === tData.id ? "active" : ""}`}
            onClick={() => setTab(tData.id)}
          >
            <span className="tab-icon">{tData.icon}</span>
            <span className="tab-label">{t(`tab.${tData.id === "multimodal" ? "route" : tData.id === "vocal" ? "voice" : tData.id === "meteo" ? "meteo" : tData.id === "confiance" ? "trust" : "escape"}`)}</span>
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

          <div className="alert-banner">
            <span>⚠️</span>
            <span>{t("route.alert")}</span>
          </div>

          <div className="steps">
            {ITINERARY_STEPS.map((step, i) => (
              <div key={i} className="step">
                <div className="step-icon-wrap">
                  <div className="step-icon">{step.icon}</div>
                  {i < ITINERARY_STEPS.length - 1 && <div className="step-line" />}
                </div>
                <div className="step-body">
                  <div className="step-top">
                    <span className="step-label">{step.type === 'walk' ? t("route.walk") : step.label}</span>
                    <span className={`step-badge ${step.status}`}>{step.status}</span>
                  </div>
                  <div className="step-route">{step.from} → {step.to}</div>
                  <div className="step-duration">⏱ {step.duration}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="total-bar">
            <span>{t("route.total")}</span>
            <strong>29 min</strong>
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
              <div className="mic-icon">{isRecording ? "⏹" : "🎙️"}</div>
              <span className="mic-label">
                {isRecording ? t("voice.release") : t("voice.hold")}
              </span>
            </button>
            {isRecording && (
              <div className="waves">
                <div className="wave" /><div className="wave" /><div className="wave" />
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

      {/* ── 3. MÉTÉO DU TRAFIC ── */}
      {tab === "meteo" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("meteo.title")}</h2>
            <span className="section-sub">{t("meteo.sub")}</span>
          </div>

          <div className="aria-prediction">
            <div className="aria-avatar">🤖</div>
            <div className="aria-bubble">
              {t("meteo.aria")}
            </div>
          </div>

          <div className="predictions">
            {PREDICTIONS.map((p, i) => (
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
                <div className="pred-detail">📍 {p.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. STATUT DE CONFIANCE ── */}
      {tab === "confiance" && (
        <div className="content">
          <div className="section-header">
            <h2 className="section-title">{t("trust.title")}</h2>
            <span className="section-sub">{t("trust.sub")}</span>
          </div>

          <div className="lignes">
            {LIGNES.map((l) => (
              <div key={l.num} className="ligne-card">
                <div className="ligne-top">
                  <div className="ligne-num" style={{ background: `${l.color}20`, color: l.color }}>
                    L. {l.num}
                  </div>
                  <div className="ligne-info">
                    <div className="ligne-trajet">{l.trajet}</div>
                    <div className="ligne-votes">{l.votes} {t("trust.votes")}</div>
                  </div>
                  <div className={`ligne-etat etat-${l.etat}`}>{l.etat}</div>
                </div>
                <div className="trust-bar-wrap">
                  <div className="trust-bar" style={{ width: `${l.fiabilite}%`, background: l.color }} />
                </div>
                <div className="vote-row">
                  <span className="trust-pct" style={{ color: l.color }}>{l.fiabilite}% {t("trust.reliable")}</span>
                  <div className="vote-btns">
                    <button
                      className={`vote-btn up ${votes[l.num] === "up" ? "active" : ""}`}
                      onClick={() => handleVote(l.num, "up")}
                    >👍</button>
                    <button
                      className={`vote-btn down ${votes[l.num] === "down" ? "active" : ""}`}
                      onClick={() => handleVote(l.num, "down")}
                    >👎</button>
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
              <div className="escape-intro-icon">🛑</div>
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
                <div className="scan-bar" style={{animationDelay: '0s'}} />
                <div className="scan-bar" style={{animationDelay: '0.2s'}} />
                <div className="scan-bar" style={{animationDelay: '0.4s'}} />
                <div className="scan-bar" style={{animationDelay: '0.6s'}} />
                <div className="scan-bar" style={{animationDelay: '0.8s'}} />
              </div>
            </div>
          )}

          {escapeActive && (
            <>
              <div className="escape-alert">
                <span className="escape-alert-icon">⚠️</span>
                <div>
                  <strong>{t("escape.blocked")}</strong>
                  <p>{t("escape.wait")} <b style={{color: '#FF3D00'}}>~45 min</b></p>
                </div>
              </div>

              {/* Graphique de congestion */}
              <div className="congestion-graph">
                <div className="graph-title">{t("escape.graph")}</div>
                <div className="graph-bars">
                  {ESCAPE_CONGESTION_DATA.map((d, i) => (
                    <div key={i} className="graph-col">
                      <div
                        className="graph-bar"
                        style={{
                          height: `${d.level}%`,
                          background: d.level >= 80 ? '#FF3D00' : d.level >= 50 ? '#FFB800' : '#00E5A0',
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                      <span className="graph-km">{d.km}km</span>
                    </div>
                  ))}
                </div>
                <div className="graph-legend">
                  <span className="leg"><span className="leg-dot" style={{background:'#00E5A0'}} /> {t("escape.fluid")}</span>
                  <span className="leg"><span className="leg-dot" style={{background:'#FFB800'}} /> {t("escape.dense")}</span>
                  <span className="leg"><span className="leg-dot" style={{background:'#FF3D00'}} /> {t("escape.blocked_short")}</span>
                </div>
              </div>

              {/* ARIA recommendation */}
              <div className="aria-prediction">
                <div className="aria-avatar">🤖</div>
                <div className="aria-bubble">
                  {t("escape.aria")}
                </div>
              </div>

              {/* Escape steps */}
              <div className="escape-steps">
                {ESCAPE_STEPS.map((s, i) => (
                  <div key={i} className="escape-step">
                    <div className="escape-step-num" style={{background: `${s.color}20`, color: s.color}}>
                      {i + 1}
                    </div>
                    <div className="escape-step-body">
                      <div className="escape-step-action">
                        <span>{s.icon}</span> {s.action}
                      </div>
                      <div className="escape-step-detail">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-bar">
                <span>{t("escape.gain")}</span>
                <strong style={{color: '#00E5A0'}}>{t("escape.gain_val")}</strong>
              </div>

              <button className="cta-btn" onClick={() => window.dispatchEvent(new CustomEvent("aria-open", { detail: { message: "ARIA, mon bus est bloqué à Anosizato depuis 10 min. Analyse ma position GPS et donne-moi la sortie de secours la plus rapide. Quel arrêt descendre, quelle route à pied, et quel autre bus prendre ?" } }))}>
                {t("escape.ask")}
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .panel {
          display: flex; flex-direction: column;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          overflow: hidden;
          height: 100%;
        }

        /* ── SIMULATION BTN ── */
        .sim-btn {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.1);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sim-btn:hover { background: rgba(255,255,255,0.1); }
        .sim-btn.active {
          background: rgba(0,229,160,0.15);
          border-color: #00E5A0;
          color: #00E5A0;
          box-shadow: 0 0 15px rgba(0,229,160,0.2);
          animation: pulse-sim 2s infinite;
        }
        @keyframes pulse-sim {
          0%, 100% { box-shadow: 0 0 10px rgba(0,229,160,0.2); }
          50% { box-shadow: 0 0 20px rgba(0,229,160,0.5); }
        }

        /* ── TABS ── */
        .tabs {
          display: grid; grid-template-columns: repeat(5, 1fr);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .tab {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; padding: 10px 4px;
          font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35);
          cursor: pointer; transition: all .2s;
          letter-spacing: 0.02em;
          border-bottom: 2px solid transparent;
        }
        .tab-icon { font-size: 16px; }
        .tab-label { font-size: 9px; }
        .tab:hover { color: rgba(255,255,255,0.7); }
        .tab.active {
          color: ${COLORS.primary};
          border-bottom-color: ${COLORS.primary};
          background: rgba(0,229,160,0.04);
        }

        /* ── CONTENT ── */
        .content {
          flex: 1; overflow-y: auto;
          padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .section-header { display: flex; flex-direction: column; gap: 2px; }
        .section-title { font-size: 14px; font-weight: 800; color: #fff; }
        .section-sub { font-size: 11px; color: rgba(255,255,255,0.4); }

        /* ── MULTIMODAL ── */
        .alert-banner {
          display: flex; gap: 8px; align-items: flex-start;
          background: rgba(255,184,0,0.08);
          border: 1px solid rgba(255,184,0,0.25);
          border-radius: 10px; padding: 10px 12px;
          font-size: 12px; color: ${COLORS.warn};
        }
        .steps { display: flex; flex-direction: column; }
        .step { display: flex; gap: 12px; }
        .step-icon-wrap { display: flex; flex-direction: column; align-items: center; }
        .step-icon {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .step-line { flex: 1; width: 2px; background: rgba(255,255,255,0.07); min-height: 16px; margin: 4px 0; }
        .step-body { flex: 1; padding-bottom: 16px; }
        .step-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .step-label { font-size: 13px; font-weight: 700; color: #fff; }
        .step-badge {
          font-size: 10px; font-weight: 700; padding: 2px 8px;
          border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .step-badge.fluide { background: rgba(0,229,160,0.12); color: ${COLORS.primary}; }
        .step-badge.dense { background: rgba(255,184,0,0.12); color: ${COLORS.warn}; }
        .step-badge.ok { background: rgba(0,229,160,0.12); color: ${COLORS.primary}; }
        .step-route { font-size: 11px; color: rgba(255,255,255,0.45); }
        .step-duration { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }
        .total-bar {
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(0,229,160,0.07); border: 1px solid rgba(0,229,160,0.2);
          border-radius: 10px; padding: 10px 14px;
          font-size: 13px; color: rgba(255,255,255,0.7);
        }
        .total-bar strong { color: ${COLORS.primary}; font-size: 16px; font-weight: 800; }
        .cta-btn {
          background: ${COLORS.primary}; color: #0A0E1A;
          border-radius: 12px; padding: 12px; width: 100%;
          font-size: 13px; font-weight: 800; cursor: pointer;
          transition: all .2s; letter-spacing: 0.02em;
        }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,229,160,0.3); }

        /* ── VOCAL ── */
        .voice-center { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .mic-btn {
          width: 88px; height: 88px; border-radius: 50%;
          background: rgba(0,229,160,0.08);
          border: 2px solid rgba(0,229,160,0.3);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; transition: all .2s; gap: 4px;
          user-select: none;
        }
        .mic-btn.recording {
          background: rgba(255,61,0,0.15);
          border-color: #FF3D00;
          animation: mic-pulse 0.8s infinite;
        }
        @keyframes mic-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,61,0,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(255,61,0,0); }
        }
        .mic-icon { font-size: 28px; }
        .mic-label { font-size: 9px; color: rgba(255,255,255,0.4); font-weight: 700; text-align: center; }
        .waves { display: flex; gap: 6px; align-items: center; height: 24px; }
        .wave {
          width: 4px; background: ${COLORS.primary}; border-radius: 2px;
          animation: wave-anim 0.6s infinite ease-in-out alternate;
        }
        .wave:nth-child(1) { height: 12px; animation-delay: 0s; }
        .wave:nth-child(2) { height: 22px; animation-delay: 0.2s; }
        .wave:nth-child(3) { height: 14px; animation-delay: 0.4s; }
        @keyframes wave-anim { to { height: 24px; } }
        .examples { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px; }
        .example-title { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
        .example { font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 4px; font-style: italic; }
        .processing {
          display: flex; align-items: center; gap: 10px;
          font-size: 12px; color: rgba(255,255,255,0.5);
        }
        .spinner-sm {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(0,229,160,0.2);
          border-top-color: ${COLORS.primary};
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .transcription-box {
          background: rgba(0,229,160,0.06);
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 12px; padding: 14px;
        }
        .trans-label { font-size: 11px; color: ${COLORS.primary}; font-weight: 700; margin-bottom: 6px; }
        .trans-text { font-size: 13px; color: #fff; margin-bottom: 12px; font-style: italic; }
        .confirm-btn {
          background: ${COLORS.primary}; color: #0A0E1A;
          border-radius: 8px; padding: 8px 16px;
          font-size: 12px; font-weight: 800; cursor: pointer; width: 100%;
          transition: all .2s;
        }
        .confirm-btn:hover { opacity: 0.85; }

        /* ── MÉTÉO TRAFIC ── */
        .aria-prediction {
          display: flex; gap: 10px;
          background: rgba(0,229,160,0.05);
          border: 1px solid rgba(0,229,160,0.15);
          border-radius: 12px; padding: 12px;
        }
        .aria-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(0,229,160,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .aria-bubble { font-size: 12px; color: rgba(255,255,255,0.75); line-height: 1.55; }
        .aria-bubble b { color: ${COLORS.primary}; }
        .predictions { display: flex; flex-direction: column; gap: 10px; }
        .pred-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px;
        }
        .pred-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .pred-jour { font-size: 12px; font-weight: 700; color: #fff; }
        .pred-heure { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .pred-badge {
          font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; letter-spacing: 0.05em;
        }
        .pred-badge.niveau-high { background: rgba(255,61,0,0.15); color: #FF3D00; }
        .pred-badge.niveau-mid { background: rgba(255,184,0,0.15); color: ${COLORS.warn}; }
        .pred-badge.niveau-low { background: rgba(0,229,160,0.15); color: ${COLORS.primary}; }
        .pred-bar-wrap {
          height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; margin-bottom: 8px; overflow: hidden;
        }
        .pred-bar { height: 100%; border-radius: 2px; transition: width .5s ease; }
        .pred-detail { font-size: 11px; color: rgba(255,255,255,0.4); }

        /* ── CONFIANCE LIGNES ── */
        .lignes { display: flex; flex-direction: column; gap: 10px; }
        .ligne-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px;
          transition: border-color .2s;
        }
        .ligne-card:hover { border-color: rgba(255,255,255,0.12); }
        .ligne-top { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }
        .ligne-num {
          padding: 4px 10px; border-radius: 8px;
          font-size: 13px; font-weight: 900; white-space: nowrap; flex-shrink: 0;
        }
        .ligne-info { flex: 1; }
        .ligne-trajet { font-size: 12px; font-weight: 600; color: #fff; }
        .ligne-votes { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .ligne-etat { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
        .etat-fluide { background: rgba(0,229,160,0.12); color: ${COLORS.primary}; }
        .etat-dense { background: rgba(255,184,0,0.12); color: ${COLORS.warn}; }
        .etat-critique { background: rgba(255,61,0,0.12); color: #FF3D00; }
        .trust-bar-wrap {
          height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; margin-bottom: 8px; overflow: hidden;
        }
        .trust-bar { height: 100%; border-radius: 2px; transition: width .5s ease; }
        .vote-row { display: flex; justify-content: space-between; align-items: center; }
        .trust-pct { font-size: 11px; font-weight: 700; }
        .vote-btns { display: flex; gap: 6px; }
        .vote-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.05);
          font-size: 14px; cursor: pointer; transition: all .2s;
          display: flex; align-items: center; justify-content: center;
        }
        .vote-btn.up.active { background: rgba(0,229,160,0.15); }
        .vote-btn.down.active { background: rgba(255,61,0,0.15); }
        .vote-btn:hover { transform: scale(1.15); }

        /* ── ESCAPE ROUTE ── */
        .escape-intro {
          text-align: center;
          background: rgba(255,61,0,0.05);
          border: 1px solid rgba(255,61,0,0.15);
          border-radius: 14px; padding: 20px;
        }
        .escape-intro-icon { font-size: 40px; margin-bottom: 10px; }
        .escape-intro p { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 14px; }
        .escape-intro b { color: #FF3D00; }
        .escape-scan-btn {
          background: #FF3D00; color: #fff;
          border-radius: 12px; padding: 12px 20px;
          font-size: 13px; font-weight: 800; cursor: pointer;
          transition: all .2s; letter-spacing: 0.02em;
          animation: scan-glow 2s infinite;
        }
        .escape-scan-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,61,0,0.4); }
        @keyframes scan-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,61,0,0.3); }
          50% { box-shadow: 0 0 0 10px rgba(255,61,0,0); }
        }

        .escape-analyzing {
          text-align: center; padding: 20px 0;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
        }
        .escape-analyzing p { font-size: 12px; color: rgba(255,255,255,0.5); }
        .radar-wrap { width: 80px; height: 80px; position: relative; }
        .radar {
          width: 100%; height: 100%; border-radius: 50%;
          border: 2px solid rgba(255,61,0,0.2);
          position: relative;
        }
        .radar::after {
          content: ''; position: absolute; top: 50%; left: 50%;
          width: 50%; height: 2px; background: linear-gradient(90deg, #FF3D00, transparent);
          transform-origin: left center;
          animation: radar-sweep 1.5s linear infinite;
        }
        @keyframes radar-sweep { to { transform: rotate(360deg); } }
        .radar-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #FF3D00;
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          box-shadow: 0 0 10px #FF3D00;
        }
        .scan-bars {
          display: flex; gap: 4px; align-items: flex-end; height: 20px;
        }
        .scan-bar {
          width: 4px; background: #FF3D00; border-radius: 2px;
          animation: scan-wave 0.8s ease-in-out infinite alternate;
        }
        @keyframes scan-wave {
          from { height: 6px; opacity: 0.3; }
          to { height: 20px; opacity: 1; }
        }

        .escape-alert {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(255,61,0,0.08);
          border: 1px solid rgba(255,61,0,0.3);
          border-radius: 12px; padding: 12px;
          animation: alert-flash 2s ease-in-out infinite;
        }
        @keyframes alert-flash {
          0%,100% { border-color: rgba(255,61,0,0.3); }
          50% { border-color: rgba(255,61,0,0.6); }
        }
        .escape-alert-icon { font-size: 22px; }
        .escape-alert strong { font-size: 12px; color: #FF3D00; display: block; margin-bottom: 4px; }
        .escape-alert p { font-size: 11px; color: rgba(255,255,255,0.6); margin: 0; }

        /* Congestion Graph */
        .congestion-graph {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px;
        }
        .graph-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .graph-bars {
          display: flex; gap: 4px; align-items: flex-end; height: 80px;
        }
        .graph-col {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          height: 100%; justify-content: flex-end;
        }
        .graph-bar {
          width: 100%; border-radius: 3px 3px 0 0;
          animation: bar-grow 0.6s ease-out forwards;
          transform-origin: bottom;
        }
        @keyframes bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .graph-km { font-size: 8px; color: rgba(255,255,255,0.3); }
        .graph-legend {
          display: flex; gap: 12px; margin-top: 8px; justify-content: center;
        }
        .leg { font-size: 9px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 4px; }
        .leg-dot { width: 6px; height: 6px; border-radius: 50%; }

        .escape-steps { display: flex; flex-direction: column; gap: 8px; }
        .escape-step {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 10px;
        }
        .escape-step-num {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900; flex-shrink: 0;
        }
        .escape-step-body { flex: 1; }
        .escape-step-action { font-size: 12px; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .escape-step-detail { font-size: 11px; color: rgba(255,255,255,0.45); }
      `}</style>
    </aside>
  );
}
