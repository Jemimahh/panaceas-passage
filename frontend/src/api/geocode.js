export async function geocode(q, limit = 5) {
    if (!q?.trim()) return [];
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!r.ok) return [];
    const js = await r.json();
    return js.results || [];
}
