'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface ItineraryProgressProps {
  steps: ProgressStep[];
  title?: string;
}

export function ItineraryProgress({ steps, title = 'Construyendo tu Itinerario' }: ItineraryProgressProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
        {title}
      </h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : step.active ? (
              <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-spin flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
            
            <span
              className={`text-sm ${
                step.completed
                  ? 'text-gray-600 dark:text-gray-400 line-through'
                  : step.active
                  ? 'text-purple-900 dark:text-purple-100 font-medium'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
