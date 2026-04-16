import { useState, useRef } from 'react'
import {
  X, Upload, CheckCircle, AlertCircle, Package,
  ChevronRight, ImageIcon, Calendar, Hash
} from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const METHOD_OPTIONS = [
  { id: 'yape', label: 'Yape' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'cash', label: 'Efectivo' },
  { id: 'other', label: 'Otro' },
]

function ImageUploadField({ label, required, preview, onFileChange, onClear, error, accept = 'image/*' }) {
  const ref = useRef()
  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-accent/30">
          <img src={preview} alt={label} className="w-full max-h-44 object-contain bg-black/60" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-full border-2 border-dashed border-white/10 hover:border-accent/30 rounded-2xl py-7 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-accent/10 flex items-center justify-center transition-colors">
            <Upload size={18} className="text-white/30 group-hover:text-accent transition-colors" />
          </div>
          <p className="text-white/50 text-sm font-semibold">Subir imagen</p>
          <p className="text-white/25 text-xs">JPG, PNG, WebP · máx. 5 MB</p>
        </button>
      )}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={onFileChange} />
      {error && (
        <div className="flex items-start gap-2 mt-2">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
    </div>
  )
}

export default function UserNewReservationModal({ onClose, onCreated }) {
  const { user, profile } = useAuth()

  const [form, setForm] = useState({
    product_name: '',
    product_price: '',
    advance_payment: '',
    payment_method: 'yape',
    installments_count: '',
    installment_frequency: 'monthly',
    notes: '',
  })

  const [refPhoto, setRefPhoto] = useState(null)
  const [refPreview, setRefPreview] = useState(null)
  const [refError, setRefError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [reservationCode, setReservationCode] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleRefPhoto = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setRefError('')
    if (!f.type.startsWith('image/')) { setRefError('Solo se aceptan imágenes (JPG, PNG, WebP).'); return }
    if (f.size > MAX_FILE_SIZE) { setRefError(`Máximo 5 MB (este pesa ${(f.size / 1024 / 1024).toFixed(1)} MB).`); return }
    setRefPhoto(f)
    setRefPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.product_name.trim()) { setError('El nombre del producto es obligatorio.'); return }
    if (!form.product_price || isNaN(parseFloat(form.product_price))) { setError('Ingresa un precio válido.'); return }
    if (!form.advance_payment || isNaN(parseFloat(form.advance_payment))) { setError('Ingresa el adelanto realizado.'); return }
    if (!form.installments_count || isNaN(parseInt(form.installments_count))) { setError('Ingresa el número de cuotas.'); return }

    setSubmitting(true)

    try {
      // Anti-spam: max 3 pendientes
      const { count } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (count >= 3) {
        throw new Error('Tienes 3 reservas pendientes. Espera a que sean revisadas antes de crear una nueva.')
      }

      // Upload foto referencial (opcional)
      let reference_photo_url = null
      if (refPhoto) {
        const ext = refPhoto.name.split('.').pop().toLowerCase()
        const path = `references/${user.id}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(path, refPhoto, { cacheControl: '3600', upsert: false })
        if (uploadErr) throw new Error('Error al subir la foto referencial.')
        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(uploadData.path)
        reference_photo_url = urlData.publicUrl
      }

      // Insertar reserva
      const { data: insertData, error: insertError } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: profile?.full_name || user.user_metadata?.full_name || user.email,
          product_name: form.product_name.trim(),
          product_price: parseFloat(form.product_price),
          advance_payment: parseFloat(form.advance_payment),
          payment_method: form.payment_method,
          installments_count: parseInt(form.installments_count),
          installment_frequency: form.installment_frequency,
          notes: form.notes.trim() || null,
          reference_photo_url,
          payment_proof_url: '',
          status: 'pending',
        })
        .select('reservation_code')
        .single()

      if (insertError) throw new Error('Error al enviar la reserva.')

      setReservationCode(insertData?.reservation_code || '')
      setDone(true)
      onCreated?.()

      // Email en segundo plano
      supabase.functions.invoke('send-reservation-email', {
        body: {
          reservation_code: insertData?.reservation_code,
          product_name: form.product_name.trim(),
          product_price: parseFloat(form.product_price),
          payment_method: form.payment_method,
          user_email: user.email,
          user_name: profile?.full_name || user.user_metadata?.full_name || user.email,
        }
      }).catch(console.error)

    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl fade-in max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-dark-800 flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 z-10">
          <div>
            <h2 className="text-base font-bold text-white">Nueva reserva</h2>
            <p className="text-white/35 text-xs mt-0.5">Será revisada por el administrador</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* ── Éxito ── */
          <div className="flex flex-col items-center text-center px-6 py-10">
            <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-accent" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¡Reserva enviada!</h3>
            <p className="text-white/50 text-sm mb-5">
              Revisaremos tu solicitud y te notificaremos cuando esté confirmada.
            </p>
            {reservationCode && (
              <div className="w-full bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 mb-5">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Tu código de reserva</p>
                <p className="text-accent font-mono text-xl font-bold tracking-widest">{reservationCode}</p>
                <p className="text-white/30 text-xs mt-1">Guárdalo para consultar el estado de tu pedido</p>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 btn-accent py-3 text-sm mb-3"
            >
              Ver mis reservas
              <ChevronRight size={16} />
            </button>
            <button onClick={onClose} className="text-white/40 text-sm hover:text-white transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">

            {/* Producto */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">
                Nombre del producto <span className="text-red-400">*</span>
              </p>
              <div className="relative">
                <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  placeholder="Ej: Figura Resident Evil 4 Remake"
                  value={form.product_name}
                  onChange={e => set('product_name', e.target.value)}
                  className="w-full bg-dark-700 border border-white/8 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>

            {/* Precio y Adelanto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">
                  Precio total <span className="text-red-400">*</span>
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.product_price}
                    onChange={e => set('product_price', e.target.value)}
                    className="w-full bg-dark-700 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">
                  Adelanto <span className="text-red-400">*</span>
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.advance_payment}
                    onChange={e => set('advance_payment', e.target.value)}
                    className="w-full bg-dark-700 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Cuotas */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">
                Plan de cuotas <span className="text-red-400">*</span>
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="number"
                    min="1"
                    max="52"
                    placeholder="Nº cuotas"
                    value={form.installments_count}
                    onChange={e => set('installments_count', e.target.value)}
                    className="w-full bg-dark-700 border border-white/8 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'weekly', label: 'Semanal', icon: '' },
                    { id: 'monthly', label: 'Mensual', icon: '' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => set('installment_frequency', f.id)}
                      className={`items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap
                        ${form.installment_frequency === f.id
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-dark-700 border-white/8 text-white/50 hover:border-white/20'}`}
                    >
                      <span>{f.icon}</span> {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.product_price && form.advance_payment && form.installments_count && (
                <div className="mt-2 bg-white/3 border border-white/6 rounded-xl px-3 py-2">
                  <p className="text-white/40 text-xs">
                    Saldo restante:{' '}
                    <span className="text-accent font-bold">
                      S/{Math.max(0, parseFloat(form.product_price || 0) - parseFloat(form.advance_payment || 0)).toFixed(2)}
                    </span>
                    {' '}en {form.installments_count} cuota{parseInt(form.installments_count) !== 1 ? 's' : ''}{' '}
                    {form.installment_frequency === 'weekly' ? 'semanales' : 'mensuales'}
                  </p>
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Método de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {METHOD_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => set('payment_method', m.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left
                      ${form.payment_method === m.id
                        ? 'bg-accent/10 border-accent/40 text-accent'
                        : 'bg-dark-700 border-white/8 text-white/50 hover:border-white/20'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Foto referencial */}
            <ImageUploadField
              label="Foto referencial del producto"
              required={false}
              preview={refPreview}
              onFileChange={handleRefPhoto}
              onClear={() => { setRefPhoto(null); setRefPreview(null); setRefError('') }}
              error={refError}
            />

            {/* Notas */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Notas adicionales (opcional)</p>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Color, talla, especificaciones, o cualquier detalle..."
                rows={3}
                className="w-full bg-dark-700 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            {/* Info */}
            <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl px-4 py-3">
              <p className="text-yellow-400/70 text-xs leading-relaxed">
                Tu reserva quedará <span className="font-bold text-yellow-400">en revisión</span> hasta que el administrador la apruebe. Te notificaremos por correo.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full btn-accent py-3.5 text-sm disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ImageIcon size={16} />
                  Enviar solicitud de reserva
                </>
              )}
            </button>

            <p className="text-white/25 text-xs text-center pb-1">
              Recibirás confirmación una vez que revisemos tu solicitud.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
