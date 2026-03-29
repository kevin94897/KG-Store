import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    const { error: e } = await login(email, password)
    if (e) setError('Credenciales incorrectas')
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-dark flex flex-col items-center justify-center px-5 pt-safe">
      {/* Logo */}
      <div className="mb-10 text-center fade-up">
        <img src="https://mlbdbkny4xg1.i.optimole.com/w:120/h:34/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png" alt="KG Store" className="h-12" />
        <p className="text-white text-sm mt-1">Panel de administración</p>
      </div>

      <div className="w-full max-w-sm space-y-3 fade-up">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Correo electrónico</label>
            <input
              className="input"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              placeholder="admin@kgstore.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <input
                className="input pr-12"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 active:text-white/60"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/40 rounded-xl px-3 py-2.5 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <button className="btn-accent w-full" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <LogIn size={17} />
            }
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-xs text-white/20">
          Usa tus credenciales de Supabase Auth
        </p>
      </div>
    </div>
  )
}
