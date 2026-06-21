"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";

// ─── Canvas ARIA Orb ──────────────────────────────────────────────
function ARIAOrb() {
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
      bg.addColorStop(0, "rgba(0,229,255,0.04)");
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
        ctx.fillStyle = "rgba(0,229,255,0.5)";
        ctx.fill();
      });

      // Orbe central
      const pulse = Math.sin(frame * 0.03) * 0.2 + 0.8;

      const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 40);
      glow.addColorStop(0, `rgba(0,229,255,${pulse})`);
      glow.addColorStop(1, "rgba(0,229,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(CX, CY, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(CX, CY, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#00E5FF";
      ctx.fill();

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

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

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0A0E1A",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: "#fff",
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
          color: #0A0E1A;
          background: #00E5FF;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
          animation: fadeIn 0.6s ease 0.4s both;
        }
        .cta-btn:hover {
          background: #33ECFF;
          transform: translateY(-2px);
        }

        .secondary-btn {
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 500;
          font-family: 'Space Grotesk', system-ui;
          color: #fff;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          animation: fadeIn 0.6s ease 0.5s both;
        }
        .secondary-btn:hover {
          border-color: #00E5FF;
          color: #00E5FF;
        }

        .animated {
          animation: fadeIn 0.6s ease both;
        }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "24px 48px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}>
          Ambo<span style={{ color: "#00E5FF" }}>takany</span>
        </div>

        <button
          className="secondary-btn"
          onClick={() => router.push(ROUTES.LOGIN)}
        >
          Connexion
        </button>
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
            Transforme le trafic en{" "}
            <span style={{ color: "#00E5FF" }}>opportunité</span>
          </h1>

          <p
            className="animated"
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.6)",
              animationDelay: "0.2s",
            }}
          >
            ARIA analyse le trafic d'Antananarivo en temps réel
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
              color: "rgba(255,255,255,0.4)",
              animationDelay: "0.6s",
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#00E5FF" }}>7K+</div>
              <div>Taxi-be</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#00E5FF" }}>82</div>
              <div>Lignes</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#00E5FF" }}>42min</div>
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
          <ARIAOrb />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "20px 48px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: 13,
        color: "rgba(255,255,255,0.3)",
        textAlign: "center",
      }}>
        © 2026 Ambotakany · Antananarivo, Madagascar
      </footer>
    </div>
  );
}