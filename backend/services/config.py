import os
from dotenv import load_dotenv

# Load secrets from the .env file
load_dotenv()

class Config:
    # 1. API Key
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # 2. Model Name (Centralized here so you can change it easily)
    MODEL_NAME = "gemini-2.5-flash" 

    # 3. NWS Headers (Required to avoid 403 Forbidden errors)
    NWS_HEADERS = {
        "User-Agent": "PanaceaFloodApp/2.0 (student_project@example.com)",
        "Accept": "application/geo+json",
    }

    # 4. System Prompts
    SYSTEM_MSG_ASSESSMENT = (
        "You are a flood risk analyst. "
        "You receive technical summary data and must respond with STRICT JSON only."
    )

    SYSTEM_MSG_EXPLANATION = (
        "You are a calm, clear flood-risk explainer for residents. "
        "You are NOT providing real-time emergency advice, only a forecast-based simulation."
    )