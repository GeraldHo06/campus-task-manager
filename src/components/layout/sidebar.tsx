import { LayoutDashboard, BookOpen, CheckSquare, Calendar, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: BookOpen, label: 'Subjects', to: '/subjects' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
  { icon: Calendar, label: 'Calendar', to: '/calendar' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-semibold text-gray-900">CampusTask</h1>
        <p className="text-xs text-gray-400 mt-0.5">Stay on top of your work</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 pt-4 mt-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}