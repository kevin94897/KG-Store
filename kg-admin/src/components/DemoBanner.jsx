import { useDemo } from '../context/DemoContext'
import { Eye } from 'lucide-react'

export default function DemoBanner() {
  const { isDemo } = useDemo()

  if (!isDemo) return null

  return (
    <div className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 bg-accent/10 border-b border-accent/20 px-4 py-1.5 text-accent text-xs font-bold">
      <Eye size={13} />
      Modo demo — las acciones de escritura están deshabilitadas
    </div>
  )
}
