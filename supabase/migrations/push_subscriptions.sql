-- ============================================================
-- KG Store — Web Push subscriptions
-- Pegar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint  TEXT    NOT NULL UNIQUE,
  p256dh    TEXT    NOT NULL,
  auth      TEXT    NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede guardar/actualizar su suscripción
DROP POLICY IF EXISTS "Allow insert push subscriptions" ON push_subscriptions;
CREATE POLICY "Allow insert push subscriptions"
  ON push_subscriptions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update push subscriptions" ON push_subscriptions;
CREATE POLICY "Allow update push subscriptions"
  ON push_subscriptions FOR UPDATE TO authenticated USING (true);

-- ✅ Verifica con:
-- SELECT endpoint, created_at FROM push_subscriptions;
