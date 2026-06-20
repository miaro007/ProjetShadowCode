import { CongestionPoint, AlertItem } from "@/types/dashboard";

export function generateCongestionHistory(): CongestionPoint[] {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 60000);
    const h = d.getHours();
    const m = d.getMinutes();
    const isRushMorning = (h === 6 && m >= 30) || (h >= 7 && h < 9);
    const isRushEvening = (h === 16 && m >= 30) || (h >= 17 && h < 20);
    let base = 180;
    if (isRushMorning) base = 720;
    if (isRushEvening) base = 850;
    const noise = Math.floor((Math.random() - 0.5) * 120);
    const vehicules = Math.max(50, base + noise);
    const vitesse = Math.max(5, Math.min(60, 3500 / vehicules));
    return {
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      vehicules,
      vitesse: Math.round(vitesse),
      minute: i,
    };
  });
}

export function alertIcon(type: AlertItem["type"]): string {
  const icons = { accident: "🚨", travaux: "🚧", taxibe: "🚌", manifestation: "⚠️", pluie: "🌧️", info: "ℹ️" };
  return icons[type];
}

export function timeAgo(timestamp: Date): string {
  const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${minutes % 60 > 0 ? String(minutes % 60).padStart(2, '0') : ''}`;
  return `${Math.floor(hours / 24)}j`;
}

export function getGreeting(hour: number): string {
  if (hour < 5) return "Bonne nuit";
  if (hour < 12) return "Salama";
  if (hour < 18) return "Bon après-midi";
  if (hour < 22) return "Bonsoir";
  return "Bonne soirée";
}

export function resolveLocation(lat: number, lng: number): string {
  if (lat < -19.1 || lat > -18.7 || lng < 47.4 || lng > 47.7) return "Hors Antananarivo";
  if (lat > -18.87 && lng > 47.53) return "Analamahitsy";
  if (lat > -18.90 && lat < -18.87) return "Ankorondrano";
  if (lat > -18.92 && lat < -18.90) return "Analakely";
  if (lat > -18.94 && lng < 47.52) return "Andohatapenaka";
  if (lng < 47.50) return "Anosizato";
  if (lat < -18.94) return "Tanjombato";
  return "Antananarivo";
}
