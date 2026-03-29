-- ============================================================
-- KG Store — Reservations: código de reserva + RLS
-- Pegar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Agregar columna reservation_code (si no existe)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reservation_code TEXT UNIQUE;

-- 2. Función generadora de códigos únicos (ej: KG-A3F92X)
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  exists_check INT;
BEGIN
  LOOP
    new_code := 'KG-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    SELECT COUNT(*) INTO exists_check FROM reservations WHERE reservation_code = new_code;
    EXIT WHEN exists_check = 0;
  END LOOP;
  NEW.reservation_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: se dispara antes de cada INSERT en reservations
DROP TRIGGER IF EXISTS trg_set_reservation_code ON reservations;
CREATE TRIGGER trg_set_reservation_code
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reservation_code();

-- 4. Habilitar RLS en la tabla
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 5. Policy: usuario autenticado solo ve sus propias reservas
DROP POLICY IF EXISTS "Users can read own reservations" ON reservations;
CREATE POLICY "Users can read own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Policy: usuario autenticado puede insertar sus reservas
DROP POLICY IF EXISTS "Users can insert own reservations" ON reservations;
CREATE POLICY "Users can insert own reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ✅ Listo. Verifica con:
-- SELECT reservation_code, status, product_name FROM reservations LIMIT 5;
