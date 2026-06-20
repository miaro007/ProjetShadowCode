export const db = {
  location: {
    current: "Andrainjato, Fianarantsoa",
  },

  traffic: [
    {
      zone: "Andrainjato",
      level: "MEDIUM",
      congestion: 58,
      avgSpeed: 24,
      delay: 7,
      cause: "Flux étudiant + taxis-brousse",
    },
    {
      zone: "Centre-ville Fianarantsoa",
      level: "HIGH",
      congestion: 86,
      avgSpeed: 9,
      delay: 26,
      cause: "Heure de pointe + marché",
    },
    {
      zone: "Ambozontany",
      level: "LOW",
      congestion: 22,
      avgSpeed: 42,
      delay: 3,
      cause: "Circulation fluide",
    },
  ],

  destinations: [
    {
      name: "Université de Fianarantsoa",
      distanceKm: 2.4,
      baseTime: 9,
      trafficImpact: "LOW",
      route: ["Andrainjato", "Université"],
    },
    {
      name: "Gare Fianarantsoa",
      distanceKm: 4.6,
      baseTime: 16,
      trafficImpact: "MEDIUM",
      route: ["Andrainjato", "Centre-ville", "Gare"],
    },
    {
      name: "Hôpital CHU Fianarantsoa",
      distanceKm: 5.1,
      baseTime: 18,
      trafficImpact: "HIGH",
      route: ["Andrainjato", "Ambozontany", "CHU"],
    },
  ],

  incidents: [
    {
      location: "Centre-ville Fianarantsoa",
      type: "Accident",
      impact: "Blocage partiel voie principale",
    },
  ],
};