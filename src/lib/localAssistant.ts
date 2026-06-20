import { db } from "./local-db";

export const localAssistant = (message: string) => {
  const msg = message.toLowerCase();

  // 🚦 TRAFIC
  if (msg.includes("trafic") || msg.includes("embouteillage")) {
    const high = db.traffic.filter(t => t.level === "HIGH");

    return {
      reply: `🚦 Trafic actuel à Fianarantsoa :

Zones critiques :
${high.map(t => `- ${t.zone} (${t.congestion}%)`).join("\n")}

📍 Position: ${db.location.current}`,
      action: "SHOW_TRAFFIC",
    };
  }

  // 🗺️ ITINÉRAIRE INTELLIGENT
  if (
    msg.includes("aller") ||
    msg.includes("itinéraire") ||
    msg.includes("route") ||
    msg.includes("destination") ||
    msg.includes("comment aller")
  ) {
    const destination =
      db.destinations.find(d =>
        msg.includes(d.name.toLowerCase())
      ) || db.destinations[0];

    const trafficFactor =
      destination.trafficImpact === "HIGH"
        ? 1.6
        : destination.trafficImpact === "MEDIUM"
        ? 1.3
        : 1;

    const estimated = Math.round(destination.baseTime * trafficFactor);

    return {
      reply: `🗺️ Itinéraire intelligent

📍 Départ: ${db.location.current}
🎯 Destination: ${destination.name}

📏 Distance: ${destination.distanceKm} km
⏱️ Temps estimé: ${estimated} min
🚦 Trafic: ${destination.trafficImpact}

🛣️ Route recommandée:
${destination.route.map(r => `→ ${r}`).join("\n")}`,
      action: "SHOW_ROUTE",
    };
  }

  // 🚨 INCIDENTS
  if (msg.includes("accident") || msg.includes("incident")) {
    const incident = db.incidents[0];

    return {
      reply: `🚨 Incident détecté

📍 ${incident.location}
⚠️ ${incident.impact}`,
      action: "REPORT_INCIDENT",
    };
  }

  return null;
};

export function extractDestination(message: string) {
  const text = message.toLowerCase();

  const triggers = [
    "aller à",
    "aller vers",
    "je veux aller à",
    "destination",
    "itinéraire vers",
    "route vers",
  ];

  for (const trigger of triggers) {
    if (text.includes(trigger)) {
      return text.split(trigger)[1]?.trim();
    }
  }

  return null;
}