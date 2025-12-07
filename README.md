# Panacea’s Passage

**Flood-aware hospital routing & risk analysis for Houston, TX.**

Panacea's Passage is a full-stack application designed to help users navigate safely during flood events. It combines real-time data integration with AI-powered analysis to route users to the nearest safe hospital while avoiding known flood zones, risky roads, and active weather alerts.

## 🎥 Demo Video

**[Watch the Panacea Flood Agent Demo (Google Drive)](https://drive.google.com/drive/folders/1jAY5zL6YBnoxCPrZhJT0vBoWx2n5X1o0)**

## ✨ Features

- **Safe Routing:** Finds the nearest hospital while actively routing around flood polygons and flood-prone roads.
- **AI Flood Risk Agent:** Uses Google Gemini AI to analyze local weather data (NWS) and generate a plain-English risk assessment for any specific location.
- **Interactive Map:** Visualizes flood polygons, TranStar sensor points, hospital locations, and safe routes on a Leaflet map.
- **Reverse Geocoding:** Automatically identifies street names and neighborhoods when you click the map.
- **Simulation Mode:** Allows users to simulate flood scenarios ("High Risk Mode") to test routing and AI responses safely.

## 🛠️ Project Structure
backend/
  app.py                 # Flask application entry
  services/
    agent.py             # AI Flood Agent (Gemini + fallback logic)
  config.py              # Configuration & environment variable loading
  hospital.py            # Nearest-hospital lookup (Overpass API)
  flood.py               # Flood polygon / TranStar processing
  routes/                # API endpoints
  utils/                 # Geospatial helpers & caching
  requirements.txt       # Python dependencies

frontend/
  src/
    components/          # React components (MapView, HospitalCard, RiskCard...)
    api/                 # API wrappers for geocode, hospital, risk, flood data
    hooks/               # useSimulation, etc.
    App.jsx              # Main frontend logic
  vite.config.js         # Vite configuration (proxy to backend)


## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js & npm
- A Google Gemini API Key (for the AI Flood Agent)

### 1. Backend Setup

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```

2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `backend/` directory to store your API key securely.
    ```env
    # backend/.env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  Run the Flask server:
    ```bash
    python app.py or flask run
    ```
    The backend will start on `http://localhost:5000` (or `5001`).

### 2. Frontend Setup

1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```

2.  Install Node dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

## 📖 Usage

1.  **Set Your Location:** Click anywhere on the map or use the search bar to enter an address.
2.  **View Risk Analysis:** The "Flood Risk" card will instantly load, showing the current risk level, confidence score, and an AI-generated explanation based on NWS forecast data.
3.  **Find a Hospital:** Click "Find nearest safe hospital." The app will calculate a route that avoids known flood zones.
4.  **Simulation Mode:** Use the toggle controls to enable "Simulate High Flood Risk" to see how the system behaves under pressure.

## 📡 Data Sources

-   **Routing Engine:** OSRM (Open Source Routing Machine)
-   **Hospitals:** OpenStreetMap (via Overpass API)
-   **Flood Alerts & Weather:** National Weather Service (NWS) API
-   **AI Analysis:** Google Gemini 1.5 Flash / 2.0 Flash
-   **Geocoding:** Nominatim (OpenStreetMap)

## 📄 License

MIT License. See `LICENSE` for details.

---

**Note:** This is a student project and a simulation tool. It should not be used as the primary source of information during life-threatening emergency situations. Always follow official local guidance.