// src/api/panacea.js

// Call the Flask endpoint: GET /api/panacea/risk
// Params: lat, lon, hours, location, neighborhood (optional), sim mode
export async function fetchPanaceaRisk({
  lat,
  lon,
  hours = 6,
  location,
  neighborhood,
  mode,
}) {
  if (lat == null || lon == null) {
    throw new Error("lat and lon are required for flood risk");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    hours: String(hours),
  });

  if (location) params.set("location", location);
  if (neighborhood) params.set("neighborhood", neighborhood);
  if (mode) params.set("mode", mode);

  const res = await fetch(`/api/panacea/risk?` + params.toString());

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`panacea/risk failed (${res.status}): ${txt}`);
  }

  return res.json();
}
