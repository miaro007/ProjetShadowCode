"use client";

import { COLORS } from "@/lib/dashboard-data";

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
          <div className="pulse" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="brand">Ambota<b>kany</b></span>
          </div>
        </div>
      </div>
      <div className="center">
        <span className="time">{time.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="right">
        <button className="theme-toggle" onClick={onToggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {isAuthenticated ? (
          <>
            <div className="user">
              <div className="avatar">{displayName[0]?.toUpperCase()}</div>
              <span className="name">{displayName}</span>
            </div>
            <button className="logout" onClick={onLogout} title="Se déconnecter">⎋</button>
          </>
        ) : (
          <button className="login-btn" onClick={() => window.location.href = '/login'}>
            Se connecter
          </button>
        )}
      </div>

      <style jsx>{`
        .topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(10, 14, 26, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 60px;
        }
        .left, .center, .right { display: flex; align-items: center; gap: 14px; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .pulse {
          width: 10px; height: 10px; border-radius: 50%;
          background: ${COLORS.primary};
          box-shadow: 0 0 16px ${COLORS.primary};
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .brand { 
          font-size: 24px; 
          font-weight: 900; 
          background: linear-gradient(90deg, #00E5A0, #00BFFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.04em; 
          line-height: 1; 
          filter: drop-shadow(0 2px 10px rgba(0, 229, 160, 0.4));
        }
        .brand b { font-weight: 900; }
        .slogan { 
          font-size: 11px; 
          color: rgba(255,255,255,0.7); 
          font-weight: 600; 
          margin-top: 3px; 
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .live {
          font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
          color: ${COLORS.warn};
          background: rgba(255, 184, 0, 0.12);
          padding: 4px 10px; border-radius: 999px;
          border: 1px solid rgba(255, 184, 0, 0.3);
        }
        .center { font-size: 13px; color: rgba(255,255,255,0.6); }
        .loc { color: #fff; font-weight: 500; }
        .sep { opacity: 0.3; }
        .time { font-family: 'SF Mono', monospace; font-weight: 700; color: ${COLORS.primary}; }
        .user { display: flex; align-items: center; gap: 10px; }
        .avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: ${COLORS.primary}; color: ${COLORS.bg};
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px;
        }
        .name { font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 500; }
        .logout {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.6);
          font-size: 16px; cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center; justify-content: center;
        }
        .logout:hover { background: rgba(255,184,0,0.12); color: ${COLORS.warn}; }
        .theme-toggle {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          font-size: 16px; cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center; justify-content: center;
        }
        .theme-toggle:hover {
          background: rgba(0, 229, 160, 0.15);
        }
        .login-btn {
          background: ${COLORS.primary};
          color: #0A0E1A;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .2s;
        }
        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 229, 160, 0.3);
        }
      `}</style>
    </header>
  );
}
