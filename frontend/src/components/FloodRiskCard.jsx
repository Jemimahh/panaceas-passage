// src/components/FloodRiskCard.jsx

export default function FloodRiskCard({ data }) {
  // If no data yet, render nothing
  if (!data) return null;

  const { location, risk, summary, meta } = data;

  // --- DATA CLEANER (Fixes the Mismatch) ---

  // 1. Fix Location Label
  const locLabel =
    (location?.neighborhood && `${location.neighborhood}, ${location.name}`) ||
    location?.name ||
    "Selected location";

  // 2. Fix Risk Level (Accept 'level' OR 'risk_level')
  const displayLevel = risk?.level || risk?.risk_level || "unknown";

  // 3. Fix Confidence (Handle Numbers 0.9 AND Strings "High")
  let confidenceVal = 0;
  if (typeof risk?.confidence === "number") {
    confidenceVal = risk.confidence;
  } else if (typeof risk?.confidence === "string") {
    const txt = risk.confidence.toLowerCase();
    if (txt.includes("high")) confidenceVal = 0.95;
    else if (txt.includes("mod") || txt.includes("med")) confidenceVal = 0.6;
    else if (txt.includes("low")) confidenceVal = 0.2;
  }
  const confidencePct = Math.round(confidenceVal * 100);

  // --- RENDER ---

  return (
    <div className="row">
      {/* Main risk pill */}
      <span className="pill">
        Flood risk at <b>{locLabel}</b>:{" "}
        <b style={{ textTransform: "capitalize" }}>{displayLevel}</b>
        {confidencePct > 0 && <> · {confidencePct}% confidence</>}
      </span>

      {/* Key factors pill */}
      {risk?.key_factors && risk.key_factors.length > 0 && (
        <span className="pill">
          Key factors: {risk.key_factors.join("; ")}
        </span>
      )}

      {/* Trend & advice */}
      {summary && (
        <>
          <span className="pill">
            Trend: {summary.trend || "Analyzing trend..."}
          </span>
          <span className="pill">
            Advice: {summary.advice || "Please wait for details."}
          </span>
        </>
      )}

      {/* Disclaimer */}
      {meta?.disclaimer && (
        <span className="pill muted">{meta.disclaimer}</span>
      )}
    </div>
  );
}