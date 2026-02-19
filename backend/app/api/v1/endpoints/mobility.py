"""
mobility.py
-----------
API endpoint for on-demand mobility searches between two points.
Allows the frontend to query routes independently of the chat pipeline.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

from app.core.dependencies import get_current_active_user
from app.services.amadeus_client import search_flights
from app.services.routes_client import compute_route
from app.config.logging import get_logger

import asyncio

router = APIRouter()
logger = get_logger(__name__)


class MobilityRequest(BaseModel):
    """Request body for mobility route search."""
    origin: str = Field(..., description="Origin city or lat,lng", examples=["Lima"])
    destination: str = Field(..., description="Destination city or lat,lng", examples=["Cusco"])
    departure_date: Optional[str] = Field(None, description="Date YYYY-MM-DD", examples=["2026-03-15"])
    adults: int = Field(1, ge=1, le=9, description="Number of adult travelers")


class MobilityOptionResponse(BaseModel):
    provider: str
    departure_time: str = ""
    arrival_time: str = ""
    duration_text: str = "--"
    price: float = 0
    currency: str = "PEN"
    service_type: str = ""
    stops: int = 0
    booking_url: str = ""
    distance_km: Optional[float] = None


class MobilitySegmentResponse(BaseModel):
    origin: str
    destination: str
    departure_date: str
    best_flight: Optional[MobilityOptionResponse] = None
    best_transit: Optional[MobilityOptionResponse] = None
    best_drive: Optional[MobilityOptionResponse] = None
    drive_distance_km: Optional[float] = None
    drive_duration_text: Optional[str] = None
    drive_duration_seconds: Optional[int] = None
    transit_distance_km: Optional[float] = None
    transit_duration_text: Optional[str] = None
    transit_duration_seconds: Optional[int] = None
    flight_options: List[dict] = []
    transit_options: List[dict] = []
    recommended_mode: str = "bus"


class MobilityResponse(BaseModel):
    options: List[MobilitySegmentResponse]


@router.post("/routes", response_model=MobilityResponse)
async def search_mobility_routes(
    request: MobilityRequest,
    current_user: dict = Depends(get_current_active_user),
):
    """
    Search mobility options between two points.
    Returns flight, transit, and driving alternatives.
    """
    try:
        departure = request.departure_date or date.today().strftime("%Y-%m-%d")

        # Run all searches in parallel
        flight_task = search_flights(
            origin_city=request.origin,
            destination_city=request.destination,
            departure_date=departure,
            adults=request.adults,
            max_results=5,
        )
        transit_task = compute_route(request.origin, request.destination, mode="TRANSIT")
        drive_task = compute_route(request.origin, request.destination, mode="DRIVE")

        flights, transit_route, drive_route = await asyncio.gather(
            flight_task, transit_task, drive_task,
            return_exceptions=True,
        )

        # Handle exceptions
        if isinstance(flights, Exception):
            logger.warning(f"mobility endpoint: flight error — {flights}")
            flights = []
        if isinstance(transit_route, Exception):
            logger.warning(f"mobility endpoint: transit error — {transit_route}")
            transit_route = None
        if isinstance(drive_route, Exception):
            logger.warning(f"mobility endpoint: drive error — {drive_route}")
            drive_route = None

        # Build best options
        best_flight = None
        if flights:
            sorted_f = sorted(flights, key=lambda f: f.get("price", float("inf")))
            b = sorted_f[0]
            stops_count = b.get("stops", 0)
            best_flight = MobilityOptionResponse(
                provider=b.get("airline", ""),
                departure_time=b.get("departure_time", ""),
                arrival_time=b.get("arrival_time", ""),
                duration_text=b.get("duration_text", "--"),
                price=b.get("price", 0),
                currency=b.get("currency", "USD"),
                service_type="Directo" if stops_count == 0 else f"{stops_count} escala(s)",
                stops=stops_count,
            )

        best_transit = None
        if transit_route:
            best_transit = MobilityOptionResponse(
                provider="Transporte público",
                duration_text=transit_route.get("duration_text", "--"),
                service_type="Bus / Transit",
            )

        best_drive = None
        if drive_route:
            best_drive = MobilityOptionResponse(
                provider="Vehículo personal",
                duration_text=drive_route.get("duration_text", "--"),
                service_type="Auto",
                distance_km=drive_route.get("distance_km"),
            )

        # Determine recommended mode
        recommended = "bus"
        if best_flight:
            recommended = "flight"
        elif best_transit:
            recommended = "bus"
        elif best_drive:
            recommended = "drive"

        segment = MobilitySegmentResponse(
            origin=request.origin,
            destination=request.destination,
            departure_date=departure,
            best_flight=best_flight,
            best_transit=best_transit,
            best_drive=best_drive,
            drive_distance_km=drive_route.get("distance_km") if drive_route else None,
            drive_duration_text=drive_route.get("duration_text") if drive_route else None,
            drive_duration_seconds=drive_route.get("duration_seconds") if drive_route else None,
            transit_distance_km=transit_route.get("distance_km") if transit_route else None,
            transit_duration_text=transit_route.get("duration_text") if transit_route else None,
            transit_duration_seconds=transit_route.get("duration_seconds") if transit_route else None,
            flight_options=flights or [],
            transit_options=(transit_route.get("transit_details") or []) if transit_route else [],
            recommended_mode=recommended,
        )

        return MobilityResponse(options=[segment])

    except Exception as e:
        logger.error(f"mobility endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error buscando rutas: {str(e)}"
        )
