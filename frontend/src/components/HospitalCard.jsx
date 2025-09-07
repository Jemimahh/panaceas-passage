export default function HospitalCard({ data }) {
    if (!data?.best) return null;
    const { best, route, origin, warning } = data;
    const gmaps = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${best.lat},${best.lon}&travelmode=driving`;


    return (
        <div className="row">
            <span className="pill">
                Nearest safe hospital: <b>{best.name}</b>
                {route?.distance_km != null && <> — {route.distance_km.toFixed(1)} km</>}
                {route?.duration_min != null && <> · {Math.round(route.duration_min)} min</>}
            </span>
            <a className="pill" href={gmaps} target="_blank" rel="noreferrer">Open in Google Maps</a>
            {warning && <span className="pill bad">{warning}</span>}
        </div>
    );
}