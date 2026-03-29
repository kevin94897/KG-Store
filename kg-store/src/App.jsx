import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import ProductPage from './pages/ProductPage'
import InstallmentsPage from './pages/InstallmentsPage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'
import ReservationsPage from './pages/ReservationsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-dvh bg-dark">
          <Header />
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
          {/* <FloatingWhatsApp /> */}
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
