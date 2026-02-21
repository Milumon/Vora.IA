'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateRangePickerProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const label = React.useMemo(() => {
        if (!dateRange?.from) return 'Seleccionar fechas';
        if (!dateRange.to) return format(dateRange.from, "d MMM yyyy", { locale: es });
        const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        return `${format(dateRange.from, "d MMM", { locale: es })} — ${format(dateRange.to, "d MMM yyyy", { locale: es })} (${days} noches)`;
    }, [dateRange]);

    return (
        <div className="space-y-2">
            {/* Toggle button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 
                   text-sm text-gray-700 dark:text-gray-300 transition-colors w-full"
            >
                <CalendarDays className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="truncate">{label}</span>
            </button>

            {/* Calendar dropdown */}
            {isOpen && (
                <Card className="mx-auto w-fit p-0 shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    <CardContent className="p-0">
                        <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from || addDays(new Date(), 7)}
                            selected={dateRange}
                            onSelect={(range) => {
                                onDateRangeChange(range);
                                // Close after both dates selected
                                if (range?.from && range?.to) {
                                    setTimeout(() => setIsOpen(false), 300);
                                }
                            }}
                            numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                            disabled={(date) => date < new Date()}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
