import Sidebar from '../components/layout/sidebar'
import TopBar from '../components/layout/TopBar'

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title="Dashboard" />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Tasks', value: '0' },
              { label: 'Due Today', value: '0' },
              { label: 'Completed', value: '0' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-700 mb-4">Recent Tasks</p>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-400">No tasks yet</p>
              <p className="text-xs text-gray-300 mt-1">Create a subject and add your first task</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}