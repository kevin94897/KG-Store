import { createContext, useContext, useState, useCallback } from 'react'

const DemoContext = createContext(null)

export const DEMO_EMAIL = 'demo@kgstore.com'

// Fake user object for demo mode (no real Supabase auth)
export const DEMO_USER = {
  id: 'demo-user-id',
  email: DEMO_EMAIL,
  user_metadata: { full_name: 'Demo User' },
}

// Fake client that appears in Usuarios
export const DEMO_CLIENT = {
  id: 'demo-client-id',
  full_name: 'Carlos Mendoza',
  user_email: 'carlos.mendoza@gmail.com',
  phone: '987 654 321',
  avatar_url: null,
  created_at: '2025-01-10T14:22:00Z',
  reservation_count: 2,
  favorite_count: 3,
}

// Fake reservations for DEMO_CLIENT detail view
export const DEMO_CLIENT_RESERVATIONS = [
  {
    id: 'demo-res-1',
    reservation_code: 'KG-DEMO1',
    product_name: 'Figura Goku Ultra Instinct — Bandai S.H.Figuarts',
    product_price: 350,
    payment_method: 'yape',
    status: 'confirmed',
    created_at: '2025-01-10T14:22:00Z',
    user_name: 'Carlos Mendoza',
    user_email: 'carlos.mendoza@gmail.com',
  },
  {
    id: 'demo-res-2',
    reservation_code: 'KG-DEMO2',
    product_name: 'Nendoroid Nezuko Kamado — Good Smile',
    product_price: 180,
    payment_method: 'transfer',
    status: 'pending',
    created_at: '2025-02-03T09:10:00Z',
    user_name: 'Carlos Mendoza',
    user_email: 'carlos.mendoza@gmail.com',
  },
]

// Fake installment request that appears in Cuotas
export const DEMO_INSTALLMENT = {
  id: 'demo-installment-id',
  customer_name: 'Carlos Mendoza',
  customer_email: 'carlos.mendoza@gmail.com',
  customer_phone: '987654321',
  product_name: 'Figura Goku Ultra Instinct — Bandai S.H.Figuarts',
  product_price: 350,
  installments: 4,
  frequency: 'semana',
  amount_per_installment: 87.5,
  status: 'pending',
  notes: 'Prefiero realizar los pagos los días lunes.',
  created_at: '2025-01-10T14:22:00Z',
}

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = useCallback((msg = 'Modo demo — esta acción está deshabilitada') => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }, [])

  /** Wraps a mutation. If demo, shows toast and returns false. Otherwise calls fn(). */
  const demoGuard = useCallback((fn) => {
    if (isDemo) {
      showToast()
      return false
    }
    return fn()
  }, [isDemo, showToast])

  return (
    <DemoContext.Provider value={{ isDemo, setIsDemo, demoGuard, toastMsg, showToast }}>
      {children}
    </DemoContext.Provider>
  )
}

export const useDemo = () => useContext(DemoContext)
