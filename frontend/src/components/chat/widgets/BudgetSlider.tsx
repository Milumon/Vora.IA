'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCurrencyStore } from '@/store/currencyStore';
import { Banknote } from 'lucide-react';

interface BudgetSliderProps {
    value: number;
    onValueChange: (value: number) => void;
}

const CURRENCY_CONFIG = {
    PEN: { symbol: 'S/', min: 100, max: 10000, step: 100, default: 600 },
    USD: { symbol: '$', min: 50, max: 3000, step: 100, default: 200 },
};

export function BudgetSlider({ value, onValueChange }: BudgetSliderProps) {
    const { currency } = useCurrencyStore();
    const config = CURRENCY_CONFIG[currency];

    // Clamp value to current currency range
    const clampedValue = Math.max(config.min, Math.min(value, config.max));

    return (
        <div className="space-y-3 px-1">
            <div className="flex items-center justify-between gap-2">
                <Label
                    htmlFor="budget-slider"
                    className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"
                >
                    <Banknote className="h-4 w-4 text-orange-500" />
                    Presupuesto total del viaje
                </Label>
                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                    {config.symbol}{clampedValue}
                </span>
            </div>
            <Slider
                id="budget-slider"
                value={[clampedValue]}
                onValueChange={(v) => onValueChange(v[0])}
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
