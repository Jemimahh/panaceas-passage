from services.agent import (
    run_flood_agent_two_calls,
    register_feedback,
    run_panacea_flood_insight,
)
from flask import Blueprint, request, jsonify
from services.agent import run_flood_agent_two_calls, register_feedback

bp = Blueprint("agent", __name__)


@bp.get("/agent/predict")
def agent_predict_route():
    """
    HTTP endpoint for the flood agent.

    Query parameters:
      - lat (required, float, -90 to 90)
      - lon (required, float, -180 to 180)
      - hours (optional, int, default 6, clamped to [1, 48])
      - location (optional, str)

    Responsibilities:
      - Input validation (types + geographic ranges)
      - Boundary enforcement (safe bounds for lat/lon/hours)
      - Calling the agent core with structured input
      - Returning structured JSON output

    This directly supports:
      - "Input Processing" requirement
      - "Safety and Security" (validation, boundaries)
      - "Output Generation" (JSON structure)
    """
    # Basic type validation
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except Exception:
        return jsonify({"error": "lat and lon are required and must be numbers"}), 400

    # Geographic sanity checks for safety/boundary enforcement
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        return jsonify(
            {"error": "lat must be between -90 and 90, lon between -180 and 180"}
        ), 400

    hours_q = request.args.get("hours", "6")
    try:
        hours = int(hours_q)
    except Exception:
        hours = 6

    # Clamp hours to a safe range
    if hours < 1:
        hours = 1
    if hours > 48:
        hours = 48

    location_name = request.args.get("location", "Unknown location")

    result = run_flood_agent_two_calls(lat, lon, hours, location_name=location_name)
    return jsonify(result)


@bp.post("/agent/feedback")
def agent_feedback_route():
    """
    Feedback endpoint to support reinforcement-style learning.

    Expected JSON body:
      {
        "score": 1-5,
        "risk_level": "minimal" | "low" | "moderate" | "high"
      }

    This is the "Feedback Mechanism" entrypoint:
      - Converts user judgment into a reward.
      - Updates `risk_sensitivity` policy parameter via `register_feedback`.
      - Returns the new policy value to be transparent about changes.
    """
    data = request.get_json(silent=True) or {}

    if "score" not in data:
        return jsonify({"error": "Missing 'score' in feedback payload"}), 400

    try:
        resp = register_feedback(data)
    except Exception as e:
        return jsonify({"error": f"Could not register feedback: {e}"}), 500

    return jsonify(resp)
@bp.get("/panacea/risk")
def panacea_risk_route():
    """
    Panacea's Passage risk endpoint.

    Query parameters:
      - lat (required, float, -90 to 90)
      - lon (required, float, -180 to 180)
      - hours (optional, int, default 6, clamped to [1, 48])
      - location (optional, str, e.g. "Houston")
      - neighborhood (optional, str, e.g. "Meyerland")

    This is the main endpoint that the Panacea's Passage frontend
    should call to retrieve a location-specific flood risk snapshot.
    """
    # Basic type validation
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except Exception:
        return jsonify({"error": "lat and lon are required and must be numbers"}), 400

    # Geographic safety checks
    if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
        return jsonify(
            {"error": "lat must be between -90 and 90, lon between -180 and 180"}
        ), 400

    hours_q = request.args.get("hours", "6")
    try:
        hours = int(hours_q)
    except Exception:
        hours = 6

    if hours < 1:
        hours = 1
    if hours > 48:
        hours = 48

    location_name = request.args.get("location", "Houston")
    neighborhood = request.args.get("neighborhood")
    mode = request.args.get("mode") 
    panacea_result = run_panacea_flood_insight(
        lat=lat,
        lon=lon,
        hours=hours,
        location_name=location_name,
        neighborhood=neighborhood,
        mode=mode,
    )


    return jsonify(panacea_result)
