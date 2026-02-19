from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import date, datetime


class ItineraryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    destination: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    days: int
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    travelers: Optional[int] = 1
    data: Dict[str, Any]


class ItineraryResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    destination: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    days: int
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    status: str
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
