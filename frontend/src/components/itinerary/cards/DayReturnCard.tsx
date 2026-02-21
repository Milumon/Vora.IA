'use client';

import { Home, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AccommodationOption } from '@/store/chatStore';
import Image from 'next/image';

interface DayReturnCardProps {
    time: string;
    accommodation: AccommodationOption;
}

/**
 * Card shown at the bottom of the day schedule representing
 * the return to the Airbnb / accommodation.
 */
export function DayReturnCard({ time, accommodation }: DayReturnCardProps) {
    const coverImage = accommodation.images?.[0] ?? null;

    return (
        <Card className="overflow-hidden shadow-md border border-dashed border-muted-foreground/30 bg-muted/30 dark:bg-muted/10">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    {/* Icon or thumbnail */}
                    {coverImage ? (
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                                src={coverImage}
                                alt={accommodation.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="w-14 h-14 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <Home className="w-6 h-6 text-primary" />
                        </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge
                                variant="secondary"
                                className="gap-1 text-xs font-semibold bg-primary/10 text-primary border-0"
                            >
                                <Clock className="h-3 w-3" />
                                {time}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-[10px] border-muted-foreground/30 text-muted-foreground"
                            >
                                Regreso
                            </Badge>
                        </div>

                        <h4 className="font-semibold text-sm leading-snug truncate">
                            Regreso al alojamiento
                        </h4>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {accommodation.name}
                        </p>
                    </div>

                    {/* Home icon accent */}
                    <Home className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}
