/** Shared map constants used across all map components */

export const DAY_COLORS = [
    '#10B981', // green  — Day 1
    '#F59E0B', // amber  — Day 2
    '#EF4444', // red    — Day 3
    '#8B5CF6', // purple — Day 4
    '#3B82F6', // blue   — Day 5
    '#EC4899', // pink   — Day 6
    '#14B8A6', // teal   — Day 7
] as const;

/** Default map center — Lima, Perú */
export const DEFAULT_MAP_CENTER = {
    lat: -12.0464,
    lng: -77.0428,
} as const;

export const MAP_CONTAINER_STYLE = {
    width: '100%',
    height: '100%',
} as const;

/** Returns the color for a given day number (1-indexed). */
export function getDayColor(dayNumber: number): string {
    return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

/** Returns a Google Maps circle marker icon for a day. */
export function getCircleMarkerIcon(
    dayNumber: number,
    scale = 10,
): google.maps.Symbol {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: getDayColor(dayNumber),
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale,
    };
}

/** Returns the standard label for a day number marker. */
export function getDayMarkerLabel(dayNumber: number): google.maps.MarkerLabel {
    return {
        text: `${dayNumber}`,
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold',
    };
}
