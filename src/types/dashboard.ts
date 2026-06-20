export interface CongestionPoint {
  time: string;
  vehicules: number;
  vitesse: number;
  minute: number;
}

export interface AlertItem {
  id: number;
  type: "accident" | "travaux" | "taxibe" | "manifestation" | "pluie" | "info";
  zone: string;
  message: string;
  timestamp: Date;
  confirmations: number;
  severity: "critique" | "élevé" | "modéré" | "info";
  reportedBy?: string;
}

export interface TrajetItem {
  id: number;
  label: string;
  from: string;
  to: string;
  distance: string;
  durationNormal: string;
  durationCurrent: string;
  icon: string;
  status: "fluide" | "dense" | "bloqué";
  savings?: string;
  transportType: "voiture" | "taxibe" | "marche" | "mixte";
}

export interface HotZone {
  id: number;
  name: string;
  lat: number;
  lng: number;
  level: number;
  vehicleCount: number;
  avgSpeed: number;
  trend: "increasing" | "stable" | "decreasing";
  alternativeRoute?: string;
}
