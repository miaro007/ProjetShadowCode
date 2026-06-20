"use client";

import { COLORS } from "@/lib/dashboard-data";

export default function SkeletonDashboard({ theme }: { theme: "dark" | "light" }) {
  return (
    <div className={`skeleton-container ${theme === 'light' ? 'light-theme' : ''}`}>
      {/* Topbar Skeleton */}
      <div className="sk-topbar">
        <div className="sk-pulse-box logo" />
        <div className="sk-pulse-box center" />
        <div className="sk-pulse-box right" />
      </div>

      {/* HeroBar Skeleton */}
      <div className="sk-hero">
        <div className="sk-hero-info">
          <div className="sk-pulse-box title" />
          <div className="sk-stats">
            <div className="sk-pulse-box stat" />
            <div className="sk-pulse-box stat" />
            <div className="sk-pulse-box stat" />
          </div>
        </div>
        <div className="sk-hero-actions">
           <div className="sk-pulse-box btn" />
           <div className="sk-pulse-box btn-large" />
        </div>
      </div>

      {/* Main Skeleton */}
      <div className="sk-main">
         <div className="sk-pulse-box map" />
         <div className="sk-pulse-box side" />
      </div>

      <style jsx>{`
        .skeleton-container {
          min-height: 100vh;
          background: #050811;
          display: flex;
          flex-direction: column;
        }
        .light-theme {
          background: #F4F7FA;
        }

        .sk-pulse-box {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          animation: sk-pulse 1.5s infinite ease-in-out;
        }
        .light-theme .sk-pulse-box {
          background: rgba(0, 0, 0, 0.08);
        }

        @keyframes sk-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }

        /* Topbar */
        .sk-topbar {
          height: 60px;
          padding: 0 24px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sk-topbar .logo { width: 140px; height: 24px; }
        .sk-topbar .center { width: 200px; height: 20px; }
        .sk-topbar .right { width: 120px; height: 36px; border-radius: 10px; }

        /* HeroBar */
        .sk-hero {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
        }
        .sk-hero-info { display: flex; flex-direction: column; gap: 16px; }
        .sk-hero .title { width: 250px; height: 32px; }
        .sk-stats { display: flex; gap: 16px; }
        .sk-stats .stat { width: 100px; height: 20px; }
        
        .sk-hero-actions { display: flex; gap: 12px; }
        .sk-hero-actions .btn { width: 120px; height: 48px; border-radius: 14px; }
        .sk-hero-actions .btn-large { width: 180px; height: 48px; border-radius: 16px; }

        /* Main */
        .sk-main {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          padding: 16px 24px 24px;
          height: calc(100vh - 168px);
        }
        .sk-main .map { height: 100%; border-radius: 22px; }
        .sk-main .side { height: 100%; border-radius: 22px; }
      `}</style>
    </div>
  );
}
