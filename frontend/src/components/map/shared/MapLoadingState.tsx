'use client';

import { Loader2 } from 'lucide-react';

interface MapLoadingStateProps {
    error?: boolean;
}

/**
 * Shared loading / error state for all map views.
 * Used by CompactMapPreview, FullMapModal, etc.
 */
export function MapLoadingState({ error = false }: MapLoadingStateProps) {
    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-600">Error al cargar el mapa</p>
            </div>
        );
    }

    return (
        <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                <p className="text-sm text-gray-600">Cargando mapa...</p>
            </div>
        </div>
    );
}
