"use client";

import { COLORS } from "@/lib/dashboard-data";
import Image from "next/image";

// SVG Icons — pas d'emojis
function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Topbar({ displayName, location, onLogout, time, theme, onToggleTheme, isAuthenticated }: {
  displayName: string;
  location: string;
  onLogout: () => void;
  time: Date;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <header className="topbar">
      <div className="left">
        <div className="logo">
          <Image
            src="/WhatsApp-Image-2026-06-21-at-09.51.08 (1).png"
            alt="Ambotakany Logo"
            width={52}
            height={52}
            className="logo-image"
          />
          <span className="brand">Ambota<b>kany</b></span>
        </div>
        <div className="live-chip">
          <span className="live-dot" />
          LIVE
        </div>
      </div>

      <div className="center">
        <span className="time">{time.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
        {location && <span className="loc-pill">{location}</span>}
      </div>

      <div className="right">
        <button className="icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <>
          <div className="user">
            <div className="avatar">{displayName[0]?.toUpperCase()}</div>
            <span className="name">{displayName}</span>
          </div>
          <button className="icon-btn" onClick={() => window.location.href = '/'} title="Se déconnecter">
            <IconLogout />
          </button>
        </>

      </div>

      <style jsx>{`
        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(10, 14, 26, 0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 58px;
          gap: 16px;
        }
        .left, .center, .right {
          display: flex; align-items: center; gap: 12px;
        }
        .right { margin-left: auto; }

        /* Logo */
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo :global(.logo-image) {
          border-radius: 8px;
          object-fit: contain;
        }
        .brand {
          font-size: 20px; font-weight: 700; letter-spacing: -0.03em;
          color: #fff;
        }
        .brand b { color: ${COLORS.primary}; font-weight: 800; }

        /* Live chip */
        .live-chip {
          display: flex; align-items: center; gap: 5px;
          background: rgba(0,229,160,0.08);
          border: 1px solid rgba(0,229,160,0.25);
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 10px; font-weight: 800;
          color: ${COLORS.primary};
          letter-spacing: 0.1em;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${COLORS.primary};
          animation: dot-pulse 1.2s ease-in-out infinite;
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.35); }
        }

        /* Center */
        .center { font-size: 13px; }
        .time {
          font-variant-numeric: tabular-nums;
          font-weight: 700; font-size: 15px;
          color: ${COLORS.primary};
          letter-spacing: 0.04em;
        }
        .loc-pill {
          font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 3px 10px;
        }

        /* User */
        .user { display: flex; align-items: center; gap: 8px; }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: ${COLORS.primary}; color: #0A0E1A;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px; flex-shrink: 0;
        }
        .name { font-size: 13px; color: rgba(255,255,255,0.65); font-weight: 500; }

        /* Icon buttons */
        .icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          cursor: pointer; transition: all .2s;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .icon-btn:hover {
          background: rgba(0,229,160,0.1);
          border-color: rgba(0,229,160,0.3);
          color: ${COLORS.primary};
        }

        /* Login button */
        .login-btn {
          background: ${COLORS.primary};
          color: #0A0E1A;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .2s;
          border: none;
        }
        .login-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,229,160,0.35);
        }

        /* Light theme */
        :global(.light-theme) .topbar {
          background: rgba(245,247,250,0.97);
          border-bottom-color: rgba(0,0,0,0.08);
        }
        :global(.light-theme) .brand { color: #0A0E1A; }
        :global(.light-theme) .name { color: rgba(0,0,0,0.6); }
        :global(.light-theme) .time { color: #007A55; }
        :global(.light-theme) .live-chip {
          background: rgba(0,122,85,0.08);
          border-color: rgba(0,122,85,0.25);
          color: #007A55;
        }
        :global(.light-theme) .live-dot { background: #007A55; }
        :global(.light-theme) .brand b { color: #007A55; }
        :global(.light-theme) .icon-btn {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.08);
          color: rgba(0,0,0,0.55);
        }
        :global(.light-theme) .icon-btn:hover {
          background: rgba(0,122,85,0.1);
          border-color: rgba(0,122,85,0.3);
          color: #007A55;
        }
        :global(.light-theme) .loc-pill {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.08);
          color: rgba(0,0,0,0.5);
        }
        :global(.light-theme) .avatar { background: #007A55; }
        :global(.light-theme) .login-btn { background: #007A55; }
      `}</style>
    </header>
  );
}