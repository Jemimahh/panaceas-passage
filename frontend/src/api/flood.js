export async function getFloodMask(bbox) {
    const q = bbox ? `?bbox=${bbox.join(",")}` : "";
    const r = await fetch(`/api/flood-mask${q}`);
    if (!r.ok) throw new Error(`flood-mask failed: ${r.status}`);
    return r.json();
}