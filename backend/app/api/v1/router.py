from fastapi import APIRouter

from app.api.v1.endpoints import auth, chat, itineraries, places, mobility

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(itineraries.router, prefix="/itineraries", tags=["itineraries"])
api_router.include_router(places.router, prefix="/places", tags=["places"])
api_router.include_router(mobility.router, prefix="/mobility", tags=["mobility"])

