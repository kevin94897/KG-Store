import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'KG Store <no-reply@grupo-gomez.com>'

const STATUS_LABEL: Record<string, { label: string; emoji: string; color: string; desc: string }> = {
  confirmed: {
    label: 'Confirmada',
    emoji: '✅',
    color: '#22c55e',
    desc: 'Tu reserva fue confirmada. Nos pondremos en contacto contigo para coordinar la entrega.',
  },
  completed: {
    label: 'Completada',
    emoji: '📦',
    color: '#3b82f6',
    desc: '¡Tu reserva fue completada con éxito! Gracias por tu compra en KG Store.',
  },
  cancelled: {
    label: 'Cancelada',
    emoji: '❌',
    color: '#ef4444',
    desc: 'Lamentablemente tu reserva fue cancelada. Contáctanos si crees que es un error.',
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Payload sent from Supabase Database Webhook (record = updated reservation)
    const body = await req.json()
    const record = body.record ?? body  // support both webhook and direct call

    const { reservation_code, product_name, status, user_email, user_name } = record

    const cfg = STATUS_LABEL[status]
    if (!cfg) {
      // Ignore statuses we don't send emails for (e.g. 'pending')
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://mlbdbkny4xg1.i.optimole.com/w:240/h:68/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png"
           alt="KG Store" height="34" style="display:block;margin:0 auto;" />
    </div>

    <div style="background:#1c1c1c;border-radius:24px;padding:32px;border:1px solid rgba(255,255,255,0.06);">
      <p style="color:${cfg.color};font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">
        ${cfg.emoji} Actualización de reserva
      </p>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">
        Hola, ${user_name || 'estimado cliente'}
      </h1>
      <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 28px;line-height:1.6;">
        ${cfg.desc}
      </p>

      <!-- Código + estado -->
      <div style="border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;margin-bottom:24px;">
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Código de reserva</p>
          <p style="color:#c8a96e;font-size:20px;font-weight:700;letter-spacing:4px;font-family:monospace;margin:0;">${reservation_code}</p>
        </div>
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Producto</p>
          <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0;">${product_name}</p>
        </div>
        <div style="padding:14px 20px;">
          <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Estado</p>
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.1);color:${cfg.color};border:1px solid;border-color:${cfg.color}33;border-radius:100px;padding:4px 12px;font-size:12px;font-weight:700;">
            ${cfg.emoji} ${cfg.label}
          </span>
        </div>
      </div>

      <a href="https://colecciones.grupo-gomez.com/mis-reservas"
         style="display:block;background:#c8a96e;color:#000000;text-decoration:none;text-align:center;padding:16px;border-radius:100px;font-weight:700;font-size:15px;margin-bottom:16px;">
        Ver mis reservas →
      </a>

      <p style="color:rgba(255,255,255,0.25);font-size:13px;text-align:center;margin:0;">
        ¿Tienes dudas? Escríbenos por
        <a href="https://wa.me/51947841355" style="color:#c8a96e;text-decoration:none;">WhatsApp</a>
      </p>
    </div>

    <p style="color:rgba(255,255,255,0.15);font-size:12px;text-align:center;margin-top:24px;">
      © ${new Date().getFullYear()} KG Store · Grupo Gómez
    </p>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user_email],
        subject: `${cfg.emoji} Tu reserva ${reservation_code} fue ${cfg.label.toLowerCase()} — KG Store`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error: ${err}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
