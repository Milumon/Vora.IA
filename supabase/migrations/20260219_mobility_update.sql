-- Migración: Actualizar itinerarios para movilidad unificada
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-02-19

-- 1. La columna JSONB `data` ya almacena la estructura completa del itinerario
--    incluyendo day_plans[].mobility (antes bus_transfer).
--    No se necesitan nuevas columnas, la data JSONB es flexible.

-- 2. Crear índice GIN en data para búsquedas eficientes dentro del JSONB
CREATE INDEX IF NOT EXISTS idx_itineraries_data_gin 
  ON public.itineraries USING gin (data);

-- 3. Agregar columna status_detail para distinguir borradores activos de archivados
ALTER TABLE public.itineraries 
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 4. Índice para itinerarios favoritos del usuario  
CREATE INDEX IF NOT EXISTS idx_itineraries_user_favorite 
  ON public.itineraries(user_id, is_favorite) 
  WHERE is_favorite = true;

-- 5. Índice compuesto para listar itinerarios del usuario ordenados
CREATE INDEX IF NOT EXISTS idx_itineraries_user_status_created 
  ON public.itineraries(user_id, status, created_at DESC);

-- 6. Agregar política de upsert para conversaciones (necesaria para guardar estado)
--    Solo si no existe ya
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' AND policyname = 'Users can upsert own conversations'
  ) THEN
    CREATE POLICY "Users can upsert own conversations" ON public.conversations
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 7. Vista materializada para acceso rápido a itinerarios del usuario
--    (opcional, mejora performance en listados)
CREATE OR REPLACE VIEW public.user_itineraries_summary AS
SELECT
  i.id,
  i.user_id,
  i.title,
  i.destination,
  i.days,
  i.budget,
  i.status,
  i.is_favorite,
  i.created_at,
  i.updated_at,
  -- Extraer resumen de movilidad del primer día
  (i.data->'day_plans'->0->'mobility'->>'recommended_mode') AS mobility_mode,
  (i.data->'day_plans'->0->'mobility'->>'origin') AS mobility_origin,
  -- Contar experiencias totales
  (SELECT count(*)::int FROM jsonb_array_elements(i.data->'day_plans') AS dp,
    LATERAL (
      SELECT jsonb_array_length(COALESCE(dp->'morning', '[]'::jsonb)) +
             jsonb_array_length(COALESCE(dp->'afternoon', '[]'::jsonb)) +
             jsonb_array_length(COALESCE(dp->'evening', '[]'::jsonb)) AS cnt
    ) x
  ) AS total_experiences
FROM public.itineraries i;
