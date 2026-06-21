"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Send, Sparkles, AlertCircle, CheckCircle, Loader, Navigation, MapPin, Mic, Square, Volume2, VolumeX, Ear, EarOff
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────
type Role = "user" | "assistant";
type ActionStatus = "pending" | "success" | "error";

interface Action {
  type: "eviter_axe" | "trouver_taxi_be" | "signaler_bouchon";
  label: string;
  target?: string;
  status: ActionStatus;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  action?: Action;
  suggestions?: string[];
  timestamp: Date;
}

// ─── Contexte Utilisateur : Spécifique Madagascar (Tana) ───────────
const USER_CONTEXT = `
Tu es ARIA, le premier assistant IA de mobilité urbaine pour l'Afrique, capable d'anticiper les embouteillages, recommander des itinéraires intelligents et optimiser les déplacements quotidiens des citoyens.
Tu n'es PAS un simple chatbot. Tu es un Conseiller de mobilité urbaine intelligent.

Tes 4 missions principales :
1. Guider : proposer des itinéraires intelligents et multimodaux.
2. Alerter : prévenir des bouchons, accidents, inondations.
3. Prédire : anticiper le trafic futur (ex: "Un ralentissement est attendu à 17h").
4. Optimiser : recommander la meilleure heure de départ et le meilleur moyen de transport (ex: "Je recommande de partir dans 15 min via le Taxi-be 119").

Commandes vocales de contrôle :
- "ferme aria" ou "ferme-toi" ou "au revoir" : ferme l'interface
- "arrête de parler" ou "stop" : désactive la synthèse vocale
- "active le son" ou "parle" : active la synthèse vocale
- "mains libres" : active le mode mains-libres
- "désactive mains libres" : désactive le mode mains-libres

Quand tu détectes une commande de contrôle, réponds avec une balise spéciale :
<COMMAND>CLOSE_ARIA</COMMAND> pour fermer
<COMMAND>MUTE_VOICE</COMMAND> pour couper le son
<COMMAND>ENABLE_VOICE</COMMAND> pour activer le son
<COMMAND>HANDS_FREE_ON</COMMAND> pour activer mains-libres
<COMMAND>HANDS_FREE_OFF</COMMAND> pour désactiver mains-libres

Règles strictes :
- Ne te contente jamais de donner une information passive (ex: "Il y a un bouchon"). Propose TOUJOURS une solution (ex: "Je recommande de passer par Ivandry").
- Analyse le contexte (GPS, heure, météo, signalements) automatiquement pour faire tes recommandations.
- Réponds toujours en français, de façon concise, proactive et chaleureuse.
- Utilise occasionnellement des expressions amicales malgaches ("Manao ahoana", "Misaotra", "Podera e !").
- Format JSON strict pour les actions automatiques : {"action": "EVITER_AXE|TROUVER_TAXI_BE|SIGNALER_BOUCHON", "label": "...", "target": "..."} à mettre entre balises <ACTION> et </ACTION>.
- Propose 2-3 suggestions de suivi courtes à la fin de chaque message au format <SUGGESTIONS>suggestion1|suggestion2</SUGGESTIONS>.
`;

// ─── Parseur de réponses de l'IA ────────────────────────────────────
function parseResponse(raw: string): {
  content: string;
  action?: Action;
  suggestions?: string[];
  command?: "CLOSE_ARIA" | "MUTE_VOICE" | "ENABLE_VOICE" | "HANDS_FREE_ON" | "HANDS_FREE_OFF";
} {
  let content = raw;
  let action: Action | undefined;
  let suggestions: string[] | undefined;
  let command: "CLOSE_ARIA" | "MUTE_VOICE" | "ENABLE_VOICE" | "HANDS_FREE_ON" | "HANDS_FREE_OFF" | undefined;

  // Détecter les commandes de contrôle
  const commandMatch = raw.match(/<COMMAND>(.*?)<\/COMMAND>/);
  if (commandMatch) {
    const cmd = commandMatch[1].trim();
    if (["CLOSE_ARIA", "MUTE_VOICE", "ENABLE_VOICE", "HANDS_FREE_ON", "HANDS_FREE_OFF"].includes(cmd)) {
      command = cmd as any;
    }
    content = content.replace(/<COMMAND>[\s\S]*?<\/COMMAND>/g, "").trim();
  }

  const actionMatch = raw.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
  if (actionMatch) {
    try {
      const parsed = JSON.parse(actionMatch[1].trim());
      action = {
        type:
          parsed.action === "EVITER_AXE" ? "eviter_axe"
            : parsed.action === "TROUVER_TAXI_BE" ? "trouver_taxi_be"
              : "signaler_bouchon",
        label: parsed.label,
        target: parsed.target,
        status: "pending",
      };
    } catch {
      // ignore parse error
    }
    content = content.replace(/<ACTION>[\s\S]*?<\/ACTION>/g, "").trim();
  }

  const sugMatch = raw.match(/<SUGGESTIONS>([\s\S]*?)<\/SUGGESTIONS>/);
  if (sugMatch) {
    suggestions = sugMatch[1].split("|").map(s => s.trim()).filter(Boolean).slice(0, 3);
    content = content.replace(/<SUGGESTIONS>[\s\S]*?<\/SUGGESTIONS>/g, "").trim();
  }

  return { content, action, suggestions, command };
}

// ─── Action Card Composant ──────────────────────────────────────────
function ActionCard({ action, onConfirm }: { action: Action; onConfirm: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    eviter_axe: <Navigation size={16} />,
    trouver_taxi_be: <MapPin size={16} />,
    signaler_bouchon: <AlertCircle size={16} />,
  };

  const accent = action.type === "signaler_bouchon" ? "239,68,68" : "0,212,164";

  return (
    <div style={{
      marginTop: "10px",
      background: `rgba(${accent},0.08)`,
      border: `1px solid rgba(${accent},0.25)`,
      borderRadius: "12px",
      padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{ color: `rgb(${accent})` }}>{icons[action.type]}</div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{action.label}</span>
      </div>

      {action.status === "pending" && (
        <button
          type="button"
          title="Confirmer l'action"
          onClick={onConfirm}
          style={{
            width: "100%", padding: "8px",
            background: `rgba(${accent},0.2)`,
            border: `1px solid rgba(${accent},0.4)`,
            borderRadius: "8px",
            color: `rgb(${accent})`,
            fontSize: "12px", fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          }}
        >
          <CheckCircle size={13} /> Activer l&apos;itinéraire alternatif
        </button>
      )}
      {action.status === "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#00D4A4" }}>
          <CheckCircle size={13} /> Trajet mis à jour sur la Map !
        </div>
      )}
    </div>
  );
}

// ─── Message de Bienvenue Proactif ───────────────────────────────────
function buildWelcomeMessage(displayName?: string, location?: string, criticalZones?: string[]): Message {
  const hour = new Date().getHours();
  const name = displayName ?? "";

  let greeting = "Bonjour";
  let emoji = "☀️";
  if (hour >= 12 && hour < 17) { greeting = "Bon après-midi"; emoji = "🌤️"; }
  else if (hour >= 17 && hour < 21) { greeting = "Bonsoir"; emoji = "🌇"; }
  else if (hour >= 21 || hour < 5) { greeting = "Bonne nuit"; emoji = "🌙"; }

  const isRushMorning = hour >= 6 && hour < 9;
  const isRushEvening = hour >= 17 && hour < 20;
  const loc = location ?? "Antananarivo";
  const zones = criticalZones && criticalZones.length > 0 ? criticalZones : ["Anosizato", "Soarano"];

  let content = `${greeting}${name ? ` ${name}` : ""} ! ${emoji} Je suis **ARIA**, votre assistante de mobilité urbaine.\n\n`;

  if (isRushMorning) {
    content += `⚠️ **Heure de pointe matinale détectée** — Le trafic est dense autour de **${zones[0]}** et **${zones[1] ?? "Ampasika"}**.\n\n`;
    content += `💡 **Ma recommandation :** Privilégiez le **Taxi-be Ligne 119** depuis ${loc} — il contourne les embouteillages et vous fait gagner ~30 min vs la voiture.\n\nQuel est votre destination aujourd'hui ?`;
  } else if (isRushEvening) {
    content += `🚨 **Heure de pointe du soir** — Saturations prévues jusqu'à 20h sur les axes principaux.\n\n`;
    content += `💡 **Je recommande** de ne partir qu'après **20h** si possible — ou de prendre la **Ligne 194** pour éviter les bouchons.\n\nOù allez-vous ?`;
  } else {
    content += `Le trafic est **actuellement fluide** sur la plupart des axes de ${loc}. C'est le bon moment pour se déplacer !\n\n💡 Posez-moi votre destination pour un itinéraire optimisé en temps réel.`;
  }

  const suggestions = isRushMorning
    ? ["Itinéraire vers Analakely", "Quel taxi-be prendre ?", "Éviter Anosizato"]
    : isRushEvening
      ? ["Rentrer à la maison", "Heure de départ optimale ?", "Itinéraire alternatif"]
      : ["Itinéraire vers Analakely", "Prédictions trafic de 17h", "Signaler un problème"];

  return {
    id: "welcome",
    role: "assistant",
    content,
    suggestions,
    timestamp: new Date(),
  };
}

// ─── Composant Principal ─────────────────────────────────────────────
export default function AIAssistant({
  displayName,
  location,
  criticalZones,
}: {
  displayName?: string;
  location?: string;
  criticalZones?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [buildWelcomeMessage(displayName, location, criticalZones)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // États pour la fonctionnalité vocale
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Refs pour l'accès dans les callbacks (TTS, VAD)
  const handsFreeRef = useRef(handsFree);
  const isRecordingRef = useRef(isRecording);
  const voiceModeRef = useRef(voiceMode);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synthèse vocale (TTS)
  const speakText = useCallback((text: string) => {
    if (!voiceModeRef.current || !("speechSynthesis" in window)) {
      if (handsFreeRef.current) setTimeout(() => startRecording(), 500);
      return;
    }
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_]/g, "").replace(/<[^>]+>/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (handsFreeRef.current && !isRecordingRef.current) {
        setTimeout(() => startRecording(), 500);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Enregistrement vocal (STT) avec VAD
  const startRecording = async () => {
    if (isRecordingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // VAD (Voice Activity Detection)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.minDecibels = -70;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let hasSpoken = false;
      let silenceStart = 0;

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;

        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;

        if (average > 15) {
          hasSpoken = true;
          silenceStart = 0;
        } else if (hasSpoken) {
          if (silenceStart === 0) silenceStart = Date.now();
          else if (Date.now() - silenceStart > 1500) {
            mediaRecorderRef.current.stop();
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(checkSilence);
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(console.error);
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setLoading(true);

        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          const res = await fetch("/api/aria/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            sendMessage(data.text);
          } else if (handsFreeRef.current) {
            startRecording();
          }
        } catch (err) {
          console.error("Erreur de transcription", err);
          if (handsFreeRef.current) setTimeout(startRecording, 1000);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      checkSilence();

    } catch (err) {
      console.error("Impossible d'accéder au micro", err);
      alert("Accès au microphone refusé. Le mode vocal ne peut pas fonctionner.");
      setHandsFree(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Écouteur d'événement global
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const msg = e.detail?.message;
      const forcedResponse = e.detail?.response;

      if (forcedResponse) {
        setOpen(true);
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: msg || "Trajet validé.", timestamp: new Date() },
          { id: crypto.randomUUID(), role: "assistant", content: forcedResponse, timestamp: new Date() }
        ]);
        setTimeout(() => speakText(forcedResponse), 500);
      } else if (msg) {
        setOpen(true);
        setInput(msg);
      }
    };
    window.addEventListener("aria-open", handler as EventListener);
    return () => window.removeEventListener("aria-open", handler as EventListener);
  }, []);

  // Obtenir GPS
  useEffect(() => {
    if (open && !userLocation && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.log("Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [open, userLocation]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fonction d'envoi de message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const now = new Date();
      const timeStr = `${now.getHours()}h${String(now.getMinutes()).padStart(2, "0")}`;
      const dayName = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][now.getDay()];

      const response = await fetch("/api/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: USER_CONTEXT,
          messages: history,
          userLocation,
          context: {
            time: timeStr,
            day: dayName,
            location: location ?? "Antananarivo",
            criticalZones: criticalZones ?? [],
          },
        }),
      });

      const data = await response.json() as {
        content?: { type: string; text?: string }[];
      };

      const raw =
        data.content
          ?.map(b => (b.type === "text" ? b.text ?? "" : ""))
          .join("") ?? "Désolée, une erreur s'est produite.";

      const { content, action, suggestions, command } = parseResponse(raw);

      // Exécuter les commandes de contrôle
      if (command) {
        if (command === "CLOSE_ARIA") {
          setTimeout(() => setOpen(false), 1500);
        } else if (command === "MUTE_VOICE") {
          setVoiceMode(false);
        } else if (command === "ENABLE_VOICE") {
          setVoiceMode(true);
        } else if (command === "HANDS_FREE_ON") {
          setHandsFree(true);
          if (!isRecording) setTimeout(() => startRecording(), 500);
        } else if (command === "HANDS_FREE_OFF") {
          setHandsFree(false);
          if (isRecording) stopRecording();
        }
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        action,
        suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakText(content);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Désolée, je rencontre un problème de connexion avec le serveur de trafic.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, location, criticalZones, userLocation, isRecording]);

  // Confirmation action
  const confirmAction = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.action) return m;

      setTimeout(() => {
        setMessages(prev2 => prev2.map(m2 =>
          m2.id === msgId && m2.action
            ? { ...m2, action: { ...m2.action!, status: "success" as ActionStatus } }
            : m2
        ));

        const confirmMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `🔄 **Itinéraire mis à jour sur votre carte.** J'ai calculé une déviation pour contourner le ralentissement. Misaotra !`,
          suggestions: ["Merci Aria !", "Y a-t-il d'autres bouchons ?"],
          timestamp: new Date(),
        };
        setMessages(prev3 => [...prev3, confirmMsg]);
      }, 1000);

      return { ...m, action: { ...m.action, status: "pending" as ActionStatus } };
    }));
  }, []);

  const formatContent = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setPulse(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <style>{`
        @keyframes aria-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,229,160,0.5); }
          50%      { box-shadow: 0 0 0 18px rgba(0,229,160,0); }
        }
        @keyframes aria-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes aria-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aria-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aria-spin { to { transform: rotate(360deg); } }
        @keyframes aria-dot {
          0%,80%,100% { opacity: 0; transform: scale(0.8); }
          40%         { opacity: 1; transform: scale(1); }
        }
        @keyframes aria-record {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,184,0,0.6); }
          50%     { box-shadow: 0 0 0 16px rgba(255,184,0,0); }
        }
      `}</style>

      {/* ── Bouton micro flottant ── */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
        {!open && pulse && (
          <>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#00E5A0", opacity: 0.15,
              animation: "aria-ring 2s 0s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#00E5A0", opacity: 0.1,
              animation: "aria-ring 2s 0.6s ease-out infinite",
            }} />
          </>
        )}
        <button
          type="button"
          title={open ? "Fermer ARIA" : "Ouvrir ARIA"}
          onClick={handleToggle}
          style={{
            position: "relative",
            width: 72, height: 72, borderRadius: "50%",
            background: open ? "rgba(0,229,160,0.15)" : "#00E5A0",
            border: open ? "2px solid #00E5A0" : "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: pulse && !open ? "aria-pulse 2.5s infinite" : "none",
            transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
            boxShadow: open ? "0 0 0 0 transparent" : "0 8px 32px rgba(0,229,160,0.45)",
          }}
        >
          {open
            ? <X size={26} color="#00E5A0" />
            : <Sparkles size={28} color="#0A0E1A" strokeWidth={2.5} />}
        </button>
      </div>

      {/* ── Panel ARIA ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 112, right: 28, zIndex: 9998,
          width: 370,
          background: "#0A0E1A",
          border: "1px solid rgba(0,229,160,0.15)",
          borderRadius: "28px",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "aria-slide-up 0.28s cubic-bezier(.4,0,.2,1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,229,160,0.08)",
          maxHeight: "70vh",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 18px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#00E5A0",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Sparkles size={15} color="#0A0E1A" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>ARIA</div>
              <div style={{ fontSize: "10px", color: "#00E5A0", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00E5A0", display: "inline-block" }} />
                {location ?? "Antananarivo"} · Live
              </div>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              <button
                type="button"
                title={handsFree ? "Désactiver Mains-libres" : "Activer Mains-libres"}
                onClick={() => {
                  const next = !handsFree;
                  setHandsFree(next);
                  if (next && !isRecording) startRecording();
                  if (!next && isRecording) stopRecording();
                }}
                style={{
                  background: handsFree ? "rgba(0,229,160,0.15)" : "none",
                  border: "none", borderRadius: "8px",
                  color: handsFree ? "#00E5A0" : "rgba(255,255,255,0.3)",
                  cursor: "pointer", padding: "4px 8px",
                  display: "flex", alignItems: "center", gap: "5px",
                  fontSize: "10px", fontWeight: 700,
                }}
              >
                {handsFree ? <Ear size={15} /> : <EarOff size={15} />}
                {handsFree && "Mains-libres"}
              </button>
              <button
                type="button"
                title={voiceMode ? "Muet" : "Son"}
                onClick={() => setVoiceMode(!voiceMode)}
                style={{ background: "none", border: "none", color: voiceMode ? "#00E5A0" : "rgba(255,255,255,0.25)", cursor: "pointer", padding: "4px" }}
              >
                {voiceMode ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ animation: "aria-msg-in 0.3s ease" }}>
                  {msg.role === "assistant" ? (
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: "#00E5A0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Sparkles size={12} color="#0A0E1A" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "4px 16px 16px 16px",
                            padding: "10px 14px",
                            fontSize: "13px", lineHeight: 1.65,
                            color: "rgba(255,255,255,0.88)",
                          }}
                          dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                        />
                        {msg.action && (
                          <ActionCard action={msg.action} onConfirm={() => confirmAction(msg.id)} />
                        )}
                        {msg.suggestions && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                            {msg.suggestions.map(s => (
                              <button
                                key={s} type="button" title={s}
                                onClick={() => void sendMessage(s)}
                                style={{
                                  padding: "5px 11px",
                                  background: "rgba(0,229,160,0.07)",
                                  border: "1px solid rgba(0,229,160,0.18)",
                                  borderRadius: "999px",
                                  color: "#00E5A0",
                                  fontSize: "11px", cursor: "pointer",
                                  fontWeight: 600,
                                  transition: "all 0.15s",
                                }}
                              >{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{
                        background: "rgba(0,229,160,0.12)",
                        border: "1px solid rgba(0,229,160,0.18)",
                        borderRadius: "16px 4px 16px 16px",
                        padding: "10px 14px",
                        fontSize: "13px", lineHeight: 1.6,
                        color: "#fff", maxWidth: "82%",
                        fontWeight: 500,
                      }}>{msg.content}</div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: "#00E5A0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={12} color="#0A0E1A" />
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "4px 16px 16px 16px",
                    padding: "12px 16px",
                    display: "flex", gap: "5px", alignItems: "center",
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#00E5A0",
                        animation: `aria-dot 1.4s ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Zone de saisie avec micro */}
          <div style={{
            padding: "10px 14px 14px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.3)",
            display: "flex", gap: "8px", alignItems: "center",
          }}>
            {/* Bouton micro à gauche */}
            <button
              type="button"
              title={isRecording ? "Arrêter l'enregistrement" : "Parler à ARIA"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              style={{
                width: 40, height: 40, borderRadius: "12px",
                background: isRecording ? "#FFB800" : "rgba(0,229,160,0.12)",
                border: "none",
                cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
                animation: isRecording ? "aria-record 1s infinite" : "none",
              }}
            >
              {isRecording
                ? <Square size={16} fill="#0A0E1A" color="#0A0E1A" />
                : <Mic size={16} color="#00E5A0" />}
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Écrivez ou dites 'ferme aria'…"
              aria-label="Message à ARIA"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "10px 14px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="button"
              title="Envoyer"
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: "12px",
                background: input.trim() && !loading ? "#00E5A0" : "rgba(255,255,255,0.06)",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              {loading
                ? <Loader size={15} color="rgba(255,255,255,0.4)" style={{ animation: "aria-spin 1s linear infinite" }} />
                : <Send size={15} color={input.trim() ? "#0A0E1A" : "rgba(255,255,255,0.3)"} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}