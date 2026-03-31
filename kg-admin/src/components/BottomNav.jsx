import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, CreditCard, Users } from 'lucide-react'

const tabs = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/productos', icon: Package,         label: 'Productos' },
  { to: '/cuotas',    icon: CreditCard,      label: 'Cuotas' },
  { to: '/usuarios',  icon: Users,           label: 'Usuarios' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-dark-800/95 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
      <div className="max-w-7xl mx-auto px-4 flex h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider
               transition-all duration-150 active:scale-90
               ${isActive ? 'text-accent' : 'text-white/25'}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
