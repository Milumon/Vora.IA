from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_active_user
from app.api.v1.schemas.place import PlaceSearchRequest, PlaceSearchResponse

router = APIRouter()


@router.get("/search", response_model=PlaceSearchResponse)
async def search_places(
    query: str = Query(..., description="Search query"),
    location: str = Query(..., description="Location to search in"),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Search for places using Google Places API.
    This will be fully implemented in Phase 2.
    """
    # TODO: Implement Google Places API integration
    return PlaceSearchResponse(
        places=[],
        total=0
    )
