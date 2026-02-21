'use client';

import { getPlaceThumbnail } from '@/lib/utils/google-places';
import type { PlaceInfo } from '@/store/chatStore';

interface PlaceInfoWindowContentProps {
    place: PlaceInfo;
    onViewDetails: () => void;
}

/**
 * Content rendered inside a Google Maps InfoWindow / tooltip.
 * Shared between FullMapModal and DayMapView.
 */
export function PlaceInfoWindowContent({ place, onViewDetails }: PlaceInfoWindowContentProps) {
    const thumb = getPlaceThumbnail(place.photos);

    return (
        <div className="max-w-[240px]" style={{ fontFamily: 'inherit' }}>
            {/* Image */}
            {thumb && (
                <img
                    src={thumb}
                    alt={place.name}
                    style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0',
                        display: 'block',
                    }}
                />
            )}

            <div style={{ padding: '10px 12px 12px' }}>
                {/* Name */}
                <h4
                    style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#111',
                        marginBottom: 4,
                        lineHeight: 1.3,
                    }}
                >
                    {place.name}
                </h4>

                {/* Rating */}
                {place.rating && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            color: '#666',
                            marginBottom: 6,
                        }}
                    >
                        <span>⭐</span>
                        <span>{place.rating}</span>
                    </div>
                )}

                {/* Description */}
                {place.why_visit && (
                    <p
                        style={{
                            fontSize: 11,
                            color: '#666',
                            lineHeight: 1.45,
                            marginBottom: 10,
                        }}
                    >
                        {place.why_visit.length > 90
                            ? place.why_visit.substring(0, 90) + '…'
                            : place.why_visit}
                    </p>
                )}

                {/* CTA button */}
                <button
                    onClick={onViewDetails}
                    style={{
                        width: '100%',
                        padding: '7px 14px',
                        backgroundColor: '#111',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#333')
                    }
                    onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#111')
                    }
                >
                    Ver Detalles
                </button>
            </div>
        </div>
    );
}
