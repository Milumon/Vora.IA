"""
bus_searcher.py
---------------
Nodo LangGraph que busca opciones de bus interprovincial (Lima → Destino)
usando gpt-4o-search-preview para obtener datos reales de redbus.pe.

Se ejecuta DESPUÉS de search_places y ANTES de build_itinerary.
Si falla, retorna bus_transfers=[] sin bloquear el pipeline.
"""
import json
import re
from datetime import date, timedelta, datetime

from openai import AsyncOpenAI

from app.agents.state import TravelState
from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

DEFAULT_ORIGIN = "Lima"

# ── City IDs conocidos de redbus.pe ──────────────────────────────────────────
# Puedes ampliar este dict conforme se necesiten nuevas rutas
CITY_IDS: dict[str, tuple[str, str]] = {
    # (fromCityId, toCityId) — values are from redbus.pe URL params
    "lima":     ("195105", "195105"),
    "cusco":    ("195730", "195730"),
    "arequipa": ("195107", "195107"),
    "ica":      ("195116", "195116"),
    "trujillo": ("195125", "195125"),
    "piura":    ("195122", "195122"),
    "chiclayo": ("195111", "195111"),
    "puno":     ("195123", "195123"),
    "huaraz":   ("195115", "195115"),
    "tacna":    ("195124", "195124"),
    "nazca":    ("195120", "195120"),
}

MONTH_ES = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}


def _to_redbus_date(d: date) -> str:
    """Convierte date → 'DD-Mon-YYYY' que usa redbus.pe en sus URLs."""
    return f"{d.day:02d}-{MONTH_ES[d.month]}-{d.year}"


def _parse_date(value) -> date | None:
    """Intenta convertir str/date a date object."""
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
    return None


def _build_redbus_url(origen: str, destino: str, start: date, end: date | None) -> str:
    """
    Construye la URL de búsqueda de redbus.pe con todos los parámetros
    necesarios (fechas formateadas, IDs de ciudad, ref=modifyDate).
    """
    origen_slug = origen.lower().replace(" ", "-")
    destino_slug = destino.lower().replace(" ", "-")
    base = f"https://www.redbus.pe/bus-tickets/{origen_slug}-to-{destino_slug}"

    params = [
        f"fromCityName={origen.title()}",
        f"toCityName={destino.title()}",
    ]

    # Agregar IDs de ciudad si los conocemos
    from_id = CITY_IDS.get(origen.lower(), (None, None))[0]
    to_id = CITY_IDS.get(destino.lower(), (None, None))[0]
    if from_id and from_id != CITY_IDS.get(origen.lower(), ("", ""))[0]:
        pass  # fallback — omitir si no mapeado
    # Usar IDs conocidos
    city_from = CITY_IDS.get(origen.lower())
    city_to = CITY_IDS.get(destino.lower())
    if city_from:
        params.append(f"fromCityId={city_from[0]}")
    if city_to:
        params.append(f"toCityId={city_to[0]}")

    params.append(f"onward={_to_redbus_date(start)}")
    if end:
        params.append(f"return={_to_redbus_date(end)}")

    params.append("ref=modifyDate")

    return base + "?" + "&".join(params)


# ── Prompt para gpt-4o-search-preview ───────────────────────────────────────

SEARCH_PROMPT = """\
Busca en redbus.pe las opciones de bus de {origen} a {destino} para viajar el {fecha_ida}{fecha_vuelta_str}.

Devuelve SOLO este JSON (sin texto adicional, sin markdown):
{{
  "mejor_precio": <número en soles, ej: 90.0>,
  "empresa": "<nombre empresa con el precio más bajo>",
  "hora_salida": "<HH:MM AM/PM>",
  "hora_llegada": "<HH:MM AM/PM>",
  "duracion": "<Xh YYm>",
  "tipo_servicio": "<BUS CAMA | Semi Cama | Económico | Ejecutivo>",
  "total_opciones": <número entero de opciones encontradas>,
  "todas_opciones": [
    {{
      "empresa": "<nombre>",
      "hora_salida": "<HH:MM AM/PM>",
      "hora_llegada": "<HH:MM AM/PM>",
      "duracion": "<Xh YYm>",
      "precio": <número>,
      "tipo_servicio": "<tipo>",
      "asientos_disponibles": -1,
      "url_reserva": ""
    }}
  ]
}}

Si no encuentras datos exactos para esa fecha, usa datos típicos reales de esa ruta. \
No inventes empresas — usa empresas reales que operan en Perú (Palomino, Cruz del Sur, \
Oltursa, Tepsa, etc.).
"""


async def search_buses(state: TravelState) -> dict:
    """
    Busca opciones de bus interprovincial usando gpt-4o-search-preview.
    Construye una URL de redbus.pe con fechas y parámetros correctos.
    """
    destination = state.get("destination")
    if not destination:
        logger.info("bus_searcher: sin destino, omitiendo")
        return {"bus_transfers": []}

    if destination.lower() == "lima":
        logger.info("bus_searcher: destino es Lima, omitiendo")
        return {"bus_transfers": []}

    # ── Fechas ───────────────────────────────────────────────────────────────
    start_date = _parse_date(state.get("start_date"))
    end_date = _parse_date(state.get("end_date"))

    if not start_date:
        start_date = date.today() + timedelta(days=30)

    try:
        fecha_ida_str = start_date.strftime("%d de %B de %Y").lstrip("0")
    except Exception:
        fecha_ida_str = str(start_date)

    fecha_vuelta_extra = ""
    if end_date:
        try:
            fv = end_date.strftime("%d de %B de %Y").lstrip("0")
            fecha_vuelta_extra = f" (regreso el {fv})"
        except Exception:
            pass


    logger.info(f"bus_searcher: {DEFAULT_ORIGIN} → {destination} | {fecha_ida_str}{fecha_vuelta_extra}")

    # ── URL con parámetros completos ─────────────────────────────────────────
    url_busqueda = _build_redbus_url(DEFAULT_ORIGIN, destination, start_date, end_date)

    prompt = SEARCH_PROMPT.format(
        origen=DEFAULT_ORIGIN,
        destino=destination,
        fecha_ida=fecha_ida_str,
        fecha_vuelta_str=fecha_vuelta_extra,
    )

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        response = await client.chat.completions.create(
            model="gpt-4o-search-preview",
            web_search_options={},
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.choices[0].message.content or ""
        logger.debug(f"bus_searcher raw: {raw[:400]}")

        data = _extract_json(raw)

        if not data:
            logger.warning("bus_searcher: no se pudo parsear el JSON")
            return {"bus_transfers": []}

        bus_transfer = {
            "origen": DEFAULT_ORIGIN,
            "destino": destination,
            "fecha": fecha_ida_str,
            "mejor_precio": float(data.get("mejor_precio", 0.0)),
            "empresa": str(data.get("empresa", "Redbus.pe")),
            "hora_salida": str(data.get("hora_salida", "--")),
            "hora_llegada": str(data.get("hora_llegada", "--")),
            "duracion": str(data.get("duracion", "--")),
            "tipo_servicio": str(data.get("tipo_servicio", "Económico")),
            # URL siempre generada por nosotros — garantiza fechas correctas
            "url_busqueda": url_busqueda,
            "total_opciones": int(data.get("total_opciones", 0)),
            "todas_opciones": data.get("todas_opciones", []),
        }

        logger.info(
            f"bus_searcher: ✓ S/ {bus_transfer['mejor_precio']:.2f} "
            f"({bus_transfer['empresa']}) | url: {url_busqueda}"
        )
        return {"bus_transfers": [bus_transfer]}

    except Exception as e:
        logger.warning(f"bus_searcher: error ({type(e).__name__}: {e}) — omitiendo")
        # Devolver transfer con URL válida aunque no haya precios
        return {"bus_transfers": []}


def _extract_json(text: str) -> dict | None:
    """Extrae el primer dict JSON de texto que puede tener markdown fences."""
    if not text:
        return None
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return None
