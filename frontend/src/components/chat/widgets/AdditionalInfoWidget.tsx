'use client';

import * as React from 'react';
import { DateRangePicker } from './DateRangePicker';
import { BudgetSlider, CURRENCY_CONFIG } from './BudgetSlider';
import { Button } from '@/components/ui/button';
import { useCurrencyStore } from '@/store/currencyStore';
import { type DateRange } from 'react-day-picker';
import { Send } from 'lucide-react';

interface AdditionalInfoWidgetProps {
    onSubmit: (data: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => void;
    showDatePicker?: boolean;
    showBudgetSlider?: boolean;
}

export function AdditionalInfoWidget({
    onSubmit,
    showDatePicker = false,
    showBudgetSlider = false,
}: AdditionalInfoWidgetProps) {
    const { currency } = useCurrencyStore();
    const config = CURRENCY_CONFIG[currency];

    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [budgetValue, setBudgetValue] = React.useState<number>(config.default);

    // Reset budget when currency changes
    React.useEffect(() => {
        setBudgetValue(CURRENCY_CONFIG[currency].default);
    }, [currency]);

    const handleSubmit = () => {
        onSubmit({
            dateRange: showDatePicker ? dateRange : undefined,
            budgetTotal: showBudgetSlider ? budgetValue : undefined,
            currency,
        });
    };

    const isValid = (!showDatePicker || (dateRange?.from && dateRange?.to)) && 
                    (!showBudgetSlider || budgetValue > 0);

    return (
        <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            {showDatePicker && (
                <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                />
            )}
            {showBudgetSlider && (
                <BudgetSlider
                    value={budgetValue}
                    onValueChange={setBudgetValue}
                />
            )}
            <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-xl bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
            >
                <Send className="h-4 w-4 mr-2" />
                Enviar información
            </Button>
        </div>
    );
}
