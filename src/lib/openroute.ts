const API_KEY = process.env.OPENROUTESERVICE_API_KEY!;

type LatLng = {
  lat: number;
  lng: number;
};

export async function getRoute(destination: string, location?: LatLng | null) {
  if (!location) return null;

  const geo = await fetch(
    `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(
      destination + " Madagascar"
    )}`
  );

  const geoData = await geo.json();
  const place = geoData.features?.[0];

  if (!place) return null;

  const destLng = place.geometry.coordinates[0];
  const destLat = place.geometry.coordinates[1];

  const route = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [location.lng, location.lat],
          [destLng, destLat],
        ],
      }),
    }
  );

  const data = await route.json();
  const summary = data.routes?.[0]?.summary;

  if (!summary) return null;

  return {
    destination,
    distanceKm: (summary.distance / 1000).toFixed(1),
    durationMin: Math.round(summary.duration / 60),
  };
}