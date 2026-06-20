"use client";

import { useRef, useState } from "react";

export default function TransitAI() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");
  const [active, setActive] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const [mode, setMode] = useState<"sim" | "voice">("sim");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 🔊 VOICE
  const speak = (txt: string) => {
    const s = new SpeechSynthesisUtterance(txt);
    s.lang = "fr-FR";
    window.speechSynthesis.speak(s);
  };

  // 🧭 ACTION HANDLER (ICI 👇 TON CODE)
  const executeAction = (action: string) => {
    switch (action) {
      case "SHOW_TRAFFIC":
        setActiveView("traffic");
        break;

      case "SHOW_ROUTE":
        setActiveView("route");
        break;

      case "REPORT_INCIDENT":
        setActiveView("incident");
        break;

      default:
        setActiveView("home");
        break;
    }
  };

  // 🧠 API CALL
  const sendToAI = async (message: string) => {
    setText(message);

    const res = await fetch("/api/speak-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    setResponse(data.reply);
    speak(data.reply);

    executeAction(data.action);
  };

  // 🧪 SIM MODE
  const sendSim = (msg: string) => sendToAI(msg);

  // 🎤 VOICE MODE
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
      const r = new SpeechRecognition();

      r.lang = "fr-FR";

      r.onstart = () => setActive(true);
      r.onend = () => setActive(false);

      r.onresult = (e: SpeechRecognitionEvent) => {
        const transcript = e.results[0][0].transcript;
        sendToAI(transcript);
      };

      recognitionRef.current = r;
    }

    recognitionRef.current.start();
  };

  return (
    <div className="container">
      <div className={`core ${active ? "active" : ""}`} />

      <h1>🚦 TRANSIT AI</h1>

      {/* MODE */}
      <div>
        <button onClick={() => setMode("sim")}>Simulation</button>
        <button onClick={() => setMode("voice")}>Voice</button>
      </div>

      {/* SIM */}
      {mode === "sim" && (
        <div>
          <button onClick={() => sendSim("trafic")}>🚦 Trafic</button>
          <button onClick={() => sendSim("itinéraire")}>🗺️ Route</button>
          <button onClick={() => sendSim("accident")}>🚨 Accident</button>
        </div>
      )}

      {/* VOICE */}
      {mode === "voice" && (
        <button onClick={startVoice}>🎤 ACTIVER</button>
      )}

      {/* VIEW */}
      <div className="box">
        {activeView === "home" && <p>🏠 Dashboard Transit AI</p>}

        {activeView === "traffic" && <p>🚦 Affichage trafic réel</p>}

        {activeView === "route" && <p>🗺️ Route intelligente active</p>}

        {activeView === "incident" && <p>🚨 Incident actif</p>}
      </div>

      {/* OUTPUT */}
      <div className="box">
        <p><b>You:</b> {text}</p>
        <p><b>AI:</b> {response}</p>
      </div>

      <style jsx>{`
        .container {
          height: 100vh;
          background: #000;
          color: #00f5ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: monospace;
        }

        .core {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #00f5ff;
        }

        .active {
          transform: scale(1.2);
        }

        .box {
          margin-top: 10px;
          padding: 10px;
          border: 1px solid #00f5ff;
          width: 320px;
        }
      `}</style>
    </div>
  );
}