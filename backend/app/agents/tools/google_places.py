"""Cliente para Google Places API."""
import googlemaps
from typing import List, Dict, Optional
from app.config.settings import get_settings
from app.config.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


class GooglePlacesClient:
    """Cliente para interactuar con Google Places API."""
    
    def __init__(self):
        self.client = googlemaps.Client(key=settings.GOOGLE_PLACES_API_KEY)
    
    async def search_nearby(
        self,
        location: str,
        query: str,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Busca lugares cercanos a una ubicación.
        
        Args:
            location: Nombre de la ciudad o región
            query: Tipo de lugar a buscar (ej: "museos", "restaurantes")
            max_results: Número máximo de resultados
            
        Returns:
            Lista de lugares encontrados
        """
        try:
            # Primero geocodificar la ubicación
            geocode_result = self.client.geocode(f"{location}, Perú")
            
            if not geocode_result:
                logger.warning(f"No se pudo geocodificar: {location}")
                return []
            
            lat_lng = geocode_result[0]["geometry"]["location"]
            
            # Buscar lugares
            places_result = self.client.places_nearby(
                location=lat_lng,
                keyword=query,
                radius=10000,  # 10km
                language="es"
            )
            
            places = []
            for place in places_result.get("results", [])[:max_results]:
                places.append(self._parse_place(place))
            
            return places
            
        except Exception as e:
            logger.error(f"Error buscando lugares: {e}")
            return []
    
    async def search_text(
        self,
        query: str,
        location: Optional[str] = None,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Busca lugares usando búsqueda de texto.
        
        Args:
            query: Consulta de búsqueda
            location: Ubicación opcional para filtrar
            max_results: Número máximo de resultados
            
        Returns:
            Lista de lugares encontrados
        """
        try:
            search_query = f"{query} en {location}, Perú" if location else f"{query}, Perú"
            
            places_result = self.client.places(
                query=search_query,
                language="es"
            )
            
            places = []
            for place in places_result.get("results", [])[:max_results]:
                places.append(self._parse_place(place))
            
            return places
            
        except Exception as e:
            logger.error(f"Error en búsqueda de texto: {e}")
            return []
    
    async def get_place_details(self, place_id: str) -> Optional[Dict]:
        """
        Obtiene detalles completos de un lugar.
        
        Args:
            place_id: ID del lugar en Google Places
            
        Returns:
            Detalles del lugar o None si hay error
        """
        try:
            result = self.client.place(
                place_id=place_id,
                language="es",
                fields=[
                    "name", "formatted_address", "rating", "price_level",
                    "types", "photos", "geometry", "opening_hours",
                    "formatted_phone_number", "website", "reviews"
                ]
            )
            
            return self._parse_place_details(result.get("result", {}))
            
        except Exception as e:
            logger.error(f"Error obteniendo detalles del lugar: {e}")
            return None
    
    def _parse_place(self, place: Dict) -> Dict:
        """Parsea un lugar de la respuesta de Google Places."""
        photos = []
        if "photos" in place:
            for photo in place["photos"][:3]:  # Máximo 3 fotos
                photo_ref = photo.get("photo_reference")
                if photo_ref:
                    photos.append(
                        f"https://maps.googleapis.com/maps/api/place/photo"
                        f"?maxwidth=400&photoreference={photo_ref}"
                        f"&key={settings.GOOGLE_PLACES_API_KEY}"
                    )
        
        return {
            "place_id": place.get("place_id", ""),
            "name": place.get("name", ""),
            "address": place.get("vicinity", place.get("formatted_address", "")),
            "rating": place.get("rating"),
            "price_level": place.get("price_level"),
            "types": place.get("types", []),
            "photos": photos,
            "location": {
                "lat": place["geometry"]["location"]["lat"],
                "lng": place["geometry"]["location"]["lng"]
            }
        }
    
    def _parse_place_details(self, place: Dict) -> Dict:
        """Parsea detalles completos de un lugar."""
        parsed = self._parse_place(place)
        
        # Agregar información adicional
        parsed.update({
            "phone": place.get("formatted_phone_number"),
            "website": place.get("website"),
            "opening_hours": place.get("opening_hours", {}).get("weekday_text", []),
            "reviews": [
                {
                    "author": review.get("author_name"),
                    "rating": review.get("rating"),
                    "text": review.get("text"),
                    "time": review.get("relative_time_description")
                }
                for review in place.get("reviews", [])[:3]  # Top 3 reviews
            ]
        })
        
        return parsed
