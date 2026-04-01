from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from app.services.vision_ai import analyze_image
from app.services.unit_converter import convert_meter_to_shc
from app.routers.soil import _build_response

router = APIRouter(tags=["Vision API"])

@router.post("/vision/analyze")
async def process_vision_image(
    file: UploadFile = File(...), 
    image_type: str = Form(...)
) -> dict:
    """Analyze soil meter or soil health card via Vision AI and run full analysis pipeline."""
    
    if image_type not in ["meter", "shc"]:
        raise HTTPException(status_code=400, detail="image_type must be 'meter' or 'shc'")
        
    # Read file and validate size (limit < 10 MB)
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
    vision_res = analyze_image(image_bytes, file.content_type)
    
    if not vision_res.get("success"):
        return {
            "success": False,
            "confidence": vision_res.get("confidence", 0.0),
            "reason": vision_res.get("reason", "Unknown error")
        }
        
    # Extract readings 
    readings = vision_res["readings"]
    confidence = vision_res.get("confidence", 1.0)
    
    if image_type == "meter":
        readings = convert_meter_to_shc(readings)
        
    # Pad readings with defaults for full 12-parameter analysis
    readings.setdefault("nitrogen", 0.0)
    readings.setdefault("phosphorus", 0.0)
    readings.setdefault("potassium", 0.0)
    readings.setdefault("ph", 7.0)
    readings.setdefault("ec", 0.5)
    readings.setdefault("organic_carbon", 0.5)
    readings.setdefault("sulphur", 10.0)
    readings.setdefault("zinc", 1.0)
    readings.setdefault("iron", 5.0)
    readings.setdefault("copper", 0.5)
    readings.setdefault("manganese", 3.0)
    readings.setdefault("boron", 0.3)
    
    # Run full analysis pipeline
    result = _build_response(
        soil_dict=readings,
        land_acres=1.0,
        climate={"temperature": 28.5, "humidity": 72.0, "rainfall": 1200.0},
        input_method="vision"
    )
    
    # Append vision-specific metadata
    result["vision_confidence"] = confidence
    result["vision_message"] = "Successfully extracted values automatically"
    result["extracted_readings"] = readings
    
    return result
