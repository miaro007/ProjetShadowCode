"use client";

import AIAssistant from "@/components/AIAssistant";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

import {
  Zap,
  Droplet,
  Phone,
  Bus,
  Heart,
  MapPin,
  Wallet,
  Activity,
  LogOut,
  Bell,
  ArrowUpRight,
  ShoppingCart,
  Users,
  ChevronRight,
  Globe,
  Shield,
  Sparkles,
} from "lucide-react";

/* ───────────────────────── TYPES ───────────────────────── */

type ChatAction =
  | "SHOW_TRAFFIC"
  | "SHOW_ROUTE"
  | "REPORT_INCIDENT"
  | "NONE";

type ChatResponse = {
  reply: string;
  action: ChatAction;
  source?: "local" | "ai" | "error";
};

/* ───────────────────────── CHAT UI STATE ───────────────────────── */

type Message = {
  role: "user" | "ai";
  text: string;
};

/* ───────────────────────── DASHBOARD ───────────────────────── */

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(new Date());

  /* CHAT STATE */
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /* ───────── AUTH ───────── */

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else {
        setUser(session.user as User);
        setLoading(false);
      }
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_e, session) => {
        if (!session) router.push("/login");
        else setUser(session.user as User);
      });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setReady(true), 1500);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ───────────────────────── AI ENGINE ───────────────────────── */

  const sendMessage = async (message: string): Promise<ChatResponse> => {
    try {
      const res = await fetch("/api/speak-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      return await res.json();
    } catch {
      return {
        reply: "Erreur connexion TransitAI",
        action: "NONE",
        source: "error",
      };
    }
  };

  const executeAction = (action: ChatAction) => {
    switch (action) {
      case "SHOW_TRAFFIC":
        console.log("🚦 trafic");
        break;
      case "SHOW_ROUTE":
        console.log("🗺️ route");
        break;
      case "REPORT_INCIDENT":
        console.log("🚨 incident");
        break;
      default:
        break;
    }
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 1;
    window.speechSynthesis.speak(u);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setMessages((p) => [...p, { role: "user", text }]);
    setInput("");

    const res = await sendMessage(text);

    setMessages((p) => [...p, { role: "ai", text: res.reply }]);

    executeAction(res.action);
    speak(res.reply);
  };

  /* ───────────────────────── VOICE (HACKATHON MODE) ───────────────────────── */

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (!recognitionRef.current) {
      const rec = new SR();

      rec.lang = "fr-FR";
      rec.continuous = false;

      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const text = e.results[0][0].transcript;
        handleSend(text);
      };

      recognitionRef.current = rec;
    }

    recognitionRef.current.start();
  };

  /* ───────────────────────── LOADING ───────────────────────── */

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!ready) {
    return <div style={{ color: "#fff", padding: 40 }}>Chargement système...</div>;
  }

  const name = user.email?.split("@")[0] ?? "User";

  /* ───────────────────────── UI ───────────────────────── */

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#fff" }}>

      {/* HEADER SIMPLE */}
      <div style={{ padding: 20, display: "flex", justifyContent: "space-between" }}>
        <h2>AfricaLife</h2>
        <div>{time.toLocaleTimeString()}</div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 20 }}>
        <h1>Bienvenue {name}</h1>
      </div>

      {/* ───────── CHAT BUTTON ───────── */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#00D4A4",
          border: "none",
          fontSize: 20,
          cursor: "pointer",
        }}
      >
        💬
      </button>

      {/* ───────── CHAT POPUP ───────── */}
      {chatOpen && (
  <div
    style={{
      position: "fixed",
      right: 24,
      bottom: 90,
      width: 380,
      height: 520,
      background: "rgba(10, 15, 30, 0.75)",
      border: "1px solid rgba(0, 212, 164, 0.25)",
      borderRadius: 18,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      backdropFilter: "blur(18px)",
      boxShadow: "0 0 40px rgba(0, 212, 164, 0.15)",
      animation: "fadeIn 0.25s ease",
    }}
  >
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes glow {
        0%, 100% { box-shadow: 0 0 10px rgba(0,212,164,0.2); }
        50% { box-shadow: 0 0 20px rgba(0,212,164,0.5); }
      }

      .hud-header {
        background: linear-gradient(90deg, rgba(0,212,164,0.15), transparent);
        border-bottom: 1px solid rgba(0,212,164,0.2);
      }

      .msg {
        transition: all 0.2s ease;
      }

      .msg:hover {
        transform: translateX(3px);
      }
    `}</style>

    {/* HEADER */}
    <div
      className="hud-header"
      style={{
        padding: "12px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ color: "#00D4A4", fontWeight: 700, letterSpacing: 1 }}>
          TRANSIT AI
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          Neural transport assistant
        </span>
      </div>

      <button
        onClick={startVoice}
        style={{
          background: listening
            ? "rgba(0,212,164,0.25)"
            : "transparent",
          border: "1px solid rgba(0,212,164,0.5)",
          color: "#00D4A4",
          borderRadius: 10,
          padding: "6px 10px",
          cursor: "pointer",
          animation: listening ? "glow 1.2s infinite" : "none",
        }}
      >
        🎤
      </button>
    </div>

    {/* MESSAGES */}
    <div
      style={{
        flex: 1,
        padding: 12,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {messages.map((m, i) => (
        <div
          key={i}
          className="msg"
          style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 14,
              fontSize: 13,
              lineHeight: 1.4,
              background:
                m.role === "user"
                  ? "linear-gradient(135deg, #00D4A4, #00A884)"
                  : "rgba(255,255,255,0.06)",
              color: m.role === "user" ? "#00140f" : "#fff",
              border:
                m.role === "user"
                  ? "none"
                  : "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                m.role === "user"
                  ? "0 0 15px rgba(0,212,164,0.25)"
                  : "none",
            }}
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>

    {/* INPUT */}
    <div
      style={{
        padding: 10,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        gap: 8,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Demander une route, trafic..."
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(0,212,164,0.2)",
          background: "rgba(0,0,0,0.3)",
          color: "#fff",
          outline: "none",
        }}
      />

      <button
        onClick={() => handleSend(input)}
        style={{
          background: "linear-gradient(135deg, #00D4A4, #00A884)",
          border: "none",
          borderRadius: 10,
          padding: "10px 14px",
          cursor: "pointer",
          color: "#00140f",
          fontWeight: 700,
          boxShadow: "0 0 15px rgba(0,212,164,0.25)",
        }}
      >
        ➤
      </button>
    </div>
  </div>
)}
    </div>
  );
}