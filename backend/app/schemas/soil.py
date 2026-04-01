"""
backend/app/schemas/soil.py
Pydantic v2 schemas for all soil API request and response models.
Validation ranges are specified per the user requirements.
"""

from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, model_validator
import uuid


# ---------------------------------------------------------------------------
# REQUEST SCHEMAS
# ---------------------------------------------------------------------------

class SoilData(BaseModel):
    """All 12 soil parameters with ICAR-aligned validation ranges."""

    # Macronutrients (kg/ha)
    nitrogen: float = Field(
        ..., ge=0, le=1000,
        description="Available Nitrogen — kg/ha (ICAR: Low<280, Med 280-560, High>560)"
    )
    phosphorus: float = Field(
        ..., ge=0, le=150,
        description="Available Phosphorus — kg/ha (ICAR: Low<10, Med 10-25, High>25)"
    )
    potassium: float = Field(
        ..., ge=0, le=1000,
        description="Available Potassium — kg/ha (ICAR: Low<120, Med 120-280, High>280)"
    )

    # Chemical properties
    ph: float = Field(
        ..., ge=0, le=14,
        description="Soil pH (0-14 scale; ideal 6.5-7.5)"
    )
    ec: float = Field(
        ..., ge=0, le=20,
        description="Electrical Conductivity — dS/m (Normal <1.0)"
    )
    organic_carbon: float = Field(
        ..., ge=0, le=5,
        description="Organic Carbon — % (ICAR: Low<0.50, Med 0.50-0.75, High>0.75)"
    )

    # Micronutrients (mg/kg)
    sulphur: float = Field(
        ..., ge=0, le=100,
        description="Sulphur — mg/kg (critical limit: 10.0 mg/kg)"
    )
    zinc: float = Field(
        ..., ge=0, le=50,
        description="Zinc — mg/kg (critical limit: 0.60 mg/kg)"
    )
    iron: float = Field(
        ..., ge=0, le=100,
        description="Iron — mg/kg (critical limit: 4.50 mg/kg)"
    )
    copper: float = Field(
        ..., ge=0, le=20,
        description="Copper — mg/kg (critical limit: 0.20 mg/kg)"
    )
    manganese: float = Field(
        ..., ge=0, le=50,
        description="Manganese — mg/kg (critical limit: 2.00 mg/kg)"
    )
    boron: float = Field(
        ..., ge=0, le=10,
        description="Boron — mg/kg (critical limit: 0.50 mg/kg)"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "nitrogen": 320, "phosphorus": 18, "potassium": 200,
            "ph": 6.8, "ec": 0.45, "organic_carbon": 0.62,
            "sulphur": 12.5, "zinc": 0.8, "iron": 5.2,
            "copper": 0.3, "manganese": 3.1, "boron": 0.6,
        }
    }}


class ClimateData(BaseModel):
    """Climate parameters used by the crop recommendation model."""

    temperature: float = Field(
        ..., ge=-10, le=60,
        description="Mean temperature — °C"
    )
    humidity: float = Field(
        ..., ge=0, le=100,
        description="Relative humidity — %"
    )
    rainfall: float = Field(
        ..., ge=0, le=5000,
        description="Annual rainfall — mm"
    )

    model_config = {"json_schema_extra": {
        "example": {"temperature": 28.5, "humidity": 72.0, "rainfall": 1200.0}
    }}


class SoilAnalysisRequest(BaseModel):
    """Full request body for POST /api/v1/soil/analyze."""

    input_method: Literal["manual", "photo_meter", "photo_shc", "color_kit"] = Field(
        ..., description="How the soil data was obtained"
    )
    land_size_acres: float = Field(
        ..., gt=0, le=10000,
        description="Farmer's land size in acres — used for total fertilizer calculation"
    )
    soil_data: SoilData
    climate: ClimateData

    model_config = {"json_schema_extra": {
        "example": {
            "input_method": "manual",
            "land_size_acres": 5.0,
            "soil_data": SoilData.model_config["json_schema_extra"]["example"],
            "climate": ClimateData.model_config["json_schema_extra"]["example"],
        }
    }}


class CropCheckRequest(BaseModel):
    """Request body for POST /api/v1/crops/check."""

    crop_name: str = Field(..., description="Crop name (lowercase, e.g. 'rice')")
    soil_data: dict[str, float] = Field(
        ..., description="Partial soil data: nitrogen, phosphorus, potassium, ph, ec"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "crop_name": "rice",
            "soil_data": {"nitrogen": 320, "phosphorus": 18, "potassium": 200, "ph": 6.8, "ec": 0.45}
        }
    }}


class ColorKitReadings(BaseModel):
    """NPK readings from IFFCO/Kisan color kit — Low/Medium/High only."""

    nitrogen: Literal["Low", "Medium", "High"]
    phosphorus: Literal["Low", "Medium", "High"]
    potassium: Literal["Low", "Medium", "High"]


class ColorKitRequest(BaseModel):
    """Request body for POST /api/v1/soil/color-kit."""

    land_size_acres: float = Field(..., gt=0, le=10000)
    readings: ColorKitReadings
    climate: ClimateData


# ---------------------------------------------------------------------------
# RESPONSE SCHEMAS
# ---------------------------------------------------------------------------

class MacronutrientBreakdown(BaseModel):
    value: float
    unit: str
    rating: Literal["Low", "Medium", "High"]


class PhBreakdown(BaseModel):
    value: float
    classification: str


class EcBreakdown(BaseModel):
    value: float
    classification: str


class MicronutrientBreakdown(BaseModel):
    value: float
    status: Literal["Sufficient", "Deficient"]


class FertilityBreakdown(BaseModel):
    nitrogen: MacronutrientBreakdown
    phosphorus: MacronutrientBreakdown
    potassium: MacronutrientBreakdown
    ph: PhBreakdown
    ec: EcBreakdown
    organic_carbon: MacronutrientBreakdown
    sulphur: MicronutrientBreakdown
    zinc: MicronutrientBreakdown
    iron: MicronutrientBreakdown
    copper: MicronutrientBreakdown
    manganese: MicronutrientBreakdown
    boron: MicronutrientBreakdown


class FertilityResult(BaseModel):
    score: float = Field(..., description="Fertility score 0-100")
    rating: Literal["Excellent", "Good", "Fair", "Poor"]
    breakdown: FertilityBreakdown


class CropRecommendation(BaseModel):
    rank: int
    crop: str
    probability: float
    season: str
    ideal_ph: str


class FertilizerRecommendation(BaseModel):
    fertilizer: str
    purpose: str
    qty_per_acre_kg: float
    total_qty_kg: float
    estimated_cost: str


class FertilizerPlan(BaseModel):
    land_size_acres: float
    recommendations: list[FertilizerRecommendation]
    total_estimated_cost: str


class SoilAnalysisResponse(BaseModel):
    """Full response for POST /api/v1/soil/analyze — matches plan Section 4 exactly."""

    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fertility: FertilityResult
    crop_recommendations: list[CropRecommendation]
    fertilizer_plan: FertilizerPlan


class VisionExtractedData(BaseModel):
    """Soil parameters returned from Vision AI — some may be null."""

    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    ph: Optional[float] = None
    ec: Optional[float] = None
    organic_carbon: Optional[float] = None
    sulphur: Optional[float] = None
    zinc: Optional[float] = None
    iron: Optional[float] = None
    copper: Optional[float] = None
    manganese: Optional[float] = None
    boron: Optional[float] = None


class VisionAnalysisResponse(BaseModel):
    """Response for POST /api/v1/vision/analyze."""

    success: bool
    confidence: float
    extracted_data: Optional[VisionExtractedData] = None
    missing_fields: list[str] = []
    message: str


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str
    version: str
    model_loaded: bool
