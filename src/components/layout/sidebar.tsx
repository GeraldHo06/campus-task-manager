import { useState, useEffect } from 'react'
import { LayoutDashboard, BookOpen, CheckSquare, Calendar, Settings, LogOut, Menu, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function isOverdue(due_date: string | null, completed: boolean) {
  if (!due_date || completed) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTasks, setActiveTasks] = useState(0)
  const [overdueTasks, setOverdueTasks] = useState(0)

  useEffect(() => {
    async function fetchCounts() {
      const { data } = await supabase
        .from('tasks')
        .select('completed, due_date')
      if (!data) return
      setActiveTasks(data.filter(t => !t.completed).length)
      setOverdueTasks(data.filter(t => isOverdue(t.due_date, t.completed)).length)
    }

    fetchCounts()

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => { fetchCounts() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: BookOpen, label: 'Subjects', to: '/subjects' },
    {
      icon: CheckSquare, label: 'Tasks', to: '/tasks',
      badge: activeTasks > 0 ? activeTasks : null,
      badgeRed: overdueTasks > 0,
    },
    { icon: Calendar, label: 'Calendar', to: '/calendar' },
  ]

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
        {navItems.map(({ icon: Icon, label, to, badge, badgeRed }) => (
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
            <span className="flex-1">{label}</span>
            {badge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                badgeRed
                  ? 'bg-red-100 text-red-600'
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 pt-4 flex flex-col gap-1">
        {overdueTasks > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1 bg-red-50 rounded-lg">
            <span className="text-xs text-red-500 font-medium">
              {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
            </span>
          </div>
        )}
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
      <aside className="hidden lg:flex h-screen w-60 bg-white border-r border-gray-100 flex-col px-4 py-6 fixed left-0 top-0">
        {sidebarContent}
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg border border-gray-200 text-gray-600 shadow-sm"
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`lg:hidden fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col px-4 py-6 z-50 transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  )
}