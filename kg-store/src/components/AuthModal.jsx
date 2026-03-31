import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function AuthModal({ onClose }) {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [showEmail, setShowEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await loginWithGoogle()
    if (error) {
      setError('No se pudo iniciar sesión con Google.')
      setLoading(false)
    }
    // Si no hay error, redirige a Google — el modal se cierra solo
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.email || !form.password) {
      setError('Completa todos los campos.')
      return
    }
    setLoading(true)

    if (mode === 'login') {
      const { error } = await loginWithEmail(form.email, form.password)
      if (error) {
        setError('Email o contraseña incorrectos.')
      } else {
        onClose()
      }
    } else {
      if (!form.name.trim()) {
        setError('Ingresa tu nombre.')
        setLoading(false)
        return
      }
      const { error } = await signupWithEmail(form.email, form.password, form.name)
      if (error) {
        setError(error.message.includes('already')
          ? 'Ya existe una cuenta con ese email.'
          : 'Error al crear la cuenta.')
      } else {
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.')
      }
    }
    setLoading(false)
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError('')
    setSuccess('')
    setShowEmail(false)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-dark-800 border border-white/10 rounded-3xl p-6 shadow-2xl fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className="text-white/40 text-sm mt-0.5">
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Únete a KG Store'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold text-sm py-3 px-4 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all duration-150 disabled:opacity-60"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-medium">o con email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email toggle */}
        {!showEmail ? (
          <button
            onClick={() => setShowEmail(true)}
            className="w-full flex items-center justify-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm py-3 px-4 rounded-2xl transition-all duration-150"
          >
            <Mail size={16} />
            Usar email y contraseña
          </button>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3 fade-in">
            {mode === 'signup' && (
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/60 transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/60 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center px-1">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-xs text-center px-1">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-3 text-sm disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </>
              )}
            </button>
          </form>
        )}

        {/* Switch mode */}
        {!success && (
          <p className="text-center text-white/40 text-xs mt-5">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button onClick={switchMode} className="text-accent hover:underline font-semibold">
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
