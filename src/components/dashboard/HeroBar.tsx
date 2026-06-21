"use client";

import { COLORS } from "@/lib/dashboard-data";
import { CongestionPoint, HotZone } from "@/types/dashboard";
import { getGreeting } from "@/utils/dashboard";

export default function HeroBar({ displayName, hour, congestionData, zones, onDestinationClick, onSignalClick, location, signalCount }: {
  displayName: string;
  hour: number;
  congestionData: CongestionPoint[];
  zones: HotZone[];
  onDestinationClick: () => void;
  onSignalClick: () => void;
  location: string;
  signalCount: number;
}) {
  const greeting = getGreeting(hour);
  const current = congestionData[congestionData.length - 1];
  const criticalZones = zones.filter(z => z.level >= 85).length;
  const timeLostToday = Math.floor(Math.random() * 90) + 45;

  return (
    <div className="hero">
      <div className="hero-info">
        <h1 className="title">
          Bonjour <span className="hl">{displayName}</span>
        </h1>
        <div className="stats">
          <div className="stat">
            <span className="dot" style={{background: '#00E5A0'}} />
            Vous êtes à <b>{location.split(",")[0]}</b>
          </div>
          <div className="stat">
            <span className="dot warn" />
            Trafic global : <b style={{color: '#FF3D00'}}>Saturé</b>
          </div>
          <div className="stat">
            <span className="dot" style={{background: '#FFB800'}} />
            <b>{signalCount}</b> signalements aujourd&apos;hui
          </div>
        </div>
      </div>

      <div className="hero-actions">
        <button className="cta-signal" onClick={onSignalClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="cta-text">SIGNALER</span>
        </button>

        <button className="cta-main" onClick={onDestinationClick}>
          <svg className="cta-main-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          <div className="cta-main-content">
            <span className="cta-main-title">OÙ VAIS-JE ?</span>
            <span className="cta-main-sub">Itinéraire optimal avec ARIA</span>
          </div>
          <div className="cta-arrow">→</div>
        </button>
      </div>

      <style jsx>{`
        .hero {
          padding: 18px 24px;
          background: linear-gradient(180deg, rgba(0,229,160,0.04) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
        }
        .title { font-size: 26px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.02em; }
        .hl { color: ${COLORS.primary}; }
        .stats { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; }
        .stat {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: rgba(255,255,255,0.6);
        }
        .stat b { color: #fff; font-weight: 800; font-family: 'SF Mono', monospace; }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${COLORS.primary};
        }
        .dot.warn { background: ${COLORS.warn}; box-shadow: 0 0 8px ${COLORS.warn}; }

        .hero-actions { display: flex; gap: 12px; align-items: center; }

        .cta-signal {
          background: transparent;
          border: 2px solid ${COLORS.warn};
          color: ${COLORS.warn};
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 13px; font-weight: 800;
          letter-spacing: 0.06em;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: all .25s cubic-bezier(.4,0,.2,1);
        }
        .cta-signal:hover {
          background: ${COLORS.warn};
          color: ${COLORS.bg};
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,184,0,0.4);
        }

        .cta-main {
          background: ${COLORS.primary};
          color: ${COLORS.bg};
          border-radius: 16px;
          padding: 14px 22px;
          cursor: pointer;
          display: flex; align-items: center; gap: 14px;
          transition: all .3s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 6px 24px rgba(0,229,160,0.35);
          position: relative; overflow: hidden;
        }
        .cta-main::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform .6s;
        }
        .cta-main:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(0,229,160,0.5);
        }
        .cta-main:hover::before { transform: translateX(100%); }
        .cta-main-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cta-main-content { display: flex; flex-direction: column; align-items: flex-start; }
        .cta-main-title { font-size: 15px; font-weight: 900; letter-spacing: 0.04em; }
        .cta-main-sub { font-size: 11px; opacity: 0.7; font-weight: 600; }
        .cta-arrow { font-size: 22px; font-weight: 800; margin-left: 4px; }
      `}</style>
    </div>
  );
}
