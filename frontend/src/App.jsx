import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import MapView from "./components/MapView.jsx";
import HospitalCard from "./components/HospitalCard.jsx";
import SearchBar from "./components/SearchBar.jsx";
import { getFloodMask } from "./api/flood.js";
import { getNearestHospital } from "./api/hospital.js";

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [radius, setRadius] = useState(20);
  const [floodPolygon, setFloodPolygon] = useState(null);
  const [transtarGeom, setTranstarGeom] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [panTo, setPanTo] = useState(null);

  // Simulation UI state
  const [simulate, setSimulate] = useState(false);
  const [simRadiusM, setSimRadiusM] = useState(600);
  const [simOffsetM, setSimOffsetM] = useState(20);
  const [tubeM, setTubeM] = useState(75);
  const [simCenter, setSimCenter] = useState(null);      // [lat, lon]
  const [placingFlood, setPlacingFlood] = useState(false);
  const [simPolygon, setSimPolygon] = useState(null);    // backend returned

  useEffect(() => {
    getFloodMask().then((js) => {
      setFloodPolygon(js.polygon || null);
      setTranstarGeom(js.transtar || null);
    }).catch(() => {});
  }, []);

  const handleMapClick = (latlng) => {
    if (placingFlood && simulate) {
      setSimCenter(latlng);              // set flood center anywhere
    } else {
      setOrigin(latlng);                 // normal click sets origin
    }
  };

  const runSearch = async () => {
    if (!origin) return;
    setBusy(true);
    setResult(null);
    setSimPolygon(null);
    try {
      const js = await getNearestHospital(origin[0], origin[1], radius, {
        simulate,
        simRadiusM,
        simOffsetM,
        simCenter,   // optional; if absent, backend uses route-based tangent placement
        tubeM,
      });
      setResult(js);
      setSimPolygon(js.sim_polygon || null);
    } catch (e) {
      alert("Error finding hospital");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Header />

      <div className="row" style={{ paddingTop: 8 }}>
        <SearchBar onPick={(latlon) => { setOrigin(latlon); setPanTo(latlon); }} />
      </div>

      <div className="row">
        <label>Search radius (km):{" "}
          <select value={radius} onChange={(e)=>setRadius(parseInt(e.target.value,10))}>
            {[5,10,15,20,30,40,50].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        {/* Simulation controls */}
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
                onChange={(e)=>setSimRadiusM(parseInt(e.target.value,10)||600)}
                style={{ width: 90 }}
              />
            </label>

            <label className="pill" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Offset (m):
              <input
                type="number" min={0} max={200} step={10}
                value={simOffsetM}
                onChange={(e)=>setSimOffsetM(parseInt(e.target.value,10)||20)}
                style={{ width: 80 }}
              />
            </label>

            <label className="pill" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              Tube (m):
              <input
                type="number" min={25} max={200} step={5}
                value={tubeM}
                onChange={(e)=>setTubeM(parseInt(e.target.value,10)||75)}
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
      </div>

      <MapView
        onClick={handleMapClick}
        floodPolygon={floodPolygon}
        transtarGeom={transtarGeom}
        routeGeom={result?.route?.geometry || null}
        origin={origin}
        hospital={result?.best || null}
        panTo={panTo}
        simPolygon={simPolygon}                 // backend polygon (geojson)
        simPreviewCenter={simCenter}            // local preview
        simPreviewRadiusM={simulate ? simRadiusM : null}
      />

      <div className="row">
        <button className="button" onClick={runSearch} disabled={!origin || busy}>
          {busy ? "Searching…" : "Find nearest safe hospital"}
        </button>
        {!origin && <span className="muted">Tip: click the map or search an address to set origin.</span>}
      </div>

      <HospitalCard data={result} />

      <div className="row"><span className="muted">
        Data sources: OpenStreetMap (hospitals via Overpass), NWS alerts (+TranStar), OSRM routing.
      </span></div>
    </div>
  );
}
