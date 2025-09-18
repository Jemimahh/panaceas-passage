import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import MapView from "./components/MapView.jsx";
import HospitalCard from "./components/HospitalCard.jsx";
import SearchBar from "./components/SearchBar.jsx";
import { SimulationControls } from "./components/SimulationControls.jsx";
import { getFloodMask } from "./api/flood.js";
import { getNearestHospital } from "./api/hospital.js";
import { useSimulation } from "./hooks/useSimulation.js";

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [radius, setRadius] = useState(20);
  const [floodPolygon, setFloodPolygon] = useState(null);
  const [transtarGeom, setTranstarGeom] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [panTo, setPanTo] = useState(null);

  const simulation = useSimulation();

  useEffect(() => {
    getFloodMask().then((js) => {
      setFloodPolygon(js.polygon || null);
      setTranstarGeom(js.transtar || null);
    }).catch(() => {});
  }, []);

  const handleMapClick = (latlng) => {
    if (simulation.placingFlood && simulation.simulate) {
      simulation.setSimCenter(latlng);
    } else {
      setOrigin(latlng);
    }
  };

  const runSearch = async () => {
    if (!origin) return;
    setBusy(true);
    setResult(null);
    simulation.resetSimulation();
    try {
      const js = await getNearestHospital(origin[0], origin[1], radius, simulation.simulationParams);
      setResult(js);
      simulation.setSimPolygon(js.sim_polygon || null);
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
          <select value={radius} onChange={(e) => setRadius(parseInt(e.target.value, 10))}>
            {[5, 10, 15, 20, 30, 40, 50].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <SimulationControls simulation={simulation} />
      </div>

      <MapView
        onClick={handleMapClick}
        floodPolygon={floodPolygon}
        transtarGeom={transtarGeom}
        routeGeom={result?.route?.geometry || null}
        origin={origin}
        hospital={result?.best || null}
        panTo={panTo}
        simPolygon={simulation.simPolygon}
        simPreviewCenter={simulation.simCenter}
        simPreviewRadiusM={simulation.simulate ? simulation.simRadiusM : null}
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
