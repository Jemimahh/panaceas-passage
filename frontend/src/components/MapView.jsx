import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker assets
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom markers
const originIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const hospitalIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png",
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView({
  onClick,
  floodPolygon,
  transtarGeom,
  routeGeom,
  origin,
  hospital,
  panTo,
  simPolygon,           // backend-returned simulated flood polygon (geojson)
  simPreviewCenter,     // local preview center [lat, lon]
  simPreviewRadiusM,    // local preview radius in meters
}) {
  const mapContainerRef = useRef(null); // Reference to the DIV
  const mapRef = useRef(null);          // Reference to the Leaflet Map instance
  const layersRef = useRef({});         // Reference to active layers
  
  // Keep the latest onClick handler in a ref so we don't need to restart the map when it changes
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // Init map (Runs ONLY once)
  useEffect(() => {
    // 1. SAFETY CHECK: If map already exists, stop.
    if (mapRef.current) return;

    // 2. Initialize on the specific DOM element (not by ID)
    const map = L.map(mapContainerRef.current).setView([29.7604, -95.3698], 11);

    // Carto Positron tiles (Google-like)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; OSM &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    // Attach click listener using the Ref (stable)
    map.on("click", (e) => {
      if (onClickRef.current) {
        onClickRef.current([e.latlng.lat, e.latlng.lng]);
      }
    });

    mapRef.current = map;

    // 3. CLEANUP: Properly destroy map on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Empty dependency array = stable map

  // Update layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const Ls = layersRef.current;

    function setLayer(key, layer) {
      if (Ls[key]) map.removeLayer(Ls[key]);
      if (layer) {
        Ls[key] = layer.addTo(map);
      } else {
        delete Ls[key];
      }
    }

    // Flood polygon: red outline, blue fill
    if (floodPolygon) {
      setLayer(
        "flood",
        L.geoJSON(floodPolygon, {
          style: {
            color: "#D93025",
            weight: 2,
            fillColor: "#AECBFA",
            fillOpacity: 0.35,
          },
        })
      );
    } else setLayer("flood", null);

    // Local preview: circle in meters (before backend sim)
    if (simPreviewCenter && simPreviewRadiusM) {
      setLayer(
        "simPreview",
        L.circle(simPreviewCenter, {
          radius: simPreviewRadiusM,
          color: "#7B1FA2",
          weight: 2,
          fillColor: "#CE93D8",
          fillOpacity: 0.25,
        })
      );
    } else setLayer("simPreview", null);

    // Backend simulated flood polygon (purple)
    if (simPolygon) {
      setLayer(
        "sim",
        L.geoJSON(simPolygon, {
          style: {
            color: "#7B1FA2",
            weight: 2,
            fillColor: "#CE93D8",
            fillOpacity: 0.35,
          },
        })
      );
    } else setLayer("sim", null);

    // TranStar buffer: orange dashed
    if (transtarGeom) {
      setLayer(
        "transtar",
        L.geoJSON(transtarGeom, {
          style: {
            color: "#FB8C00",
            weight: 1.5,
            dashArray: "4,2",
            fillOpacity: 0.15,
          },
        })
      );
    } else setLayer("transtar", null);

    // Route: Google blue
    if (routeGeom) {
      const layer = L.geoJSON(routeGeom, {
        style: { color: "#1A73E8", weight: 5 },
      });
      setLayer("route", layer);
      try {
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      } catch { /* ignore */ }
    } else setLayer("route", null);

    // Origin marker
    if (origin)
      setLayer(
        "origin",
        L.marker(origin, { title: "Origin", icon: originIcon }).bindPopup("Origin")
      );
    else setLayer("origin", null);

    // Hospital marker
    if (hospital)
      setLayer(
        "hospital",
        L.marker([hospital.lat, hospital.lon], {
          title: hospital.name,
          icon: hospitalIcon,
        }).bindPopup(hospital.name)
      );
    else setLayer("hospital", null);
  }, [
    floodPolygon,
    transtarGeom,
    routeGeom,
    origin,
    hospital,
    simPolygon,
    simPreviewCenter,
    simPreviewRadiusM,
  ]);

  // Programmatic pan
  useEffect(() => {
    if (!panTo || !mapRef.current) return;
    const [lat, lon] = panTo;
    mapRef.current.setView([lat, lon], 14, { animate: true });
  }, [panTo]);

  // USE THE REF HERE, not ID
 // ... rest of the code ...

  // FIX: Use a fixed height (e.g., 600px) instead of 100%
  // or ensure your CSS defines a height for the map container.
  return (
    <div 
      id="map" 
      ref={mapContainerRef} 
      style={{ width: "100%", height: "600px", position: "relative" }} 
    />
  );
}
