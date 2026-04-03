import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Usamos un pequeño timeout o requestAnimationFrame para asegurar que el DOM se haya actualizado
    // o simplemente scrollTo(0,0) que suele bastar en la mayoría de los casos.
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
