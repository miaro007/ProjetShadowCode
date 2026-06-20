"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Send, Sparkles, AlertCircle, CheckCircle, Loader, Navigation, MapPin
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
Tu es ARIA, l'assistante IA en temps réel experte du trafic et des transports à Antananarivo, Madagascar.
Tu aides les citadins et les chauffeurs de Taxi-be à éviter les embouteillages monstres de la capitale.

Contexte actuel d'Antananarivo :
- Points noirs saturés en ce moment : Rond-point Anosizato (bloqué par des camions), Pont d'Ampasika (circulation alternée difficile), Soarano (marchands de rue).
- Axes fluides : Route des Hydrocarbures (Ankorondrano), Alarobia.
- Coopératives majeures à disposition : Ligne 119 (Ankatso - Analakely - 67ha), Ligne 165 (Ankatso - Ivato), Ligne 194 (Itaosy - Analakely).

Actions disponibles :
1. EVITER_AXE : recalculer un itinéraire pour contourner un bouchon.
2. TROUVER_TAXI_BE : proposer la meilleure ligne de Taxi-be pour un trajet fluide.
3. SIGNALER_BOUCHON : enregistrer un signalement communautaire.

Règles :
- Réponds toujours en français, de façon concise, dynamique et chaleureuse.
- Utilise occasionnellement des expressions amicales malgaches ("Manao ahoana", "Misaotra", "Podera e !").
- Propose toujours 2-3 suggestions de suivi courtes à la fin de chaque message.
- Format JSON strict pour les actions : {"action": "EVITER_AXE|TROUVER_TAXI_BE|SIGNALER_BOUCHON", "label": "...", "target": "..."}
- Si tu proposes une action automatique, inclus le JSON entre balises <ACTION> et </ACTION>. Ne le mets jamais dans le texte visible.
- Suggestions format : <SUGGESTIONS>suggestion1|suggestion2|suggestion3</SUGGESTIONS>
`;

// ─── Parseur de réponses de l'IA ────────────────────────────────────
function parseResponse(raw: string): { content: string; action?: Action; suggestions?: string[] } {
  let content = raw;
  let action: Action | undefined;
  let suggestions: string[] | undefined;

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

  return { content, action, suggestions };
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

// ─── Message de Bienvenue (Tana) ───────────────────────────────────
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Manao ahoana ! Je suis ARIA, ton copilote info-trafic à Antananarivo 🚗💨\n\nAttention, le **Pont d'Anosizato** est complètement paralysé par des camions ce secteur est à éviter. Où vas-tu aujourd'hui ?",
  suggestions: ["Éviter Anosizato", "Taxi-be pour aller à Ankatso", "Signaler un bouchon"],
  timestamp: new Date(),
};

// ─── Composant Principal Réparé ─────────────────────────────────────
export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Écouteur d'événement global pour ouvrir Aria depuis la Map
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const msg = e.detail?.message;
      if (msg) {
        setOpen(true);           
        setInput(msg);           
      }
    };
    window.addEventListener("aria-open", handler as EventListener);
    return () => window.removeEventListener("aria-open", handler as EventListener);
  }, []);

  // Auto-scroll vers le bas
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

      const response = await fetch("/api/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: USER_CONTEXT,
          messages: history,
        }),
      });

      const data = await response.json() as {
        content?: { type: string; text?: string }[];
      };

      const raw =
        data.content
          ?.map(b => (b.type === "text" ? b.text ?? "" : ""))
          .join("") ?? "Désolée, une erreur s'est produite.";

      const { content, action, suggestions } = parseResponse(raw);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        action,
        suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
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
  }, [loading, messages]);

  // Confirmation de l'action de guidage
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
          0%,100% { box-shadow: 0 0 0 0 rgba(0,212,164,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(0,212,164,0); }
        }
        @keyframes aria-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
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
      `}</style>

      {/* ── Bouton flottant ── */}
      <button
        type="button"
        title="Ouvrir ARIA"
        onClick={handleToggle}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          width: 58, height: 58, borderRadius: "50%",
          background: "linear-gradient(135deg, #00D4A4, #0099ff)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: pulse ? "aria-pulse 2s infinite" : "none",
          transition: "transform 0.2s",
          transform: open ? "scale(0.92)" : "scale(1)",
          boxShadow: "0 4px 24px rgba(0,212,164,0.35)",
        }}
      >
        {open ? <X size={22} color="#fff" /> : <Sparkles size={22} color="#fff" />}
      </button>

      {/* ── Panel chat ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 100, right: 28, zIndex: 9998,
          width: 380, height: 560,
          background: "#0D1526",
          border: "1px solid rgba(0,212,164,0.2)",
          borderRadius: "24px",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "aria-slide-up 0.3s ease",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,164,0.1)",
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg, rgba(0,212,164,0.1) 0%, rgba(0,153,255,0.05) 100%)",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #00D4A4, #0099ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>ARIA</div>
              <div style={{ fontSize: "11px", color: "#00D4A4", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#00D4A4", display: "inline-block",
                }} />
                Info-Trafic Tana · Live
              </div>
            </div>
            <button
              type="button"
              title="Fermer"
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto", background: "none", border: "none",
                color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Corps de la conversation */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ animation: "aria-msg-in 0.3s ease" }}>
                {msg.role === "assistant" ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #00D4A4, #0099ff)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Sparkles size={13} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "4px 16px 16px 16px",
                          padding: "10px 14px",
                          fontSize: "13px", lineHeight: 1.6,
                          color: "rgba(255,255,255,0.85)",
                        }}
                        dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                      />
                      {msg.action && (
                        <ActionCard
                          action={msg.action}
                          onConfirm={() => confirmAction(msg.id)}
                        />
                      )}
                      {msg.suggestions && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                          {msg.suggestions.map(s => (
                            <button
                              key={s}
                              type="button"
                              title={s}
                              onClick={() => void sendMessage(s)}
                              style={{
                                padding: "5px 10px",
                                background: "rgba(0,212,164,0.08)",
                                border: "1px solid rgba(0,212,164,0.2)",
                                borderRadius: "999px",
                                color: "#00D4A4",
                                fontSize: "11px", cursor: "pointer",
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
                      background: "linear-gradient(135deg, rgba(0,212,164,0.25), rgba(0,153,255,0.15))",
                      border: "1px solid rgba(0,212,164,0.2)",
                      borderRadius: "16px 4px 16px 16px",
                      padding: "10px 14px",
                      fontSize: "13px", lineHeight: 1.6,
                      color: "#fff", maxWidth: "80%",
                    }}>{msg.content}</div>
                  </div>
                )}
              </div>
            ))}

            {/* Indicateur de chargement IA */}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #00D4A4, #0099ff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={13} color="#fff" />
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "4px 16px 16px 16px",
                  padding: "12px 16px",
                  display: "flex", gap: "5px", alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#00D4A4",
                      animation: `aria-dot 1.4s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Formulaire d'envoi */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.2)",
            display: "flex", gap: "8px", alignItems: "center",
          }}>
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
              placeholder="Demandez un itinéraire à ARIA…"
              aria-label="Message à ARIA"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
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
                width: 38, height: 38, borderRadius: "10px",
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #00D4A4, #0099ff)"
                  : "rgba(255,255,255,0.06)",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              {loading
                ? <Loader size={15} color="rgba(255,255,255,0.4)" style={{ animation: "aria-spin 1s linear infinite" }} />
                : <Send size={15} color={input.trim() ? "#fff" : "rgba(255,255,255,0.3)"} />
              }
            </button>
          </div>
        </div>
      )}
    </>
  );
}