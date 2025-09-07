import requests
from utils.cache import transtar_cache

# Public docs list several JSONs; if one changes, you can swap here.
# Placeholder: a common "roadway flood warning sites" JSON endpoint.
TRANSTAR_URL = "https://traffic.houstontranstar.org/data/floodwarning.json"

def roadway_flood_points():
    """
    Returns a list of (lat, lon) points for flood-prone or active warnings.
    If the endpoint differs, adjust parsing accordingly.
    """
    key = "transtar_points"
    if key in transtar_cache:
        return transtar_cache[key]

    try:
        r = requests.get(TRANSTAR_URL, timeout=15)
        js = r.json()
        points = []
        # Expecting list of objects with Lat/Lon or similar keys; adjust as needed
        for item in js:
            lat = item.get("Latitude") or item.get("lat")
            lon = item.get("Longitude") or item.get("lon")
            if lat and lon:
                points.append((float(lat), float(lon)))
        transtar_cache[key] = points
        return points
    except Exception:
        return []


def get_transtar_points():
    """
    Placeholder for Houston TranStar water gauge / sensor integration.
    Should return a list of (lat, lon) tuples for active flood sensors.
    """
    return []

