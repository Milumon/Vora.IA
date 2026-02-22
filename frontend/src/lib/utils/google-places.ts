/**
 * Google Places photo utilities.
 *
 * These helpers extract usable thumbnail URLs from Google Places API
 * photo references returned by the backend.
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface PhotoReference {
    photo_reference?: string;
    photoReference?: string;
    height?: number;
    width?: number;
    html_attributions?: string[];
}

/**
 * Get a single thumbnail URL from a Google Places photo reference.
 * Accepts various shapes of photo data that the backend may return.
 */
export function getPlaceThumbnail(
    photos?: PhotoReference[] | string[] | null,
    maxWidth: number = 400,
): string | null {
    if (!photos || photos.length === 0) return null;

    const first = photos[0];

    // If already a URL string
    if (typeof first === 'string') {
        return first;
    }

    // If it's a photo reference object
    const ref = first.photo_reference || first.photoReference;
    if (ref && GOOGLE_MAPS_API_KEY) {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    return null;
}

/**
 * Get multiple photo URLs from Google Places photo references.
 * Returns up to `limit` photo URLs.
 */
export function getPlacePhotos(
    photos?: PhotoReference[] | string[] | null,
    maxWidth: number = 800,
    limit: number = 6,
): string[] {
    if (!photos || photos.length === 0) return [];

    const result: string[] = [];

    for (const photo of photos.slice(0, limit)) {
        if (typeof photo === 'string') {
            result.push(photo);
            continue;
        }

        const ref = photo.photo_reference || photo.photoReference;
        if (ref && GOOGLE_MAPS_API_KEY) {
            result.push(
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${GOOGLE_MAPS_API_KEY}`,
            );
        }
    }

    return result;
}
