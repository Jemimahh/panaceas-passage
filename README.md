# Panacea’s Passage

Flood-aware hospital routing for Houston, TX. This project combines a Flask backend with a React/Leaflet frontend to help users find the safest hospital routes, avoiding flooded zones and risky roads.

## Features

- Search for the nearest hospital, avoiding flood zones and flood-prone roads.
- Interactive map with flood polygons, TranStar sensor points, and route visualization.
- Address search and map click to set origin.
- Simulate flood scenarios for risk analysis.
- Data sources: OpenStreetMap (hospitals), NWS alerts, TranStar sensors, OSRM routing.
## Planned Features

- Integration of Houston TranStar road flood sensor gages for real-time flood detection and routing.
## Project Structure

```
backend/
  app.py                # Flask app entrypoint
  config.py             # Config/constants
  requirements.txt      # Python dependencies
  routes/               # API endpoints (hospital, flood, geocode, health)
  services/             # Data integrations (OSM, OSRM, NWS, TranStar, FIM)
  utils/                # Geo and cache utilities

frontend/
  index.html            # Main HTML
  package.json          # Node dependencies/scripts
  vite.config.js        # Vite config
  src/                  # React app (App.jsx, components, api, styles)
```

## Getting Started

### Backend

1. Install Python dependencies:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
2. Run the Flask server:
    ```bash
    python app.py
    ```
   The backend runs on `http://localhost:5001`.

### Frontend

1. Install Node dependencies:
    ```bash
    cd frontend
    npm install
    ```
2. Start the development server:
    ```bash
    npm run dev
    ```
   The frontend runs on `http://localhost:5173` and proxies API requests to the backend.

## Usage

- Open the frontend in your browser.
- Click on the map or search for an address to set your location.
- Adjust search radius and simulation options as needed.
- Click "Find nearest safe hospital" to view the safest route.

## Data Sources

- **Hospitals:** OpenStreetMap via Overpass API
- **Flood Alerts:** NWS API
- **Road Flood Sensors:** Houston TranStar
- **Routing:** OSRM public server

## License

MIT License

---

For questions or contributions, open an issue or submit a pull request on GitHub.
