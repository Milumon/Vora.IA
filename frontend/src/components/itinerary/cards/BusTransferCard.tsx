'use client';

import { Bus, Clock, ArrowRight, Ticket, Star } from 'lucide-react';

export interface BusOption {
    empresa: string;
    hora_salida: string;
    hora_llegada: string;
    precio: number;
    tipo_servicio: string;
}

export interface BusTransfer {
    origen: string;
    destino: string;
    hora_salida: string;
    hora_llegada: string;
    duracion: string;
    empresa: string;
    tipo_servicio: string;
    mejor_precio: number;
    total_opciones: number;
    url_busqueda: string;
    todas_opciones: BusOption[];
}

interface BusTransferCardProps {
    transfer: BusTransfer;
}

function formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
}

function getServiceBadgeColor(tipo: string): string {
    const t = tipo.toLowerCase();
    if (t.includes('cama') || t.includes('premium')) return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
    if (t.includes('semi')) return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    if (t.includes('ejecutivo') || t.includes('vip')) return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}

function BusRouteRow({ transfer }: { transfer: BusTransfer }) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-center min-w-[56px]">
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{transfer.hora_salida}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[56px]">{transfer.origen}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-0.5">
                <div className="relative w-full flex items-center">
                    <div className="flex-1 h-[2px] bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="mx-1.5 flex flex-col items-center">
                        <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="flex-1 h-[2px] bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{transfer.duracion}</p>
            </div>

            <div className="text-center min-w-[56px]">
                <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{transfer.hora_llegada}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[56px]">{transfer.destino}</p>
            </div>
        </div>
    );
}

function AlternativeOptions({ options }: { options: BusOption[] }) {
    if (options.length <= 1) return null;
    const extras = options.slice(1, 4);

    return (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Otras opciones
            </p>
            <div className="space-y-1.5">
                {extras.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{opt.empresa}</span>
                        <span className="mx-2">
                            {opt.hora_salida} → {opt.hora_llegada}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white shrink-0">{formatPrice(opt.precio)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BusTransferCard({ transfer }: BusTransferCardProps) {
    const badgeClass = getServiceBadgeColor(transfer.tipo_servicio);

    return (
        <div className="w-full bg-white dark:bg-black rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header strip */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center">
                        <Bus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-white uppercase tracking-wide">
                            Bus interprovincial
                        </p>
                        <p className="text-[11px] text-gray-300 dark:text-gray-400 leading-none">
                            {transfer.origen} → {transfer.destino}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-300 dark:text-gray-400 leading-none mb-0.5">Desde</p>
                    <p className="text-xl font-black text-white leading-none">
                        {formatPrice(transfer.mejor_precio)}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{transfer.empresa}</p>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${badgeClass}`}
                    >
                        {transfer.tipo_servicio}
                    </span>
                </div>

                <BusRouteRow transfer={transfer} />

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {transfer.total_opciones > 0 && (
                        <span className="flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5" />
                            {transfer.total_opciones} opcion{transfer.total_opciones !== 1 ? 'es' : ''} disponibles
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        redbus.pe
                    </span>
                </div>

                <AlternativeOptions options={transfer.todas_opciones} />

                <a
                    href={transfer.url_busqueda}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     bg-black dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 active:bg-gray-700 dark:active:bg-gray-600
                     text-white text-sm font-semibold transition-colors"
                >
                    Ver asientos
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
