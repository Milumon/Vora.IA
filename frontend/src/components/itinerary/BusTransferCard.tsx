'use client';

import { Bus, Clock, ArrowRight, Ticket, Users, Star } from 'lucide-react';
import type { BusTransfer, BusOption } from '@/store/chatStore';

/* ─── Types ────────────────────────────────────────────────────────── */

interface BusTransferCardProps {
    transfer: BusTransfer;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

function formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
}

function getServiceBadgeColor(tipo: string): string {
    const t = tipo.toLowerCase();
    if (t.includes('cama') || t.includes('premium')) return 'bg-purple-100 text-purple-700';
    if (t.includes('semi')) return 'bg-blue-100 text-blue-700';
    if (t.includes('ejecutivo') || t.includes('vip')) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function BusRouteRow({ transfer }: { transfer: BusTransfer }) {
    return (
        <div className="flex items-center gap-3">
            {/* Departure */}
            <div className="text-center min-w-[56px]">
                <p className="text-xl font-bold text-[#1a1a2e] leading-none">
                    {transfer.hora_salida}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[56px]">
                    {transfer.origen}
                </p>
            </div>

            {/* Duration bar */}
            <div className="flex-1 flex flex-col items-center gap-0.5">
                <div className="relative w-full flex items-center">
                    <div className="flex-1 h-[2px] bg-gray-200 rounded" />
                    <div className="mx-1.5 flex flex-col items-center">
                        <Clock className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="flex-1 h-[2px] bg-gray-200 rounded" />
                </div>
                <p className="text-[10px] text-gray-400">{transfer.duracion}</p>
            </div>

            {/* Arrival */}
            <div className="text-center min-w-[56px]">
                <p className="text-xl font-bold text-[#1a1a2e] leading-none">
                    {transfer.hora_llegada}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[56px]">
                    {transfer.destino}
                </p>
            </div>
        </div>
    );
}

function AlternativeOptions({ options }: { options: BusOption[] }) {
    if (options.length <= 1) return null;
    const extras = options.slice(1, 4);

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Otras opciones
            </p>
            <div className="space-y-1.5">
                {extras.map((opt, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between text-xs text-gray-500"
                    >
                        <span className="font-medium text-gray-700 truncate max-w-[120px]">
                            {opt.empresa}
                        </span>
                        <span className="mx-2">
                            {opt.hora_salida} → {opt.hora_llegada}
                        </span>
                        <span className="font-semibold text-gray-800 shrink-0">
                            {formatPrice(opt.precio)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Main Card ─────────────────────────────────────────────────────── */

export function BusTransferCard({ transfer }: BusTransferCardProps) {
    const badgeClass = getServiceBadgeColor(transfer.tipo_servicio);

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
            {/* Header strip */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Bus className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                            Bus interprovincial
                        </p>
                        <p className="text-[11px] text-orange-500 leading-none">
                            {transfer.origen} → {transfer.destino}
                        </p>
                    </div>
                </div>
                {/* Best price badge */}
                <div className="text-right">
                    <p className="text-[10px] text-gray-400 leading-none mb-0.5">Desde</p>
                    <p className="text-xl font-black text-orange-600 leading-none">
                        {formatPrice(transfer.mejor_precio)}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
                {/* Company + service type */}
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#2D2840] truncate">
                        {transfer.empresa}
                    </p>
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${badgeClass}`}
                    >
                        {transfer.tipo_servicio}
                    </span>
                </div>

                {/* Route row */}
                <BusRouteRow transfer={transfer} />

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
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

                {/* Alternative options */}
                <AlternativeOptions options={transfer.todas_opciones} />

                {/* CTA */}
                <a
                    href={transfer.url_busqueda}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                               bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                               text-white text-sm font-semibold transition-colors"
                >
                    Ver asientos
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
