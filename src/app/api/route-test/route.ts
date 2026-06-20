export async function getCoordinates(place: string) {
  const url =
    "https://api.openrouteservice.org/geocode/search?" +
    new URLSearchParams({
      api_key: process.env.ORS_API_KEY!,
      text: place,
      size: "1",
    });

  const res = await fetch(url);

  const data = await res.json();

  const coords =
    data.features?.[0]?.geometry?.coordinates;

  if (!coords) {
    return null;
  }

  return {
    lng: coords[0],
    lat: coords[1],
  };
}