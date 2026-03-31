import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import AdminProfileModal from './AdminProfileModal'

export default function AdminHeader() {
  const { user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('full_name').eq('id', user.id).single()
      .then(({ data }) => {
        setAdminName(data?.full_name || '')
      })
  }, [user])

  const displayName = adminName || user?.email?.split('@')[0] || 'Admin'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-dark-800/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to="/">
            <img
              src="https://mlbdbkny4xg1.i.optimole.com/w:120/h:34/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png"
              alt="KG Store"
              className="h-7"
            />
          </Link>

          {/* Right: nuevo producto + perfil admin */}
          <div className="flex items-center gap-2">
            {/* <Link
              to="/productos/nuevo"
              className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/20 hover:brightness-105 transition-all"
            >
              <Plus size={17} className="text-black" />
            </Link> */}

            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/25 flex items-center justify-center font-bold text-accent text-[11px]">
                {initials}
              </div>
              <span className="text-sm text-white/60 font-medium max-w-[100px] truncate hidden sm:block">
                {displayName}
              </span>
            </button>
          </div>
        </div>
      </header>

      {profileOpen && <AdminProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}
