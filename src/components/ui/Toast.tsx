"use client";

import { useEffect } from "react";
import { COLORS } from "@/lib/dashboard-data";

export default function Toast({ message, type = "info", onClose }: {
  message: string;
  type?: "success" | "info" | "warning" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isPrimary = type === "success" || type === "info";
  const color = isPrimary ? COLORS.primary : COLORS.warn;
  const icons = { success: "✓", info: "ℹ️", warning: "⚠️", error: "✕" };

  return (
    <div className="toast">
      <span className="icon">{icons[type]}</span>
      <span className="msg">{message}</span>
      <button className="close" onClick={onClose}>✕</button>
      <style jsx>{`
        .toast {
          position: fixed;
          bottom: 110px; left: 50%;
          transform: translateX(-50%);
          z-index: 300;
          background: ${COLORS.bg};
          border: 2px solid ${color};
          border-radius: 14px;
          padding: 14px 20px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 32px ${color}30;
          animation: slide .3s cubic-bezier(.4,0,.2,1);
          max-width: 500px;
        }
        @keyframes slide {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .icon { font-size: 18px; }
        .msg { font-size: 13px; color: ${color}; font-weight: 700; flex: 1; }
        .close {
          width: 24px; height: 24px; border-radius: 6px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          font-size: 12px; cursor: pointer;
          transition: all .2s;
        }
        .close:hover { background: rgba(255,255,255,0.15); color: #fff; }
      `}</style>
    </div>
  );
}
