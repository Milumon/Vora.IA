import { Plane, Bus, Car } from 'lucide-react';

export type MobilityMode = 'flight' | 'bus' | 'drive';

/** Icon for each mobility mode */
export function getMobilityIcon(mode: string): typeof Plane {
    switch (mode) {
        case 'flight': return Plane;
        case 'drive': return Car;
        default: return Bus;
    }
}

/** Tailwind color classes for each mobility mode (border + text) */
export function getMobilityColorClasses(mode: string): string {
    switch (mode) {
        case 'flight': return 'border-sky-400 text-sky-500';
        case 'drive': return 'border-emerald-400 text-emerald-500';
        default: return 'border-orange-400 text-orange-400';
    }
}

/** Human-readable label for each mobility mode */
export function getMobilityLabel(mode: string): string {
    switch (mode) {
        case 'flight': return 'Vuelo';
        case 'drive': return 'Auto';
        default: return 'Bus';
    }
}
