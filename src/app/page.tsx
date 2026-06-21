"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import Image from "next/image";

// ─── Icons ──────────────────────────────────────────────
function IconSun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ─── Canvas ARIA Orb ──────────────────────────────────────────────
function ARIAOrb({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;

    const W = 400;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    const CX = W / 2;
    const CY = H / 2;

    // Couleurs adaptatives
    const primaryColor = isDark ? "0,229,160" : "0,122,85"; // Vert cyan (dark) / Vert sombre (light)

    // Particules
    const N_PARTICLES = 60;
    type Particle = {
      angle: number;
      radius: number;
      speed: number;
    };
    const particles: Particle[] = Array.from({ length: N_PARTICLES }, (_, i) => ({
      angle: (Math.PI * 2 * i) / N_PARTICLES,
      radius: 80 + Math.random() * 80,
      speed: (0.004 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Fond
      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 180);
      bg.addColorStop(0, `rgba(${primaryColor},0.04)`);
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Particules
      particles.forEach((p) => {
        p.angle += p.speed;
        const x = CX + Math.cos(p.angle) * p.radius;
        const y = CY + Math.sin(p.angle) * p.radius;

        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColor},0.5)`;
        ctx.fill();
      });

      // Orbe central
      const pulse = Math.sin(frame * 0.03) * 0.2 + 0.8;

      const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 40);
      glow.addColorStop(0, `rgba(${primaryColor},${pulse})`);
      glow.addColorStop(1, `rgba(${primaryColor},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(CX, CY, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(CX, CY, 16, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#00E5A0" : "#007A55";
      ctx.fill();

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "min(400px, 80vw)",
        height: "min(400px, 80vw)",
        display: "block",
      }}
    />
  );
}

// ─── Landing Page ──────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);

  const theme = {
    bg: isDark ? "#0A0E1A" : "#F5F7FA",
    text: isDark ? "#fff" : "#0A0E1A",
    textMuted: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
    textLight: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    primary: isDark ? "#00E5A0" : "#007A55",
    primaryLight: isDark ? "#33ECA8" : "#009966",
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: theme.bg,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: theme.text,
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cta-btn {
          padding: 16px 48px;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Space Grotesk', system-ui;
          color: ${isDark ? "#0A0E1A" : "#fff"};
          background: ${theme.primary};
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
          animation: fadeIn 0.6s ease 0.4s both;
        }
        .cta-btn:hover {
          background: ${theme.primaryLight};
          transform: translateY(-2px);
        }

        .secondary-btn {
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 500;
          font-family: 'Space Grotesk', system-ui;
          color: ${theme.text};
          background: transparent;
          border: 1px solid ${theme.border};
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          animation: fadeIn 0.6s ease 0.5s both;
        }
        .secondary-btn:hover {
          border-color: ${theme.primary};
          color: ${theme.primary};
        }

        .theme-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
          border: 1px solid ${theme.border};
          color: ${theme.textMuted};
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .theme-btn:hover {
          background: ${isDark ? "rgba(0,229,160,0.1)" : "rgba(0,122,85,0.1)"};
          border-color: ${theme.primary};
          color: ${theme.primary};
        }

        .animated {
          animation: fadeIn 0.6s ease both;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-image {
          border-radius: 8px;
          object-fit: contain;
        }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "24px 48px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div className="logo-container">
          <Image
            src="/WhatsApp-Image-2026-06-21-at-09.51.08 (1).png"
            alt="Ambotakany Logo"
            width={52}
            height={52}
            className="logo-image"
          />
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}>
            Ambo<span style={{ color: theme.primary }}>takany</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className="theme-btn"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Mode clair" : "Mode sombre"}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
          <button
            className="secondary-btn"
            onClick={() => router.push(ROUTES.LOGIN)}
          >
            Connexion
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 48px",
        gap: 80,
      }}>
        {/* Texte */}
        <div style={{
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}>
          <h1
            className="animated"
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              animationDelay: "0.1s",
            }}
          >
            On transforme le blocage en{" "}
            <span style={{ color: theme.primary }}>destination réussie</span>
          </h1>

          <p
            className="animated"
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: theme.textMuted,
              animationDelay: "0.2s",
            }}
          >
            ARIA analyse le trafic en temps réel
            et trouve le meilleur itinéraire pour vous.
          </p>

          <div style={{
            display: "flex",
            gap: 16,
            paddingTop: 8,
          }}>
            <button
              className="cta-btn"
              onClick={() => router.push(ROUTES.LOGIN)}
            >
              Commencer
            </button>

            <button
              className="secondary-btn"
              onClick={() => router.push(ROUTES.DASHBOARD)}
            >
              Démo
            </button>
          </div>

          <div
            className="animated"
            style={{
              display: "flex",
              gap: 32,
              paddingTop: 16,
              fontSize: 14,
              color: theme.textLight,
              animationDelay: "0.6s",
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>7K+</div>
              <div>Taxi-be</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>82</div>
              <div>Lignes</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>42min</div>
              <div>Économisées</div>
            </div>
          </div>
        </div>

        {/* Orbe */}
        <div
          className="animated"
          style={{
            animationDelay: "0.3s",
          }}
        >
          <ARIAOrb isDark={isDark} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "20px 48px",
        borderTop: `1px solid ${theme.border}`,
        fontSize: 13,
        color: theme.textLight,
        textAlign: "center",
      }}>
        © 2026 Ambotakany · Antananarivo, Madagascar
      </footer>
    </div>
  );
}