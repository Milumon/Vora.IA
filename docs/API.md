# API Documentation - Vora

## Base URL

```
Development: http://localhost:8000
Production: https://api.vora.app (TBD)
```

## Authentication

Todos los endpoints (excepto `/auth/*` y `/health`) requieren autenticación mediante JWT Bearer token.

```
Authorization: Bearer <access_token>
```

## Endpoints

### Health Check

```http
GET /health
```

Verifica el estado del servidor.

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

---

### Authentication

#### Register

```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

#### Login

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Logout

```http
POST /api/v1/auth/logout
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

---

### Chat

#### Send Message

```http
POST /api/v1/chat
```

**Request Body:**
```json
{
  "message": "Quiero visitar Cusco por 3 días",
  "conversation_id": "uuid (optional)",
  "context": {}
}
```

**Response:**
```json
{
  "message": "¡Excelente elección! Cusco es...",
  "conversation_id": "uuid",
  "itinerary": {
    "days": [...],
    "summary": "..."
  }
}
```

---

### Itineraries

#### List Itineraries

```http
GET /api/v1/itineraries
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Viaje a Cusco",
    "destination": "Cusco",
    "days": 3,
    "status": "draft",
    "created_at": "2024-01-01T00:00:00Z",
    ...
  }
]
```

#### Get Itinerary

```http
GET /api/v1/itineraries/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Viaje a Cusco",
  "data": {
    "days": [...]
  },
  ...
}
```

#### Create Itinerary

```http
POST /api/v1/itineraries
```

**Request Body:**
```json
{
  "title": "Viaje a Cusco",
  "destination": "Cusco",
  "days": 3,
  "data": {
    "days": [...]
  }
}
```

#### Delete Itinerary

```http
DELETE /api/v1/itineraries/{id}
```

**Response:** 204 No Content

---

### Places

#### Search Places

```http
GET /api/v1/places/search?query=restaurantes&location=Cusco
```

**Response:**
```json
{
  "places": [
    {
      "place_id": "ChIJ...",
      "name": "Restaurant Name",
      "address": "Address",
      "rating": 4.5,
      "location": {
        "lat": -13.5319,
        "lng": -71.9675
      }
    }
  ],
  "total": 10
}
```

---

## Error Responses

Todos los errores siguen este formato:

```json
{
  "detail": "Error message"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- 60 requests per minute por IP
- Headers de respuesta incluyen:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
