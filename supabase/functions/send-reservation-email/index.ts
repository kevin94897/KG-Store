import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'KG Store <no-reply@colecciones.grupo-gomez.com>'

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
    const { reservation_code, product_name, product_price, payment_method, user_email, user_name } = await req.json()

    const methodLabel = payment_method === 'yape' ? 'Yape' : 'Transferencia BCP'
    const priceStr = product_price ? `S/${parseFloat(product_price).toFixed(2)}` : 'Consultar'

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

    <!-- Card principal -->
      <div style="background:#1c1c1c;border-radius:24px;padding:32px;border:1px solid rgba(255,255,255,0.06);">
        <p style="color:#CCFF00;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Reserva recibida</p>
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">¡Hola, ${user_name || 'estimado cliente'}!</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 28px;line-height:1.6;">
          Recibimos tu reserva correctamente. Estamos revisando tu comprobante de pago y te notificaremos cuando esté confirmada.
        </p>
  
        <!-- Código de reserva -->
        <div style="background:rgba(204,255,0,0.1);border:1px solid rgba(204,255,0,0.25);border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Tu código de reserva</p>
          <p style="color:#CCFF00;font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace;margin:0;">${reservation_code}</p>
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:8px 0 0;">Guárdalo para consultar el estado de tu pedido</p>
        </div>

      <!-- Detalle del pedido -->
      <div style="border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;margin-bottom:24px;">
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Producto</p>
          <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0;">${product_name}</p>
        </div>
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;">
          <div>
            <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Monto</p>
            <p style="color:#CCFF00;font-size:16px;font-weight:700;margin:0;">${priceStr}</p>
          </div>
          <div style="text-align:right;">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Método</p>
            <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0;">${methodLabel}</p>
          </div>
        </div>
        <div style="padding:14px 20px;">
          <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Estado</p>
          <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(234,179,8,0.1);color:#eab308;border:1px solid rgba(234,179,8,0.2);border-radius:100px;padding:4px 12px;font-size:12px;font-weight:700;">
            En revisión
          </span>
        </div>
      </div>

      <!-- CTA -->
      <a href="https://colecciones.grupo-gomez.com/mis-reservas"
         style="display:block;background:#CCFF00;color:#000000;text-decoration:none;text-align:center;padding:16px;border-radius:100px;font-weight:700;font-size:15px;margin-bottom:16px;">
        Ver estado de mi reserva →
      </a>

      <p style="color:rgba(255,255,255,0.25);font-size:13px;text-align:center;margin:0;">
        ¿Tienes dudas? Escríbenos por
        <a href="https://wa.me/51947841355" style="color:#CCFF00;text-decoration:none;">WhatsApp</a>
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
        subject: `✅ Reserva ${reservation_code} recibida — KG Store`,
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
