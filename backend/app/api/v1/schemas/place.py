from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Place(BaseModel):
    place_id: str
    name: str
    address: str
    rating: Optional[float] = None
    types: List[str] = []
    location: Dict[str, float]
    photos: List[str] = []
    price_level: Optional[int] = None


class PlaceSearchRequest(BaseModel):
    query: str
    location: str
    radius: int = 5000
    max_results: int = 10


class PlaceSearchResponse(BaseModel):
    places: List[Place]
    total: int
