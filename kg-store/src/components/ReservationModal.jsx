import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, Upload, CheckCircle, Copy, AlertCircle, ImageIcon, ChevronRight } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { sendAdminPush } from '../utils/notifications'
import { useAuth } from '../context/AuthContext'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const YAPE_NUMBER = '947841355'
const BCP_ACCOUNT = '19336731094013'
const BCP_CCI = '00219313673109401317'

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="ml-2 text-accent/60 hover:text-accent transition-colors shrink-0">
      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
    </button>
  )
}

export default function ReservationModal({ product, onClose }) {
  const { user, profile } = useAuth()
  const [method, setMethod] = useState('yape') // 'yape' | 'transfer'
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [reservationCode, setReservationCode] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef()

  const price = product.sale_price || product.regular_price

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileError('')

    if (!f.type.startsWith('image/')) {
      setFileError('Solo se aceptan imágenes (JPG, PNG, WebP).')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`El archivo es muy grande. Máximo 5 MB (este pesa ${(f.size / 1024 / 1024).toFixed(1)} MB).`)
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!file) { setFileError('Debes adjuntar el comprobante de pago.'); return }
    setSubmitting(true)
    setError('')

    try {
      // ── Anti-spam: checks ANTES de subir el archivo ──────────

      // 1. Reserva duplicada para este producto
      const { data: existing } = await supabase
        .from('reservations')
        .select('status')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .in('status', ['pending', 'confirmed'])
        .limit(1)

      if (existing?.length > 0) {
        const label = existing[0].status === 'confirmed' ? 'confirmada' : 'pendiente'
        throw new Error(`Ya tienes una reserva ${label} para este producto.`)
      }

      // 2. Límite: máximo 3 reservas pendientes en total
      const { count } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (count >= 3) {
        throw new Error('Tienes 3 reservas pendientes. Espera a que sean confirmadas antes de hacer una nueva.')
      }

      // ── Upload y registro ────────────────────────────────────

      // 3. Upload proof to Supabase Storage
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error('Error al subir el comprobante.')

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path)

      // 4. Insert reservation
      const { data: insertData, error: insertError } = await supabase.from('reservations').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: profile?.full_name || user.user_metadata?.full_name || user.email,
        product_id: product.id,
        product_name: product.name,
        product_price: price,
        payment_method: method,
        payment_proof_url: urlData.publicUrl,
        status: 'pending',
      }).select('reservation_code').single()

      if (insertError) throw new Error('Error al enviar la reserva.')
      setReservationCode(insertData?.reservation_code || '')
      setDone(true)

      // 5. Push al admin en segundo plano
      sendAdminPush('🛒 Nueva reserva', `${product.name} — ${profile?.full_name || user.email}`, '/reservas')

      // 6. Email en segundo plano
      supabase.functions.invoke('send-reservation-email', {
        body: {
          reservation_code: insertData?.reservation_code,
          product_name: product.name,
          product_price: price,
          payment_method: method,
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
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl fade-in max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-dark-800 flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 z-10">
          <div>
            <h2 className="text-base font-bold text-white">Reservar producto</h2>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[220px]">{product.name}</p>
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
              Revisaremos tu comprobante y te notificaremos al correo cuando esté confirmada.
            </p>

            {/* Código de reserva */}
            {reservationCode && (
              <div className="w-full bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 mb-5">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Tu código de reserva</p>
                <p className="text-accent font-mono text-xl font-bold tracking-widest">{reservationCode}</p>
                <p className="text-white/30 text-xs mt-1">Guárdalo para consultar el estado de tu pedido</p>
              </div>
            )}

            <Link
              to="/mis-reservas"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 btn-accent py-3 text-sm mb-3"
            >
              Ver estado de mis reservas
              <ChevronRight size={16} />
            </Link>
            <button onClick={onClose} className="text-white/40 text-sm hover:text-white transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">

            {/* Precio */}
            {price && (
              <div className="bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-white/60 text-sm">Monto a pagar</span>
                <span className="text-accent font-bold text-lg">S/{price.toFixed(2)}</span>
              </div>
            )}

            {/* Método de pago */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Método de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'yape', label: 'Yape', emoji: '📱' },
                  { id: 'transfer', label: 'Transferencia', emoji: '🏦' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all
                      ${method === m.id
                        ? 'bg-accent/10 border-accent/40 text-accent'
                        : 'bg-dark-700 border-white/8 text-white/50 hover:border-white/20'}`}
                  >
                    <span>{m.emoji}</span> {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datos de pago */}
            <div className="bg-dark-700 border border-white/8 rounded-xl overflow-hidden">
              {method === 'yape' ? (
                <div className="px-4 py-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-3">Datos Yape</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Número de Yape</p>
                      <p className="text-white font-bold text-lg tracking-widest">{YAPE_NUMBER}</p>
                    </div>
                    <CopyButton value={YAPE_NUMBER} />
                  </div>
                  <p className="text-white/30 text-xs mt-3">
                    Abre Yape, busca el número y transfiere el monto exacto.
                  </p>
                </div>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Datos BCP</p>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Cuenta Soles BCP</p>
                    <div className="flex items-center">
                      <p className="text-white font-mono text-sm font-semibold tracking-wider">{BCP_ACCOUNT}</p>
                      <CopyButton value={BCP_ACCOUNT} />
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Cuenta Interbancaria (CCI)</p>
                    <div className="flex items-center">
                      <p className="text-white font-mono text-sm font-semibold tracking-wider">{BCP_CCI}</p>
                      <CopyButton value={BCP_CCI} />
                    </div>
                  </div>
                  <p className="text-white/30 text-xs">
                    Transfiere desde cualquier banco usando el CCI.
                  </p>
                </div>
              )}
            </div>

            {/* Upload comprobante */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">
                Comprobante de pago <span className="text-red-400">*</span>
              </p>

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden border border-accent/30">
                  <img src={preview} alt="Comprobante" className="w-full max-h-48 object-contain bg-black" />
                  <button
                    onClick={() => { setFile(null); setPreview(null); setFileError('') }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="px-3 py-2 bg-accent/10 border-t border-accent/20">
                    <p className="text-accent text-xs font-semibold truncate">{file.name}</p>
                    <p className="text-white/30 text-[10px]">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-white/10 hover:border-accent/30 rounded-2xl py-8 flex flex-col items-center gap-2 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-accent/10 flex items-center justify-center transition-colors">
                    <Upload size={18} className="text-white/30 group-hover:text-accent transition-colors" />
                  </div>
                  <p className="text-white/50 text-sm font-semibold">Subir captura de pago</p>
                  <p className="text-white/25 text-xs">JPG, PNG, WebP · máx. 5 MB</p>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />

              {fileError && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-xs">{fileError}</p>
                </div>
              )}
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
              disabled={submitting || !file}
              className="w-full btn-accent py-3.5 text-sm disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ImageIcon size={16} />
                  Enviar reserva
                </>
              )}
            </button>

            <p className="text-white/25 text-xs text-center pb-1">
              Recibirás confirmación una vez que revisemos tu comprobante.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
