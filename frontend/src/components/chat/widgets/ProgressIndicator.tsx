'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ProgressStep {
    id: string;
    label: string;
    completed: boolean;
    active: boolean;
}

interface ProgressIndicatorProps {
    steps: ProgressStep[];
    className?: string;
}

export function ProgressIndicator({ steps, className }: ProgressIndicatorProps) {
    return (
        <div className={cn('space-y-2 py-3', className)}>
            {steps.map((step) => (
                <div
                    key={step.id}
                    className={cn(
                        'flex items-center gap-3 text-sm transition-all duration-300',
                        step.active && 'text-orange-600 dark:text-orange-400',
                        step.completed && 'text-gray-500 dark:text-gray-400',
                        !step.active && !step.completed && 'text-gray-400 dark:text-gray-500'
                    )}
                >
                    {step.active ? (
                        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    ) : (
                        <Checkbox
                            checked={step.completed}
                            disabled
                            className={cn(
                                'pointer-events-none',
                                step.completed && 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
                            )}
                        />
                    )}
                    <span className={cn(step.active && 'font-medium')}>{step.label}</span>
                </div>
            ))}
        </div>
    );
}
