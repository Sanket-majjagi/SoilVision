import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, JSON, Uuid
from app.core.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    input_method = Column(String)
    land_size_acres = Column(Float)
    
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    ph = Column(Float)
    ec = Column(Float)
    organic_carbon = Column(Float)
    
    sulphur = Column(Float)
    zinc = Column(Float)
    iron = Column(Float)
    copper = Column(Float)
    manganese = Column(Float)
    boron = Column(Float)
    
    fertility_result = Column(JSON)
    crop_recommendations = Column(JSON)
    fertilizer_plan = Column(JSON)
