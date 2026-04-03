import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'

// Carga perezosa de páginas para reducir el bundle inicial
const HomePage = lazy(() => import('./pages/HomePage'))
const StorePage = lazy(() => import('./pages/StorePage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const InstallmentsPage = lazy(() => import('./pages/InstallmentsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'))

// Cargador simple para el Suspense
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <div className="min-h-dvh bg-dark">
          <Header />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tienda" element={<StorePage />} />
              <Route path="/producto/:slug" element={<ProductPage />} />
              <Route path="/cuotas" element={<InstallmentsPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/favoritos" element={<FavoritesPage />} />
              <Route path="/mis-reservas" element={<ReservationsPage />} />
              <Route path="*" element={<StorePage />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
