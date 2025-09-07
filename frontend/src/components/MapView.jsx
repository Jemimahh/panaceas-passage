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
  const mapRef = useRef(null);
  const layersRef = useRef({});

  // Init map
  useEffect(() => {
    const map = L.map("map").setView([29.7604, -95.3698], 11);

    // Carto Positron tiles (Google-like)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; OSM &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    map.on("click", (e) => onClick && onClick([e.latlng.lat, e.latlng.lng]));
    mapRef.current = map;
    return () => map.remove();
  }, [onClick]);

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

  return <div id="map" />;
}
