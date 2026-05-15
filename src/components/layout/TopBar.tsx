import { useAuth } from '../../hooks/useAuth'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  const { user } = useAuth()
  const initials = user?.email?.charAt(0).toUpperCase() ?? 'U'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 right-0 lg:left-60 left-0 z-10">
      <h2 className="text-base font-medium text-gray-900 lg:ml-0 ml-10">{title}</h2>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
          {initials}
        </div>
      </div>
    </header>
  )
}