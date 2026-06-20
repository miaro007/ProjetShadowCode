"use client";

import { useState } from "react";
import { COLORS } from "@/lib/dashboard-data";

export default function DestinationModal({ onClose, onConfirm }: {
  onClose: () => void;
  onConfirm: (dest: string, mode: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState<"voiture" | "taxibe" | "marche">("voiture");

  const suggestions = ["Analakely", "Ankorondrano", "Ivandry", "Andravoahangy", "Mahamasina", "67 Hectares", "Tanjombato", "Aéroport Ivato"];

  const handleSubmit = () => {
    if (destination.trim()) onConfirm(destination.trim(), mode);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="header">
          <div className="title">🧭 Où voulez-vous aller ?</div>
          <button className="close" onClick={onClose}>✕</button>
        </div>

        <div className="body">
          <label className="label">DESTINATION</label>
          <input
            autoFocus
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Tapez votre destination..."
            className="input"
          />

          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setDestination(s)}
                className={`chip ${destination === s ? 'active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>

          <label className="label">MODE DE TRANSPORT</label>
          <div className="modes">
            {[
              { id: "voiture", icon: "🚗", label: "Voiture" },
              { id: "taxibe", icon: "🚌", label: "Taxi-be" },
              { id: "marche", icon: "🚶", label: "Marche" }
            ].map(m => (
              <button
                key={m.id}
                className={`mode ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id as "voiture" | "taxibe" | "marche")}
              >
                <span className="m-icon">{m.icon}</span>
                <span className="m-text">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="footer">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!destination.trim()}>
            🚀 LANCER ARIA
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fade .2s ease;
        }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: ${COLORS.bg};
          border: 1px solid ${COLORS.primary}40;
          border-radius: 20px;
          width: 520px; max-width: 92vw;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 60px ${COLORS.primary}15;
          animation: slide .3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: space-between;
        }
        .title { font-size: 18px; font-weight: 800; color: #fff; }
        .close {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.5);
          font-size: 18px; cursor: pointer;
          transition: all .2s;
        }
        .close:hover { background: ${COLORS.warn}; color: ${COLORS.bg}; }
        .body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
        .label {
          font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.08em;
        }
        .input {
          background: rgba(255,255,255,0.05);
          border: 2px solid ${COLORS.primary}40;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 15px; color: #fff;
          outline: none; width: 100%;
          transition: all .2s;
        }
        .input:focus {
          border-color: ${COLORS.primary};
          background: rgba(0,229,160,0.05);
        }
        .input::placeholder { color: rgba(255,255,255,0.3); }
        .suggestions { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          transition: all .2s;
        }
        .chip:hover { border-color: ${COLORS.primary}50; color: ${COLORS.primary}; }
        .chip.active {
          background: ${COLORS.primary};
          color: ${COLORS.bg};
          border-color: ${COLORS.primary};
          font-weight: 700;
        }
        .modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .mode {
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 16px 12px;
          cursor: pointer;
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          transition: all .2s;
        }
        .mode:hover { border-color: ${COLORS.primary}40; }
        .mode.active {
          background: rgba(0,229,160,0.1);
          border-color: ${COLORS.primary};
        }
        .m-icon { font-size: 26px; }
        .m-text {
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.65);
        }
        .mode.active .m-text { color: ${COLORS.primary}; }
        .footer {
          padding: 18px 24px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; gap: 10px;
        }
        .btn-cancel {
          flex: 1;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.6);
          padding: 14px;
          border-radius: 12px;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          transition: all .2s;
        }
        .btn-cancel:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .btn-submit {
          flex: 2;
          background: ${COLORS.primary};
          color: ${COLORS.bg};
          padding: 14px;
          border-radius: 12px;
          font-size: 14px; font-weight: 900;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all .25s;
          box-shadow: 0 4px 20px ${COLORS.primary}40;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px ${COLORS.primary}60;
        }
        .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
