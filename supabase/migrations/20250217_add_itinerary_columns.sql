-- Migración: Agregar columnas thread_id y travelers a itineraries
-- Ejecutar en Supabase SQL Editor si la tabla ya existe

ALTER TABLE public.itineraries 
ADD COLUMN IF NOT EXISTS travelers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS thread_id UUID;
