"""Tests para Google Places client."""
import pytest
from unittest.mock import Mock, patch
from app.agents.tools.google_places import GooglePlacesClient


@pytest.fixture
def mock_places_client():
    """Mock del cliente de Google Places."""
    with patch('app.agents.tools.google_places.googlemaps.Client') as mock:
        yield mock


@pytest.mark.asyncio
async def test_search_nearby(mock_places_client):
    """Test búsqueda de lugares cercanos."""
    # Mock de respuesta de geocoding
    mock_places_client.return_value.geocode.return_value = [{
        "geometry": {
            "location": {"lat": -13.5319, "lng": -71.9675}
        }
    }]
    
    # Mock de respuesta de places
    mock_places_client.return_value.places_nearby.return_value = {
        "results": [{
            "place_id": "test123",
            "name": "Machu Picchu",
            "vicinity": "Cusco",
            "rating": 4.8,
            "types": ["tourist_attraction"],
            "geometry": {
                "location": {"lat": -13.1631, "lng": -72.5450}
            }
        }]
    }
    
    client = GooglePlacesClient()
    results = await client.search_nearby("Cusco", "atracciones turísticas")
    
    assert len(results) > 0
    assert results[0]["name"] == "Machu Picchu"
    assert results[0]["place_id"] == "test123"


@pytest.mark.asyncio
async def test_search_text(mock_places_client):
    """Test búsqueda por texto."""
    mock_places_client.return_value.places.return_value = {
        "results": [{
            "place_id": "test456",
            "name": "Plaza de Armas",
            "formatted_address": "Cusco, Perú",
            "rating": 4.7,
            "types": ["tourist_attraction"],
            "geometry": {
                "location": {"lat": -13.5170, "lng": -71.9785}
            }
        }]
    }
    
    client = GooglePlacesClient()
    results = await client.search_text("Plaza de Armas", "Cusco")
    
    assert len(results) > 0
    assert results[0]["name"] == "Plaza de Armas"
