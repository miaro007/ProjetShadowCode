import { HotZone, TrajetItem, AlertItem } from "@/types/dashboard";

export const COLORS = {
  bg: "#0A0E1A",         // Noir profond
  primary: "#00E5A0",    // Vert électrique
  warn: "#FFB800",       // Ambre/Or
};

export const ZONES_CRITIQUES: HotZone[] = [
  { id: 1, name: "Route des Hydrocarbures", lat: -18.9005, lng: 47.5162, level: 98, vehicleCount: 847, avgSpeed: 4, trend: "increasing", alternativeRoute: "Contournement par Ambodivona" },
  { id: 2, name: "Analamahitsy (carrefour)", lat: -18.8712, lng: 47.5412, level: 94, vehicleCount: 623, avgSpeed: 7, trend: "stable", alternativeRoute: "Via Ambohitrarahaba" },
  { id: 3, name: "Ankorondrano - 67Ha", lat: -18.8948, lng: 47.5289, level: 87, vehicleCount: 512, avgSpeed: 12, trend: "decreasing" },
  { id: 4, name: "Andohatapenaka", lat: -18.9241, lng: 47.5081, level: 76, vehicleCount: 389, avgSpeed: 18, trend: "stable" },
  { id: 5, name: "Mahazo - Behoririka", lat: -18.9184, lng: 47.4921, level: 71, vehicleCount: 294, avgSpeed: 15, trend: "increasing" },
  { id: 6, name: "Ambanidia (Tunnel)", lat: -18.9087, lng: 47.5234, level: 68, vehicleCount: 278, avgSpeed: 22, trend: "stable" },
  { id: 7, name: "Anosizato Est", lat: -18.9312, lng: 47.4989, level: 59, vehicleCount: 187, avgSpeed: 28, trend: "decreasing" },
  { id: 8, name: "By-Pass (Tanjombato)", lat: -18.9621, lng: 47.4812, level: 32, vehicleCount: 94, avgSpeed: 52, trend: "stable", alternativeRoute: "✅ Route alternative recommandée" },
];

export const TRAJETS_QUOTIDIENS: TrajetItem[] = [
  { id: 1, label: "Maison → Travail", from: "Ivandry", to: "Analakely", distance: "8.4 km", durationNormal: "18 min", durationCurrent: "52 min", icon: "🏢", status: "bloqué", savings: "Départ 6h45 = -34 min", transportType: "voiture" },
  { id: 2, label: "Courses au marché", from: "Analakely", to: "Andravoahangy", distance: "3.2 km", durationNormal: "8 min", durationCurrent: "11 min", icon: "🛒", status: "dense", transportType: "marche" },
  { id: 3, label: "Retour domicile", from: "Analakely", to: "Ivandry", distance: "8.4 km", durationNormal: "18 min", durationCurrent: "1h14", icon: "🏠", status: "bloqué", savings: "Départ 18h45 = -47 min", transportType: "taxibe" },
  { id: 4, label: "Visite famille", from: "Ivandry", to: "Ambohimanarina", distance: "12.1 km", durationNormal: "25 min", durationCurrent: "28 min", icon: "👨‍👩‍👧", status: "fluide", transportType: "voiture" },
];

export const ALERTS_INITIALES: AlertItem[] = [
  { id: 1, type: "accident", zone: "Anosy (Tunnel)", message: "Collision 3 véhicules – voie gauche fermée. Détour par Mahamasina.", timestamp: new Date(Date.now() - 8 * 60000), confirmations: 34, severity: "critique", reportedBy: "Police Tana" },
  { id: 2, type: "travaux", zone: "Ambohimiandra", message: "Nid-de-poule ÉNORME. Circulation au compte-gouttes.", timestamp: new Date(Date.now() - 47 * 60000), confirmations: 28, severity: "élevé" },
  { id: 3, type: "taxibe", zone: "Ligne 154 (Ivato-Analakely)", message: "Retard important – panne mécanique. Attente 20 min.", timestamp: new Date(Date.now() - 12 * 60000), confirmations: 7, severity: "modéré" },
  { id: 4, type: "pluie", zone: "Haute-Ville (Faravohitra)", message: "Forte pluie – routes glissantes signalées.", timestamp: new Date(Date.now() - 5 * 60000), confirmations: 12, severity: "élevé" },
  { id: 5, type: "info", zone: "By-Pass Sud", message: "✅ Circulation fluide ! Route recommandée.", timestamp: new Date(Date.now() - 3 * 60000), confirmations: 19, severity: "info" },
  { id: 6, type: "manifestation", zone: "Analakely - 13 Mai", message: "Manifestation étudiante. Avenue fermée jusqu'à 16h.", timestamp: new Date(Date.now() - 92 * 60000), confirmations: 41, severity: "critique" },
];
