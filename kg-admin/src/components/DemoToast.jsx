import { useDemo } from '../context/DemoContext'
import { ShieldOff } from 'lucide-react'

export default function DemoToast() {
  const { toastMsg } = useDemo()

  if (!toastMsg) return null

  return (
    <div className="fixed bottom-24 inset-x-0 flex justify-center z-[100] px-4 pointer-events-none">
      <div className="flex items-center gap-2.5 bg-surface-2 border border-line-2 text-ink text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl shadow-black/60 fade-in">
        <ShieldOff size={15} className="text-accent shrink-0" />
        {toastMsg}
      </div>
    </div>
  )
}
