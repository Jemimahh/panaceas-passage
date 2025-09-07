export async function getNearestHospital(lat, lon, radiusKm = 20, opts = {}) {
  const params = new URLSearchParams({ lat, lon, radius_km: radiusKm });

  // simulation & tube options
  if (opts.tubeM != null) params.set("tube_m", String(opts.tubeM));
  if (opts.simulate) {
    params.set("simulate", "1");
    if (opts.simRadiusM != null) params.set("sim_radius_m", String(opts.simRadiusM));
    if (opts.simOffsetM != null) params.set("sim_offset_m", String(opts.simOffsetM));
    if (opts.simCenter) {
      const [sLat, sLon] = opts.simCenter;
      params.set("sim_lat", String(sLat));
      params.set("sim_lon", String(sLon));
    }
  }

  const r = await fetch(`/api/nearest-hospital?${params.toString()}`);
  if (!r.ok) throw new Error("nearest-hospital failed");
  return r.json();
}
