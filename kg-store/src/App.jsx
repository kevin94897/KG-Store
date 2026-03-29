import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import FloatingWhatsApp from './components/FloatingWhatsApp'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import ProductPage from './pages/ProductPage'
import InstallmentsPage from './pages/InstallmentsPage' 

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-dark">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tienda" element={<StorePage />} />
          <Route path="/producto/:slug" element={<ProductPage />} />
          <Route path="/cuotas" element={<InstallmentsPage />} />
          <Route path="*" element={<StorePage />} />
        </Routes>
        {/* <FloatingWhatsApp /> */}
      </div>
    </BrowserRouter>
  )
}
