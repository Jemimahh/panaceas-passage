import React from 'react';

export function SimulationControls({ simulation }) {
  const {
    simulate,
    simRadiusM,
    simOffsetM,
    tubeM,
    simCenter,
    placingFlood,
    setSimulate,
    setSimRadiusM,
    setSimOffsetM,
    setTubeM,
    setPlacingFlood,
  } = simulation;

  return (
    <>
      <label className="pill" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={simulate}
          onChange={(e) => setSimulate(e.target.checked)}
        />
        Simulate flood
      </label>

      {simulate && (
        <>
          <label className="pill" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Radius (m):
            <input
              type="number" min={200} max={3000} step={50}
              value={simRadiusM}
              onChange={(e) => setSimRadiusM(parseInt(e.target.value, 10) || 600)}
              style={{ width: 90 }}
            />
          </label>

          <label className="pill" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Offset (m):
            <input
              type="number" min={0} max={200} step={10}
              value={simOffsetM}
              onChange={(e) => setSimOffsetM(parseInt(e.target.value, 10) || 20)}
              style={{ width: 80 }}
            />
          </label>

          <label className="pill" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            Tube (m):
            <input
              type="number" min={25} max={200} step={5}
              value={tubeM}
              onChange={(e) => setTubeM(parseInt(e.target.value, 10) || 75)}
              style={{ width: 70 }}
            />
          </label>

          <button
            type="button"
            className="button"
            onClick={() => setPlacingFlood(v => !v)}
            style={{ background: placingFlood ? "#7B1FA2" : undefined }}
          >
            {placingFlood ? "Click map to set flood center" : "Place flood center on map"}
          </button>

          {simCenter && (
            <span className="pill">
              Flood center: {simCenter[0].toFixed(5)}, {simCenter[1].toFixed(5)}
            </span>
          )}
        </>
      )}
    </>
  );
}
