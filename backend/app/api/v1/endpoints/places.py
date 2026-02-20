import json
from typing import List

import httpx
from fastapi import APIRouter, Query

from app.config.settings import get_settings
from app.config.logging import get_logger
from app.api.v1.schemas.place import PlaceSearchResponse

router = APIRouter()
settings = get_settings()
logger = get_logger(__name__)

SERPER_IMAGES_URL = "https://google.serper.dev/images"


@router.get("/search", response_model=PlaceSearchResponse)
async def search_places(
    query: str = Query(..., description="Search query"),
    location: str = Query(..., description="Location to search in"),
):
    """
    Search for places using Google Places API.
    This will be fully implemented in Phase 2.
    """
    return PlaceSearchResponse(places=[], total=0)


@router.get("/images")
async def get_place_images(
    query: str = Query(..., description="Place name / search query"),
    num: int = Query(2, ge=1, le=6, description="Number of images to return"),
):
    """
    Return up to `num` image URLs for the given place query using Serper.dev.
    Used by the PlaceCard carousel on the frontend.
    """
    if not settings.SERPAPI_API_KEY:
        logger.info("places/images: SERPAPI_API_KEY not set, returning empty list")
        return {"images": []}

    payload = json.dumps({"q": query, "gl": "pe", "hl": "es", "num": num + 4})
    headers = {
        "X-API-KEY": settings.SERPAPI_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(SERPER_IMAGES_URL, headers=headers, content=payload)

        if response.status_code != 200:
            logger.warning(f"places/images: Serper HTTP {response.status_code}")
            return {"images": []}

        data = response.json()
        urls: List[str] = []
        for img in data.get("images", []):
            url = img.get("imageUrl") or img.get("thumbnailUrl") or ""
            if url:
                urls.append(url)
            if len(urls) >= num:
                break

        logger.info(f"places/images: '{query}' → {len(urls)} images")
        return {"images": urls}

    except Exception as e:
        logger.warning(f"places/images: {type(e).__name__}: {e}")
        return {"images": []}
