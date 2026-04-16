-- ============================================================
-- KG Store — Reservaciones: campos de cuotas y foto referencial
-- Pegar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Adelanto pagado por el cliente
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS advance_payment NUMERIC(10,2);

-- 2. URL de foto referencial del producto
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reference_photo_url TEXT;

-- 3. Número de cuotas acordadas
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS installments_count INTEGER;

-- 4. Frecuencia de cuotas (semanal o mensual)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS installment_frequency TEXT CHECK (installment_frequency IN ('weekly', 'monthly'));

-- ✅ Verifica con:
-- SELECT id, product_name, advance_payment, installments_count, installment_frequency FROM reservations LIMIT 5;
