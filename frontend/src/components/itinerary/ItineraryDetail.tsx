'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DayTimeline } from './DayTimeline';
import { GoogleMapView } from '@/components/map/views/GoogleMapView';
import { CalendarDays, DollarSign, Users, MapPin, Lightbulb } from 'lucide-react';

interface ItineraryDetailProps {
  itinerary: {
    id: string;
    title: string;
    description: string;
    destination: string;
    days: number;
    budget: 'low' | 'medium' | 'high';
    travelers?: number;
    data: {
      day_plans: any[];
      tips?: string[];
    };
  };
}

const budgetLabels = {
  low: 'Económico',
  medium: 'Medio',
  high: 'Premium',
};

export function ItineraryDetail({ itinerary }: ItineraryDetailProps) {
  return (
    <div className="container mx-auto py-8 px-4 space-y-6 max-w-6xl bg-black dark:bg-black min-h-screen">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-white dark:text-white">
          {itinerary.title}
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-lg">{itinerary.description}</p>
      </div>

      {/* Metadata */}
      <Card className="bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="font-medium text-white dark:text-gray-200">{itinerary.destination}</span>
            </div>
            <Separator orientation="vertical" className="h-6 bg-gray-700 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-300 dark:text-gray-400">{itinerary.days} días</span>
            </div>
            <Separator orientation="vertical" className="h-6 bg-gray-700 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Badge variant="outline" className="border-gray-700 dark:border-gray-700 text-gray-300 dark:text-gray-400">{budgetLabels[itinerary.budget]}</Badge>
            </div>
            {itinerary.travelers && (
              <>
                <Separator orientation="vertical" className="h-6 bg-gray-700 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-300 dark:text-gray-400">{itinerary.travelers} viajeros</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapa del Recorrido */}
      {itinerary.data.day_plans && itinerary.data.day_plans.length > 0 && (
        <Card className="bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white dark:text-white">
              <MapPin className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              Mapa del Recorrido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleMapView
              places={itinerary.data.day_plans.flatMap((d: any) => [
                ...(d.morning || []),
                ...(d.afternoon || []),
                ...(d.evening || []),
              ])}
              showRoute
            />
          </CardContent>
        </Card>
      )}

      {/* Timeline de días */}
      <div className="space-y-6">
        {itinerary.data.day_plans.map((day, idx) => (
          <DayTimeline key={idx} day={day} dayNumber={idx + 1} />
        ))}
      </div>

      {/* Tips */}
      {itinerary.data.tips && itinerary.data.tips.length > 0 && (
        <Card className="bg-gray-800 dark:bg-gray-800 border-gray-700 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white dark:text-white">
              <Lightbulb className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              Consejos para tu viaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {itinerary.data.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-orange-500 dark:text-orange-400 font-bold mt-0.5">•</span>
                  <span className="text-gray-400 dark:text-gray-500">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
