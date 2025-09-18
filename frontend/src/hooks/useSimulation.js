import { useState } from "react";

export function useSimulation() {
  const [simulate, setSimulate] = useState(false);
  const [simRadiusM, setSimRadiusM] = useState(600);
  const [simOffsetM, setSimOffsetM] = useState(20);
  const [tubeM, setTubeM] = useState(75);
  const [simCenter, setSimCenter] = useState(null);      // [lat, lon]
  const [placingFlood, setPlacingFlood] = useState(false);
  const [simPolygon, setSimPolygon] = useState(null);    // backend returned

  const simulationParams = {
    simulate,
    simRadiusM,
    simOffsetM,
    simCenter,
    tubeM,
  };

  const resetSimulation = () => {
    setSimPolygon(null);
  };

  return {
    // State
    simulate,
    simRadiusM,
    simOffsetM,
    tubeM,
    simCenter,
    placingFlood,
    simPolygon,
    simulationParams,

    // Updaters
    setSimulate,
    setSimRadiusM,
    setSimOffsetM,
    setTubeM,
    setSimCenter,
    setPlacingFlood,
    setSimPolygon,
    resetSimulation,
  };
}
