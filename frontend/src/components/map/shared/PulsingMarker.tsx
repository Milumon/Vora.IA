'use client';

import { useEffect, useRef } from 'react';
import { OverlayView } from '@react-google-maps/api';
import { getDayColor } from './mapConstants';

interface PulsingMarkerProps {
    position: google.maps.LatLngLiteral;
    dayNumber: number;
    label: string;
    isPulsing: boolean;
    onClick: () => void;
}

export function PulsingMarker({ position, dayNumber, label, isPulsing, onClick }: PulsingMarkerProps) {
    const color = getDayColor(dayNumber);
    
    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                onClick={onClick}
                className="relative cursor-pointer"
                style={{
                    transform: 'translate(-50%, -50%)',
                }}
            >
                {/* Sonar wave effect - multiple rings emanating from center */}
                {isPulsing && (
                    <>
                        {/* Wave 1 - First ring */}
                        <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                border: `3px solid ${color}`,
                                animation: 'sonar-wave 2s ease-out infinite',
                                animationDelay: '0s',
                            }}
                        />
                        
                        {/* Wave 2 - Second ring with delay */}
                        <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                border: `3px solid ${color}`,
                                animation: 'sonar-wave 2s ease-out infinite',
                                animationDelay: '0.5s',
                            }}
                        />
                        
                        {/* Wave 3 - Third ring with more delay */}
                        <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                border: `3px solid ${color}`,
                                animation: 'sonar-wave 2s ease-out infinite',
                                animationDelay: '1s',
                            }}
                        />
                        
                        {/* Inner glow pulse */}
                        <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '40px',
                                height: '40px',
                                backgroundColor: color,
                                opacity: 0.2,
                                animation: 'inner-glow 1.5s ease-in-out infinite',
                            }}
                        />
                    </>
                )}
                
                {/* Main marker circle */}
                <div
                    className="relative flex items-center justify-center rounded-full transition-all duration-200"
                    style={{
                        backgroundColor: color,
                        width: isPulsing ? '32px' : '24px',
                        height: isPulsing ? '32px' : '24px',
                        border: `${isPulsing ? '3px' : '2px'} solid white`,
                        boxShadow: isPulsing 
                            ? `0 0 0 4px ${color}40, 0 4px 12px rgba(0,0,0,0.3)`
                            : '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: isPulsing ? 1000 : 1,
                    }}
                >
                    <span
                        className="font-bold text-white select-none"
                        style={{
                            fontSize: isPulsing ? '14px' : '12px',
                        }}
                    >
                        {label}
                    </span>
                </div>
            </div>
        </OverlayView>
    );
}
