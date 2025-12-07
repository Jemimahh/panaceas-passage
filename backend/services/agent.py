import time
import json
import random
import re
from typing import Dict, Any, List, Optional

import requests
import google.generativeai as genai

# IMPORT CONFIGURATION (Safe for GitHub)
from services.config import Config

# -------------------------------------------------------------------
# Configuration & Initialization
# -------------------------------------------------------------------

# 1. Configure Gemini with the key from Config
if not Config.GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing. Check your .env file.")

genai.configure(api_key=Config.GEMINI_API_KEY)

# 2. Initialize Models using Config names
# This allows you to change models in config.py without touching this file
ASSESSMENT_MODEL = genai.GenerativeModel(
    model_name=Config.MODEL_NAME,
    system_instruction=Config.SYSTEM_MSG_ASSESSMENT,
)

EXPLANATION_MODEL = genai.GenerativeModel(
    model_name=Config.MODEL_NAME,
    system_instruction=Config.SYSTEM_MSG_EXPLANATION,
)

# 3. Setup NWS Session with Headers from Config
session = requests.Session()
session.headers.update(Config.NWS_HEADERS)


# -------------------------------------------------------------------
# NWS hourly forecast API (TOOL #1)
# -------------------------------------------------------------------

def get_nws_hourly_forecast(lat: float, lon: float, hours: int = 6) -> Dict[str, Any]:
    """
    External TOOL: US National Weather Service hourly forecast API.
    """
    try:
        points_url = f"https://api.weather.gov/points/{lat},{lon}"
        resp_points = session.get(points_url, timeout=10)
        resp_points.raise_for_status()
        points_data = resp_points.json()

        hourly_url = points_data["properties"]["forecastHourly"]

        resp_hourly = session.get(hourly_url, timeout=10)
        resp_hourly.raise_for_status()
        hourly_data = resp_hourly.json()

        periods = hourly_data.get("properties", {}).get("periods", [])
        if not periods:
            return {"error": "No hourly forecast periods returned from NWS"}

        simplified: List[Dict[str, Any]] = []
        for p in periods[:hours]:
            simplified.append(
                {
                    "startTime": p.get("startTime"),
                    "temperature": p.get("temperature"),
                    "precipChance": (p.get("probabilityOfPrecipitation", {}) or {}).get("value"),
                    "shortForecast": p.get("shortForecast"),
                    "windSpeed": p.get("windSpeed"),
                }
            )

        return {"data": simplified}

    except Exception as e:
        return {"error": f"NWS tool failed: {e}"}


# -------------------------------------------------------------------
# In-memory state
# -------------------------------------------------------------------

AGENT_MEMORY: Dict[str, Any] = {
    "interactions": [],          
    "feedback_history": [],      
    "risk_sensitivity": 0.5,     
}

def _store_interaction(record: Dict[str, Any]) -> None:
    AGENT_MEMORY["interactions"].append(record)
    if len(AGENT_MEMORY["interactions"]) > 100:
        AGENT_MEMORY["interactions"].pop(0)

def register_feedback(payload: Dict[str, Any]) -> Dict[str, Any]:
    score = int(payload.get("score", 3))
    risk_level = str(payload.get("risk_level", "unknown"))
    score = max(1, min(5, score))
    reward = score - 3 
    alpha = 0.05        

    old_sensitivity = AGENT_MEMORY["risk_sensitivity"]
    new_sensitivity = old_sensitivity + alpha * reward
    new_sensitivity = max(0.2, min(0.8, new_sensitivity))
    AGENT_MEMORY["risk_sensitivity"] = new_sensitivity

    AGENT_MEMORY["feedback_history"].append({
        "timestamp": time.time(),
        "score": score,
        "new_sensitivity": new_sensitivity,
    })

    return {
        "ok": True,
        "message": "Feedback registered.",
        "policy": {"risk_sensitivity": new_sensitivity},
    }


# -------------------------------------------------------------------
# Prediction Logic
# -------------------------------------------------------------------

def _fallback_predict_flood(lat: float, lon: float, hours: int) -> Dict[str, Any]:
    """Fallback model when NWS is down."""
    avg_temp = round(random.uniform(20.0, 30.0), 1)
    max_precip_prob = round(random.uniform(0.1, 0.9), 2)
    will_precip = max_precip_prob > 0.5

    summary = {
        "hours": hours,
        "avg_temp": avg_temp,
        "max_precip_prob": max_precip_prob,
        "will_precip": will_precip,
    }

    sensitivity = AGENT_MEMORY["risk_sensitivity"]
    if max_precip_prob > sensitivity + 0.25:
        trend = "Conditions suggest a higher chance of heavy rain."
        advice = "Avoid low-lying roads and monitor local alerts."
    elif max_precip_prob > sensitivity:
        trend = "Mixed signals: some periods of rain."
        advice = "Use caution in areas with poor drainage."
    else:
        trend = "No strong indication of heavy rainfall."
        advice = "Normal travel is likely fine."

    return {
        "summary": summary,
        "trend": trend,
        "advice": advice,
        "source": "fallback_simulation",
    }


def _predict_flood_from_nws(lat: float, lon: float, hours: int) -> Dict[str, Any]:
    """Main prediction using NWS data."""
    nws_result = get_nws_hourly_forecast(lat, lon, hours)

    if "error" in nws_result:
        fallback = _fallback_predict_flood(lat, lon, hours)
        fallback["tool_error"] = nws_result["error"]
        return fallback

    periods = nws_result["data"]
    precip_values = [p.get("precipChance") or 0 for p in periods]
    max_precip_prob = (max(precip_values) / 100.0) if precip_values else 0.0
    avg_temp = sum((p.get("temperature") or 0) for p in periods) / max(len(periods), 1)
    will_precip = max_precip_prob > 0.3

    summary = {
        "hours": hours,
        "avg_temp": round(avg_temp, 1),
        "max_precip_prob": round(max_precip_prob, 2),
        "will_precip": will_precip,
    }

    sensitivity = AGENT_MEMORY["risk_sensitivity"]
    if max_precip_prob > sensitivity + 0.25:
        trend = "Forecast shows a strong signal for heavy or persistent rain."
        advice = "Plan extra time for travel and avoid known flood-prone routes."
    elif max_precip_prob > sensitivity:
        trend = "Forecast suggests periods of rain with some chance of heavier bursts."
        advice = "Stay weather-aware, especially near bayous and low-lying roads."
    else:
        trend = "Forecast does not show a strong signal for heavy rain."
        advice = "Normal activity is likely fine."

    return {
        "summary": summary,
        "trend": trend,
        "advice": advice,
        "source": "nws_hourly_forecast",
        "raw_periods_used": len(periods),
    }


def run_flood_agent_two_calls(
    lat: float,
    lon: float,
    hours: int,
    location_name: str = "Unknown",
    mode: Optional[str] = None,
) -> Dict[str, Any]:
    
    # 1) Get base prediction
    if mode == "sim_high":
        base = _fallback_predict_flood(lat, lon, hours)
        base["summary"]["max_precip_prob"] = 0.9
        base["summary"]["will_precip"] = True
        base["trend"] = "Simulated scenario: conditions represent heavy, persistent rain."
        base["advice"] = "Treat low-lying roads as unsafe."
        base["source"] = "simulation_for_testing"
    else:
        base = _predict_flood_from_nws(lat, lon, hours)

    summary = base["summary"]
    trend = base["trend"]
    advice = base["advice"]
    risk_sensitivity = AGENT_MEMORY["risk_sensitivity"]

    # ---------- Stage 1: Planning ----------
    user_msg_1 = f"""
    You are given the following flood-related forecast summary:
    Location: {location_name}
    Hours analyzed: {summary['hours']}
    Max precipitation probability: {summary['max_precip_prob']}
    Trend description: {trend}
    Rule-based advice: {advice}
    Risk sensitivity parameter (0.2–0.8): {risk_sensitivity}

    From this, generate a JSON object with: "risk_level", "confidence", "justification", "key_factors".
    Return ONLY valid JSON.
    """

    try:
        # Call Gemini (Model Name defined in Config)
        assessment_response = ASSESSMENT_MODEL.generate_content(user_msg_1)
        assessment_text = assessment_response.text or ""
        match = re.search(r"```json\n([\s\S]*?)\n```", assessment_text)
        if match:
            assessment_text = match.group(1)
        model_assessment = json.loads(assessment_text)

    except Exception as e:
        # --- FAIL SAFE LOGIC ---
        precip = summary.get("max_precip_prob", 0)
        
        fallback_level = "Low"
        if precip > 0.7: fallback_level = "High"
        elif precip > 0.4: fallback_level = "Moderate"
        
        # Log failure but continue
        print(f"AI Failed ({type(e).__name__}): {e}. Using Fallback Logic.") 
        
        model_assessment = {
            "risk_level": fallback_level,
            "confidence": 0.5, 
            "justification": f"AI service unavailable. Risk estimated from rainfall probability ({int(precip*100)}%).",
            "key_factors": ["Rainfall Probability (NWS)", "AI Service Offline"],
        }

    # ---------- Stage 2: Execution ----------
    user_msg_2 = f"""
    Location: {location_name}
    Trend: {trend}
    Advice: {advice}
    Assessment: {model_assessment}

    Write a clear explanation for a resident. 
    End with: "This is a simulation based on forecast-style data, not live emergency information."
    """

    try:
        explanation_response = EXPLANATION_MODEL.generate_content(user_msg_2)
        explanation_text = explanation_response.text or "Simulation active."
    except Exception as e:
        explanation_text = (
            f"Forecast for {location_name}: {trend} "
            f"Current analysis suggests {model_assessment['risk_level']} risk based on weather data. "
            "This is a simulation based on forecast-style data, not live emergency information."
        )

    result = {
        "base": base,
        "model_assessment": model_assessment,
        "explanation": explanation_text,
        "meta": {
            "tools_used": {"gemini_llm": True},
            "risk_sensitivity": risk_sensitivity,
        },
    }

    _store_interaction({
        "timestamp": time.time(),
        "lat": lat,
        "lon": lon,
        "result": result,
    })

    return result


def run_panacea_flood_insight(
    lat: float,
    lon: float,
    hours: int = 6,
    location_name: str = "Houston",
    neighborhood: Optional[str] = None,
    mode: Optional[str] = None,
) -> Dict[str, Any]:
    """Wrapper for Panacea's Passage frontend."""
    
    core_result = run_flood_agent_two_calls(
        lat=lat,
        lon=lon,
        hours=hours,
        location_name=location_name,
        mode=mode,
    )

    base = core_result["base"]
    assessment = core_result["model_assessment"]
    explanation = core_result["explanation"]

    # --- DATA CLEANING FOR FRONTEND ---
    
    # 1. Fix Confidence
    raw_conf = assessment.get("confidence", 0.0)
    final_conf = 0.0
    if isinstance(raw_conf, (int, float)):
        final_conf = float(raw_conf)
    elif isinstance(raw_conf, str):
        c = raw_conf.lower()
        if "high" in c: final_conf = 0.9
        elif "mod" in c or "med" in c: final_conf = 0.6
        elif "low" in c: final_conf = 0.2
    
    # 2. Fix Risk Level
    risk_lvl = assessment.get("risk_level", "unknown")

    # 3. Create Explanation
    panacea_explanation = (
        "This summary is provided by Panacea's Passage.\n\n" + explanation
    )

    return {
        "location": {
            "name": location_name, 
            "neighborhood": neighborhood, 
            "lat": lat, 
            "lon": lon
        },
        "risk": {
            "level": risk_lvl,              
            "confidence": final_conf,       
            "justification": assessment.get("justification", ""),
            "key_factors": assessment.get("key_factors", []),
        },
        "summary": {
            "hours": base["summary"]["hours"],
            "avg_temp": base["summary"]["avg_temp"],
            "max_precip_prob": base["summary"]["max_precip_prob"],
            "will_precip": base["summary"]["will_precip"],
            "trend": base["trend"],         
            "advice": base["advice"],       
        },
        "explanation": panacea_explanation,
        "meta": {
            **core_result["meta"],
            "disclaimer": "This is a simulation based on forecast-style data.",
        },
    }