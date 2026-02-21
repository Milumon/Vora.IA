/** Shared map constants used across all map components */

export const DAY_COLORS = [
    '#FF1744', // bright red     — Day 1
    '#00E676', // bright green   — Day 2
    '#2979FF', // bright blue    — Day 3
    '#FF9100', // bright orange  — Day 4
    '#D500F9', // bright purple  — Day 5
    '#00E5FF', // bright cyan    — Day 6
    '#FFEA00', // bright yellow  — Day 7
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

/** Returns a pulsing marker icon for a selected day (larger scale). */
export function getPulsingMarkerIcon(
    dayNumber: number,
    scale = 14,
): google.maps.Symbol {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: getDayColor(dayNumber),
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
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

/** Grayscale map styles for a black and white theme */
export const GRAYSCALE_MAP_STYLES: google.maps.MapTypeStyle[] = [
    {
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }],
    },
    {
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }],
    },
    {
        elementType: 'labels.text.fill',
        stylers: [{ color: '#616161' }],
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#f5f5f5' }],
    },
    {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#bdbdbd' }],
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#eeeeee' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#e5e5e5' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }],
    },
    {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#dadada' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#616161' }],
    },
    {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }],
    },
    {
        featureType: 'transit.line',
        elementType: 'geometry',
        stylers: [{ color: '#e5e5e5' }],
    },
    {
        featureType: 'transit.station',
        elementType: 'geometry',
        stylers: [{ color: '#eeeeee' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#c9c9c9' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }],
    },
];

/** Returns a black circular marker with a home/building icon for accommodation pins. */
export function getAccommodationMarkerIcon(): google.maps.Icon {
    // Black circle with white building/home icon
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#222222" stroke="#ffffff" stroke-width="2.5"/>
      <g transform="translate(12, 11)">
        <path fill="#ffffff" d="M8 0L0 6v12h16V6L8 0zm6 16H2V7l6-4.5L14 7v9zm-8-8h4v6H6V8z"/>
      </g>
    </svg>`;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
    };
}

/** @deprecated Use getAccommodationMarkerIcon instead */
export function getAirbnbMarkerIcon(): google.maps.Icon {
    return getAccommodationMarkerIcon();
}
