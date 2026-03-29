import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import AdminHeader from './components/AdminHeader'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import ProductFormPage from './pages/ProductFormPage'
import CategoriesPage from './pages/CategoriesPage'
import OrdersPage from './pages/OrdersPage'
import InstallmentRequestsPage from './pages/InstallmentRequestsPage'
import MediaLibraryPage from './pages/MediaLibraryPage'
import ReservationsPage from './pages/ReservationsPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-dvh bg-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <LoginPage />

  return (
    <div className="min-h-dvh bg-dark">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 min-h-dvh relative pt-14">
        <Routes>
          <Route path="/"            element={<DashboardPage />} />
          <Route path="/productos"   element={<ProductsPage />} />
          <Route path="/productos/nuevo" element={<ProductFormPage />} />
          <Route path="/productos/:id"   element={<ProductFormPage />} />
          <Route path="/categorias"  element={<CategoriesPage />} />
          <Route path="/pedidos"     element={<OrdersPage />} />
          <Route path="/cuotas"      element={<InstallmentRequestsPage />} />
          <Route path="/medios"      element={<MediaLibraryPage />} />
          <Route path="/reservas"    element={<ReservationsPage />} />
          <Route path="/usuarios"    element={<UsersPage />} />
          <Route path="/usuarios/:id" element={<UserDetailPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
