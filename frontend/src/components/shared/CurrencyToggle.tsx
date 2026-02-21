'use client';

import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrencyStore } from '@/store/currencyStore';
import { useEffect, useState } from 'react';

export function CurrencyToggle() {
    const { currency, toggleCurrency } = useCurrencyStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <span className="text-sm font-bold">S/</span>
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleCurrency}
            aria-label={`Moneda: ${currency}`}
            title={currency === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)'}
            className="relative"
        >
            {currency === 'PEN' ? (
                <span className="text-sm font-bold leading-none">S/</span>
            ) : (
                <DollarSign className="h-5 w-5" />
            )}
        </Button>
    );
}
