import os
import json
import base64
import requests
import logging

logger = logging.getLogger(__name__)

def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    """
    Analyzes a soil meter photo or soil health card using OpenRouter (Gemini 2.0 Flash).
    Returns a dictionary parsed from the model's JSON response.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("OPENROUTER_API_KEY is not set.")
        return {"success": False, "confidence": 0.0, "reason": "Server configuration error: Missing API Key."}

    b64 = base64.b64encode(image_bytes).decode('utf-8')

    prompt = """
You are a soil analysis assistant. Look at this image carefully.
This is either a soil test meter display or a soil health card.
Extract these soil values if visible:
nitrogen (kg/ha), phosphorus (kg/ha), potassium (kg/ha), 
ph, ec (dS/m), organic_carbon (%)

Return ONLY a valid JSON object like this:
{
  "success": true,
  "confidence": 0.9,
  "readings": {
    "nitrogen": 140,
    "phosphorus": 18,
    "potassium": 200,
    "ph": 6.5,
    "ec": 0.4,
    "organic_carbon": 0.8
  },
  "missing_fields": ["sulphur", "zinc"]
}

If you cannot read the image clearly, return:
{"success": false, "confidence": 0.0, "reason": "explain why"}

Return ONLY the JSON. No markdown, no explanation.
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                {"type": "text", "text": prompt.strip()}
            ]
        }]
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        # Strip markdown fences (e.g., ```json ... ```)
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        
        if content.endswith("```"):
            content = content[:-3]
            
        content = content.strip()
        
        # Parse JSON
        result = json.loads(content)
        
        if not result.get("success", False):
            return result
            
        # Enforce confidence threshold
        confidence = float(result.get("confidence", 0.0))
        if confidence < 0.5:
            result["success"] = False
            result["reason"] = f"Image is not clear enough (Confidence: {confidence})."
            return result
            
        return result
        
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter API request failed: {e}")
        return {"success": False, "confidence": 0.0, "reason": f"Network error during image analysis."}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}\nRaw content: {content}")
        return {"success": False, "confidence": 0.0, "reason": "Failed to parse API response format."}
    except Exception as e:
        logger.error(f"Unexpected error in analyze_image: {e}")
        return {"success": False, "confidence": 0.0, "reason": f"Unexpected error during analysis."}
