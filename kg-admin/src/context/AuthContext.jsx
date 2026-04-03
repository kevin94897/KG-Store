import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useDemo, DEMO_EMAIL, DEMO_USER } from './DemoContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { setIsDemo } = useDemo()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    if (email.trim().toLowerCase() === DEMO_EMAIL) {
      if (password === 'demo1234') {
        setUser(DEMO_USER)
        setIsDemo(true)
        return { error: null }
      }
      return { error: { message: 'Credenciales demo incorrectas' } }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const logout = () => {
    if (user?.id === DEMO_USER.id) {
      setUser(null)
      setIsDemo(false)
      return Promise.resolve()
    }
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
