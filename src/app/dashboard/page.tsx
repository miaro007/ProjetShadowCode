"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";
import AIAssistant from "@/components/AIAssistant";
import {
  Zap, Droplet, Phone, Bus, Heart, MapPin,
  Wallet, TrendingUp, LogOut, Bell, ArrowUpRight,
  ShoppingCart, Users, Activity, ChevronRight,
  Globe, Shield, Sparkles
} from "lucide-react";

// ─── Shimmer Block ─────────────────────────────────────────────────
function Shimmer({ width = "100%", height = "16px", radius = "8px", style = {} }: {
  width?: string; height?: string; radius?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      flexShrink: 0,
      ...style,
    }} />
  );
}

// ─── Skeleton Dashboard ────────────────────────────────────────────
function SkeletonDashboard() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Top bar skeleton */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,15,30,0.9)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Shimmer width="20px" height="20px" radius="50%" />
          <Shimmer width="100px" height="18px" />
          <Shimmer width="40px" height="18px" radius="999px" />
        </div>
        <Shimmer width="80px" height="14px" />
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Shimmer width="28px" height="28px" radius="50%" />
          <Shimmer width="32px" height="32px" radius="50%" />
          <Shimmer width="70px" height="14px" />
          <Shimmer width="80px" height="32px" radius="8px" />
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Hero row skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", marginBottom: "32px" }}>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "24px", padding: "36px",
            display: "flex", flexDirection: "column", gap: "24px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Shimmer width="160px" height="11px" />
              <Shimmer width="320px" height="36px" radius="10px" />
              <Shimmer width="260px" height="36px" radius="10px" />
              <Shimmer width="400px" height="14px" style={{ marginTop: "8px" }} />
              <Shimmer width="320px" height="14px" />
            </div>
            <Shimmer width="100%" height="38px" radius="999px" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Shimmer width="60px" height="10px" />
                    <Shimmer width="16px" height="16px" radius="4px" />
                  </div>
                  <Shimmer width="90px" height="26px" radius="6px" />
                  <Shimmer width="70px" height="10px" />
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "24px", padding: "20px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px",
          }}>
            <Shimmer width="280px" height="280px" radius="50%" />
            <Shimmer width="180px" height="10px" />
          </div>
        </div>

        {/* AI Insight skeleton */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px", padding: "18px 20px",
          display: "flex", gap: "14px", alignItems: "flex-start",
          marginBottom: "28px",
        }}>
          <Shimmer width="36px" height="36px" radius="10px" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <Shimmer width="120px" height="10px" />
            <Shimmer width="100%" height="14px" />
            <Shimmer width="75%" height="14px" />
          </div>
        </div>

        {/* Services skeleton */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <Shimmer width="140px" height="12px" />
            <Shimmer width="100px" height="12px" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <Shimmer width="44px" height="44px" radius="12px" />
                <Shimmer width="80px" height="14px" />
                <Shimmer width="110px" height="11px" />
                <Shimmer width="60px" height="10px" style={{ marginTop: "4px" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <Shimmer width="100px" height="12px" style={{ marginBottom: "16px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <Shimmer width="36px" height="36px" radius="10px" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <Shimmer width="100px" height="13px" />
                    <Shimmer width="140px" height="11px" />
                  </div>
                  <Shimmer width="14px" height="14px" radius="4px" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Shimmer width="120px" height="12px" style={{ marginBottom: "16px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <Shimmer width="36px" height="36px" radius="50%" />
                  <Shimmer width="90px" height="11px" />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Shimmer width="16px" height="16px" radius="4px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <Shimmer width="100px" height="11px" />
                <Shimmer width="160px" height="10px" />
              </div>
            </div>
          </div>
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}

// ─── Globe Canvas ─────────────────────────────────────────────────
function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    let animId: number;

    const points = Array.from({ length: 18 }, () => ({
      lat: (Math.random() - 0.5) * 140,
      lng: (Math.random() - 0.5) * 360,
      pulse: Math.random() * Math.PI * 2,
    }));

    const connections = [
      [0, 3], [1, 5], [2, 7], [4, 8], [6, 9],
      [3, 10], [7, 11], [5, 12], [0, 13], [8, 14],
    ];

    function project(lat: number, lng: number, rot: number, cx: number, cy: number, r: number) {
      const phi = (lat * Math.PI) / 180;
      const theta = ((lng + rot) * Math.PI) / 180;
      const x = r * Math.cos(phi) * Math.sin(theta);
      const y = r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.cos(theta);
      return { x: cx + x, y: cy - y, z };
    }

    function draw() {
      if (!canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.38;
      const rot = frame * 0.15;

      ctx.clearRect(0, 0, W, H);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 212, 164, 0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 5) {
          const p = project(lat, lng, rot, cx, cy, r);
          if (p.z > 0) lng === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(0, 212, 164, 0.07)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lng, rot, cx, cy, r);
          if (p.z > 0) lat === -90 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(0, 212, 164, 0.07)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      connections.forEach(([a, b]) => {
        const pa = project(points[a].lat, points[a].lng, rot, cx, cy, r);
        const pb = project(points[b].lat, points[b].lng, rot, cx, cy, r);
        if (pa.z > 0 && pb.z > 0) {
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          const mx = (pa.x + pb.x) / 2 + (Math.random() - 0.5) * 20;
          const my = (pa.y + pb.y) / 2 - 20;
          ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.15 + 0.1 * Math.sin(frame * 0.05 + a)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });

      points.forEach((pt) => {
        const p = project(pt.lat, pt.lng, rot, cx, cy, r);
        if (p.z > 0) {
          const pulse = Math.sin(frame * 0.08 + pt.pulse);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 + pulse * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 212, 164, ${0.3 + pulse * 0.2})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#00D4A4";
          ctx.fill();
        }
      });

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={320} height={320} style={{ display: "block" }} />;
}

// ─── Ticker ───────────────────────────────────────────────────────
const TRANSACTIONS = [
  { from: "Dakar", to: "Abidjan", amount: "12 500 FCFA", type: "Transfert" },
  { from: "Lagos", to: "Accra", amount: "8 200 FCFA", type: "Airtime" },
  { from: "Nairobi", to: "Lomé", amount: "31 000 FCFA", type: "Facture" },
  { from: "Douala", to: "Cotonou", amount: "5 750 FCFA", type: "Transport" },
  { from: "Bamako", to: "Dakar", amount: "19 400 FCFA", type: "Transfert" },
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % TRANSACTIONS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const tx = TRANSACTIONS[idx];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 16px",
      background: "rgba(0,212,164,0.08)",
      border: "1px solid rgba(0,212,164,0.2)",
      borderRadius: "999px",
      fontSize: "13px",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#00D4A4",
        boxShadow: "0 0 6px #00D4A4",
        flexShrink: 0,
        animation: "pulse-dot 1.5s infinite",
      }} />
      <span style={{ color: "rgba(255,255,255,0.5)" }}>LIVE</span>
      <span style={{ color: "rgba(255,255,255,0.85)" }}>
        {tx.type} · {tx.from} → {tx.to}
      </span>
      <span style={{ color: "#F59E0B", fontWeight: 600, marginLeft: "auto" }}>{tx.amount}</span>
    </div>
  );
}

// ─── Service Card ──────────────────────────────────────────────────
interface SvcProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  badge?: string;
  onClick: () => void;
}
function SvcCard({ icon, title, desc, accent, badge, onClick }: SvcProps) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? `linear-gradient(135deg, rgba(${accent},0.18) 0%, rgba(${accent},0.06) 100%)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid rgba(${accent}, ${hov ? 0.5 : 0.15})`,
        borderRadius: "16px",
        padding: "20px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.25s ease",
        transform: hov ? "translateY(-3px)" : "none",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {badge && (
        <span style={{
          position: "absolute", top: 12, right: 12,
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em",
          padding: "3px 8px", borderRadius: "999px",
          background: `rgba(${accent},0.2)`,
          color: `rgb(${accent})`,
          border: `1px solid rgba(${accent},0.3)`,
        }}>{badge}</span>
      )}
      <div style={{
        width: 44, height: 44, borderRadius: "12px",
        background: `rgba(${accent},0.15)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "14px",
        color: `rgb(${accent})`,
      }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>{desc}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: "4px",
        marginTop: "14px", fontSize: "12px",
        color: `rgba(${accent}, 0.8)`,
      }}>
        Accéder <ArrowUpRight size={12} />
      </div>
    </button>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "16px",
      padding: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <span style={{ fontSize: "12px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{label}</span>
        <div style={{ color: `rgb(${accent})`, opacity: 0.7 }}>{icon}</div>
      </div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "monospace" }}>{value}</div>
      <div style={{ marginTop: "6px", fontSize: "12px", color: `rgb(${accent})` }}>{sub}</div>
    </div>
  );
}

// ─── AI Insight Card ───────────────────────────────────────────────
const INSIGHTS = [
  "Vos dépenses en électricité ont baissé de 18% ce mois — félicitations !",
  "Pic de transactions prévu vendredi 18h–21h. Gardez du crédit mobile.",
  "3 voisins utilisent AfricaLife — invitez-les pour gagner 500 FCFA.",
  "Facture d'eau due dans 4 jours. Payez maintenant pour éviter les pénalités.",
];

function AIInsight() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % INSIGHTS.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(0,212,164,0.08) 100%)",
      border: "1px solid rgba(245,158,11,0.25)",
      borderRadius: "16px",
      padding: "18px 20px",
      display: "flex", gap: "14px", alignItems: "flex-start",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "10px",
        background: "rgba(245,158,11,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#F59E0B", flexShrink: 0,
      }}>
        <Sparkles size={18} />
      </div>
      <div>
        <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#F59E0B", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 }}>IA · Insight du jour</div>
        <div style={{
          fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: 1.5,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}>{INSIGHTS[idx]}</div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else { setUser(session.user as User); setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push("/login");
      else { setUser(session.user as User); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Lance le skeleton 3s après la fin du loading auth
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setReady(true), 3000);
      return () => clearTimeout(timer);
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

  // 1. Auth en cours → spinner
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0F1E",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px",
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "2px solid rgba(0,212,164,0.2)",
          borderTop: "2px solid #00D4A4",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", letterSpacing: "0.1em" }}>CHARGEMENT</p>
      </div>
    );
  }

  if (!user) return null;

  // 2. Auth OK mais skeleton pas encore terminé → skeleton shimmer 3s
  if (!ready) return <SkeletonDashboard />;

  // 3. Tout est prêt → vrai dashboard avec fade-in
  const displayName = user.email?.split("@")[0] ?? "Utilisateur";

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0F1E", color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      animation: "fade-in 0.7s ease",
    }}>
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.8)} }
        @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* Top bar */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,15,30,0.9)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Globe size={20} style={{ color: "#00D4A4" }} />
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>AfricaLife</span>
          <span style={{
            fontSize: "10px", padding: "2px 8px", borderRadius: "999px",
            background: "rgba(0,212,164,0.15)", color: "#00D4A4",
            border: "1px solid rgba(0,212,164,0.3)", letterSpacing: "0.05em", fontWeight: 600,
          }}>LIVE</span>
        </div>

        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
          {time.toLocaleTimeString("fr-FR")}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => {}}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "6px" }}
        >
          <Bell size={18} />
        </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #00D4A4, #F59E0B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 700, color: "#0A0F1E",
            }}>{displayName[0].toUpperCase()}</div>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)",
              borderRadius: "8px", color: "#FF6B6B", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", fontSize: "13px", fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <LogOut size={14} /> Quitter
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Hero row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px",
          marginBottom: "32px",
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(0,212,164,0.08) 0%, rgba(245,158,11,0.05) 100%)",
            border: "1px solid rgba(0,212,164,0.15)",
            borderRadius: "24px", padding: "36px",
            display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "24px",
          }}>
            <div>
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: "12px", textTransform: "uppercase" }}>
                Tableau de bord · Juin 2026
              </div>
              <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px" }}>
                Bonjour,{" "}
                <span style={{ background: "linear-gradient(90deg, #00D4A4, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {displayName}
                </span>{" "}👋
              </h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", lineHeight: 1.6, maxWidth: 420 }}>
                Vos finances, vos services, votre communauté — tout en un seul endroit, en temps réel.
              </p>
            </div>

            <LiveTicker />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <StatCard label="Solde" value="50 000" sub="+ 12% ce mois" accent="0,212,164" icon={<Wallet size={16} />} />
              <StatCard label="Transactions" value="23" sub="+ 8 vs mois passé" accent="245,158,11" icon={<Activity size={16} />} />
              <StatCard label="Économies" value="15 000" sub="+ 25% ce mois" accent="255,107,107" icon={<Heart size={16} />} />
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "24px", padding: "20px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px",
          }}>
            <GlobeCanvas />
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textAlign: "center", textTransform: "uppercase" }}>
              Réseau AfricaLife · 24 pays connectés
            </p>
          </div>
        </div>

        {/* AI Insight */}
        <div style={{ marginBottom: "28px" }}>
          <AIInsight />
        </div>

        {/* Services */}
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "14px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 500 }}>
              Services essentiels
            </h2>
            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
              Tous les services <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <SvcCard icon={<Zap size={20} />} title="Électricité" desc="Acheter des unités" accent="245,158,11" badge="POPULAIRE" onClick={() => router.push("/services/electricity")} />
            <SvcCard icon={<Droplet size={20} />} title="Eau" desc="Payer votre facture" accent="56,189,248" onClick={() => router.push("/services/water")} />
            <SvcCard icon={<Phone size={20} />} title="Crédit Mobile" desc="Recharge téléphone" accent="167,139,250" badge="NOUVEAU" onClick={() => router.push("/services/airtime")} />
            <SvcCard icon={<Bus size={20} />} title="Transport" desc="Réserver un trajet" accent="0,212,164" onClick={() => router.push("/services/transport")} />
          </div>
        </section>

        {/* Bottom row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <section>
            <h2 style={{ fontSize: "14px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 500, marginBottom: "16px" }}>
              Communauté
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { icon: <ShoppingCart size={18} />, title: "Marché Local", desc: "Produits frais, livraison rapide", accent: "245,158,11" },
                { icon: <MapPin size={18} />, title: "Adresses Utiles", desc: "Pharmacies, hôpitaux, stations", accent: "255,107,107" },
                { icon: <Users size={18} />, title: "Tontine Digitale", desc: "Épargne collective sécurisée", accent: "0,212,164" },
              ].map((item) => (
                <button key={item.title} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px", padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: "14px",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  transition: "border-color 0.2s",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "10px",
                    background: `rgba(${item.accent},0.15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: `rgb(${item.accent})`, flexShrink: 0,
                  }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{item.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: "14px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 500, marginBottom: "16px" }}>
              Actions rapides
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { icon: "💸", label: "Envoyer de l'argent", accent: "0,212,164" },
                { icon: "📄", label: "Payer une facture", accent: "245,158,11" },
                { icon: "🔍", label: "Trouver un service", accent: "167,139,250" },
                { icon: "💬", label: "Aide & Support", accent: "255,107,107" },
              ].map((a) => (
                <button key={a.label} onClick={() => alert("Fonctionnalité à venir")} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(${a.accent},0.2)`,
                  borderRadius: "14px", padding: "20px 16px",
                  cursor: "pointer", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                  transition: "all 0.2s", width: "100%",
                }}>
                  <span style={{ fontSize: "28px" }}>{a.icon}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: "12px",
              background: "rgba(0,212,164,0.05)",
              border: "1px solid rgba(0,212,164,0.12)",
              borderRadius: "14px", padding: "14px 16px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <Shield size={16} style={{ color: "#00D4A4", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Compte sécurisé</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Chiffrement bout-en-bout · Supabase Auth</div>
              </div>
              <TrendingUp size={14} style={{ marginLeft: "auto", color: "#00D4A4" }} />
            </div>
          </section>
        </div>
      </main>
      <AIAssistant /> 
    </div>
  );
}
