import os
import requests
from dotenv import load_dotenv
import json

load_dotenv()
API_KEY = os.getenv("DATA_GOV_API_KEY")

RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
BASE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

params = {
    "api-key": API_KEY,
    "format": "json",
    "limit": 5,
    "filters[state]": "Karnataka",
    "filters[commodity]": "Paddy(Dhan)(Common)"
}

try:
    response = requests.get(BASE_URL, params=params, timeout=10)
    with open("mandi_response.json", "w") as f:
        json.dump({
            "url": response.url,
            "status": response.status_code,
            "data": response.json() if response.status_code == 200 else response.text
        }, f, indent=2)
    print("Done writing to mandi_response.json")
except Exception as e:
    with open("mandi_response.json", "w") as f:
        json.dump({"error": str(e)}, f)
