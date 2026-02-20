'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, DollarSign, Eye } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface ItineraryCardProps {
    itinerary: {
        id: string;
        title: string;
        description?: string | null;
        destination: string;
        days: number;
        budget?: 'low' | 'medium' | 'high' | string;
        travelers?: number;
        created_at: string;
        status?: 'draft' | 'published' | 'archived';
    };
}

const BUDGET_COLORS: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export function ItineraryCard({ itinerary }: ItineraryCardProps) {
    const t = useTranslations('itineraries');
    const locale = useLocale();

    return (
        <Card className="group hover:shadow-layered transition-all duration-200 hover:border-primary/50">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {itinerary.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {itinerary.description || ''}
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            'shrink-0',
                            BUDGET_COLORS[itinerary.budget ?? 'medium'] ?? BUDGET_COLORS.medium,
                        )}
                    >
                        {t(`budget.${itinerary.budget || 'medium'}`)}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{itinerary.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                            {itinerary.days} {t('card.days')}
                        </span>
                    </div>
                    {itinerary.travelers && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 shrink-0" />
                            <span>
                                {itinerary.travelers} {t('card.travelers')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        <span>{t(`budget.${itinerary.budget || 'medium'}`)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-3 border-t border-border-subtle">
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground">
                        {new Date(itinerary.created_at).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    <Button asChild size="sm" variant="ghost" className="gap-2">
                        <Link href={`/${locale}/chat?itinerary=${itinerary.id}`}>
                            <Eye className="h-4 w-4" />
                            {t('card.viewDetails')}
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
