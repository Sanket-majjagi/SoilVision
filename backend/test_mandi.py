import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("DATA_GOV_API_KEY")
if not API_KEY:
    print("Error: DATA_GOV_API_KEY not found in .env")
    exit(1)

# data.gov.in endpoint and parameters
RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
BASE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

# "rice" maps to "Paddy(Dhan)(Common)" internally
params = {
    "api-key": API_KEY,
    "format": "json",
    "limit": 5,
    "filters[state]": "Karnataka",
    "filters[commodity]": "Paddy(Dhan)(Common)"
}

print(f"Testing data.gov.in API with key ending in: ...{API_KEY[-4:] if API_KEY else 'None'}")
print(f"Querying for commodity='Paddy(Dhan)(Common)', state='Karnataka'")
print("-" * 50)

try:
    response = requests.get(BASE_URL, params=params, timeout=10)
    print(f"Full Request URL: {response.url}")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("Raw JSON Response snippet:")
        import json
        print(json.dumps(data, indent=2)[:1000]) # First 1000 chars to avoid spam
        
        records = data.get("records", [])
        print("-" * 50)
        print(f"Found {len(records)} records.")
        for r in records:
            print(f"Market: {r.get('market')}, Min: {r.get('min_price')}, Max: {r.get('max_price')}, Modal: {r.get('modal_price')}")
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
