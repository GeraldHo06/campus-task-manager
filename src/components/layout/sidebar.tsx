import { useState } from 'react'
import { LayoutDashboard, BookOpen, CheckSquare, Calendar, Settings, LogOut, Menu, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: BookOpen, label: 'Subjects', to: '/subjects' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
  { icon: Calendar, label: 'Calendar', to: '/calendar' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <div className="mb-8 px-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">CampusTask</h1>
          <p className="text-xs text-gray-400 mt-0.5">Stay on top of your work</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 pt-4 flex flex-col gap-1">
        <NavLink
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings size={18} />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 bg-white border-r border-gray-100 flex-col px-4 py-6 fixed left-0 top-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg border border-gray-200 text-gray-600 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col px-4 py-6 z-50 transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  )
}