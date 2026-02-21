'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCurrencyStore } from '@/store/currencyStore';
import { Banknote } from 'lucide-react';

interface BudgetSliderProps {
    value: [number, number];
    onValueChange: (value: [number, number]) => void;
}

const CURRENCY_CONFIG = {
    PEN: { symbol: 'S/', min: 50, max: 2000, step: 50, default: [200, 600] as [number, number] },
    USD: { symbol: '$', min: 15, max: 600, step: 15, default: [50, 180] as [number, number] },
};

export function BudgetSlider({ value, onValueChange }: BudgetSliderProps) {
    const { currency } = useCurrencyStore();
    const config = CURRENCY_CONFIG[currency];

    // Clamp values to current currency range
    const clampedValue: [number, number] = [
        Math.max(config.min, Math.min(value[0], config.max)),
        Math.max(config.min, Math.min(value[1], config.max)),
    ];

    return (
        <div className="space-y-3 px-1">
            <div className="flex items-center justify-between gap-2">
                <Label
                    htmlFor="budget-slider"
                    className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"
                >
                    <Banknote className="h-4 w-4 text-orange-500" />
                    Presupuesto por noche
                </Label>
                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                    {config.symbol}{clampedValue[0]} – {config.symbol}{clampedValue[1]}
                </span>
            </div>
            <Slider
                id="budget-slider"
                value={clampedValue}
                onValueChange={(v) => onValueChange(v as [number, number])}
                min={config.min}
                max={config.max}
                step={config.step}
            />
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>{config.symbol}{config.min}</span>
                <span>{config.symbol}{config.max}</span>
            </div>
        </div>
    );
}

export { CURRENCY_CONFIG };
