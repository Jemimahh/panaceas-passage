import requests
from utils.cache import transtar_cache
from config import TRANSTAR_API_URL
from utils.errors import ServiceError
def get_transtar_points():
    """
    Fetches and returns a list of (lat, lon) tuples for active flood sensors
    from the Houston TranStar API.

    This function caches the results to avoid excessive API calls. It filters
    for sensors that have a "stream elevation alert" to only return points
    that are actively reporting flooding.
    """
    key = "transtar_alert_points"
    if key in transtar_cache:
        return transtar_cache[key]

    try:
        r = requests.get(TRANSTAR_API_URL, timeout=15)
        r.raise_for_status()  # Raise an exception for bad status codes
        data = r.json()

        points = []
        # The API returns a dictionary with a 'result' key containing the list of sensors
        for item in data.get("result", []):
            # We only want to include points that are actively alerting
            if item.get("IsStreamElevationAlert") == "True":
                lat = item.get("Latitude")
                lon = item.get("Longitude")
                if lat is not None and lon is not None:
                    points.append((float(lat), float(lon)))

        transtar_cache[key] = points
        return points
    except (requests.RequestException, ValueError) as e:
        raise ServiceError("TranStar", e)
