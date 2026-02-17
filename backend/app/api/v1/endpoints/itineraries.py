from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.dependencies import get_current_active_user
from app.services.supabase_client import get_supabase
from app.api.v1.schemas.itinerary import ItineraryResponse, ItineraryCreate
from app.config.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/", response_model=List[ItineraryResponse])
async def list_itineraries(
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """Get all itineraries for current user."""
    try:
        response = supabase.table("itineraries")\
            .select("*")\
            .eq("user_id", current_user["id"])\
            .order("created_at", desc=True)\
            .execute()
        
        return response.data
    except Exception as e:
        logger.error(f"Error fetching itineraries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch itineraries"
        )


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
async def get_itinerary(
    itinerary_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """Get specific itinerary by ID."""
    try:
        response = supabase.table("itineraries")\
            .select("*")\
            .eq("id", itinerary_id)\
            .eq("user_id", current_user["id"])\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Itinerary not found"
            )
        
        return response.data
    except Exception as e:
        logger.error(f"Error fetching itinerary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch itinerary"
        )


@router.post("/", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
async def create_itinerary(
    itinerary: ItineraryCreate,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """Create a new itinerary."""
    try:
        data = {
            "user_id": current_user["id"],
            **itinerary.model_dump()
        }
        
        response = supabase.table("itineraries")\
            .insert(data)\
            .execute()
        
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating itinerary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create itinerary"
        )


@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_itinerary(
    itinerary_id: str,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete an itinerary."""
    try:
        supabase.table("itineraries")\
            .delete()\
            .eq("id", itinerary_id)\
            .eq("user_id", current_user["id"])\
            .execute()
        
        return None
    except Exception as e:
        logger.error(f"Error deleting itinerary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete itinerary"
        )
