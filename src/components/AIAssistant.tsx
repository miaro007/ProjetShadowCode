"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Send, Sparkles, Zap, Droplet, Phone,
  TrendingUp, AlertCircle, CheckCircle, Loader
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────
type Role = "user" | "assistant";
type ActionStatus = "pending" | "success" | "error";

interface Action {
  type: "pay_bill" | "recharge" | "send_money" | "analyze";
  label: string;
  amount?: string;
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

// ─── User context ──────────────────────────────────────────────────
const USER_CONTEXT = `
Tu es ARIA, l'assistante IA autonome de l'application AfricaLife.
Tu aides les utilisateurs africains à gérer leurs finances du quotidien.

Contexte utilisateur actuel :
- Solde : 50 000 FCFA
- Transactions ce mois : 23
- Économies : 15 000 FCFA
- Facture d'eau en attente : 3 200 FCFA (due dans 4 jours)
- Facture d'électricité payée le 12 juin : 8 500 FCFA
- Dernière recharge mobile : 2 000 FCFA (il y a 3 jours)
- Dépenses ce mois : Transport 12 000 FCFA, Eau 3 200 FCFA, Électricité 8 500 FCFA, Alimentation 22 000 FCFA
- Tontine digitale : cotisation de 5 000 FCFA prévue vendredi

Actions disponibles :
1. PAYER_FACTURE : payer une facture (eau, électricité, internet)
2. RECHARGER : recharger du crédit mobile
3. ENVOYER_ARGENT : envoyer de l'argent à un contact
4. ANALYSER : analyser les dépenses et donner des conseils

Règles :
- Réponds toujours en français, de façon concise et amicale
- Si l'utilisateur veut effectuer une action, confirme d'abord avant d'exécuter
- Donne des conseils proactifs basés sur le contexte financier
- Propose toujours 2-3 suggestions de suivi courtes à la fin de chaque message
- Format JSON strict pour les actions : {"action": "PAYER_FACTURE|RECHARGER|ENVOYER_ARGENT|ANALYSER", "label": "...", "amount": "...", "target": "..."}
- Si tu exécutes une action, inclus le JSON entre balises <ACTION> et </ACTION>
- Ne mets JAMAIS le JSON dans le texte visible
- Suggestions format : <SUGGESTIONS>suggestion1|suggestion2|suggestion3</SUGGESTIONS>
`;

// ─── Parse AI response ──────────────────────────────────────────────
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
          parsed.action === "PAYER_FACTURE" ? "pay_bill"
          : parsed.action === "RECHARGER" ? "recharge"
          : parsed.action === "ENVOYER_ARGENT" ? "send_money"
          : "analyze",
        label: parsed.label,
        amount: parsed.amount,
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

// ─── Action Card ───────────────────────────────────────────────────
function ActionCard({ action, onConfirm }: { action: Action; onConfirm: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    pay_bill: <Droplet size={16} />,
    recharge: <Phone size={16} />,
    send_money: <Zap size={16} />,
    analyze: <TrendingUp size={16} />,
  };
  const colors: Record<string, string> = {
    pay_bill: "56,189,248",
    recharge: "167,139,250",
    send_money: "0,212,164",
    analyze: "245,158,11",
  };
  const accent = colors[action.type] ?? "0,212,164";

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
        {action.amount && (
          <span style={{ marginLeft: "auto", fontSize: "13px", color: `rgb(${accent})`, fontWeight: 700 }}>
            {action.amount}
          </span>
        )}
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
          <CheckCircle size={13} /> Confirmer et exécuter
        </button>
      )}
      {action.status === "success" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#00D4A4" }}>
          <CheckCircle size={13} /> Action exécutée avec succès
        </div>
      )}
      {action.status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#FF6B6B" }}>
          <AlertCircle size={13} /> Échec — réessayez
        </div>
      )}
    </div>
  );
}

// ─── Welcome message (défini en dehors du composant) ───────────────
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Bonjour ! Je suis ARIA, votre assistante IA AfricaLife 👋\n\nJe vois que vous avez une **facture d'eau de 3 200 FCFA** due dans 4 jours. Souhaitez-vous que je la règle maintenant ?",
  suggestions: ["Payer ma facture d'eau", "Analyser mes dépenses", "Recharger mon mobile"],
  timestamp: new Date(),
};

// ─── Main Component ────────────────────────────────────────────────
export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envoi de message
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
        content: "Désolée, je rencontre un problème de connexion. Réessayez dans un instant.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  // Confirmation d'action
  const confirmAction = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.action) return m;

      const actionLabel = m.action.label;
      const actionAmount = m.action.amount;

      setTimeout(() => {
        setMessages(prev2 => prev2.map(m2 =>
          m2.id === msgId && m2.action
            ? { ...m2, action: { ...m2.action!, status: "success" as ActionStatus } }
            : m2
        ));

        const confirmMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `✅ ${actionLabel} exécutée avec succès${actionAmount ? ` — **${actionAmount}** débité de votre solde` : ""}.`,
          suggestions: ["Voir mon solde", "Autre action", "Merci ARIA"],
          timestamp: new Date(),
        };
        setMessages(prev3 => [...prev3, confirmMsg]);
      }, 1200);

      return { ...m, action: { ...m.action, status: "pending" as ActionStatus } };
    }));
  }, []);

  const formatContent = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");

  // Ouvrir/fermer le panel
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
          position: "fixed", bottom: 28, right: 28, zIndex: 1000,
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

      {/* ── Badge notification ── */}
      {!open && (
        <div style={{
          position: "fixed", bottom: 76, right: 26, zIndex: 1001,
          width: 18, height: 18, borderRadius: "50%",
          background: "#F59E0B",
          border: "2px solid #0A0F1E",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "10px", fontWeight: 700, color: "#0A0F1E",
          pointerEvents: "none",
        }}>1</div>
      )}

      {/* ── Panel chat ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 100, right: 28, zIndex: 999,
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
                IA Autonome · AfricaLife
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

          {/* Messages */}
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
                              onClick={() => sendMessage(s)}
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

            {/* Typing indicator */}
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

          {/* Input */}
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
              placeholder="Demandez à ARIA…"
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
