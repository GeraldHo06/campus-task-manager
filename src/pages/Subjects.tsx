import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { Subject } from '../types'
import Sidebar from '../components/layout/sidebar'
import TopBar from '../components/layout/TopBar'

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
]

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) setSubjects(data)
    setLoading(false)
  }

  function openCreate() {
    setEditingSubject(null)
    setName('')
    setColor(COLORS[0])
    setError('')
    setShowModal(true)
  }

  function openEdit(subject: Subject) {
    setEditingSubject(subject)
    setName(subject.name)
    setColor(subject.color)
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Subject name is required'); return }
    setSaving(true)

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({ name: name.trim(), color })
        .eq('id', editingSubject.id)

      if (error) { setError(error.message); setSaving(false); return }
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, name: name.trim(), color } : s))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('subjects')
        .insert({ name: name.trim(), color, user_id: user!.id })
        .select()
        .single()

      if (error) { setError(error.message); setSaving(false); return }
      setSubjects(prev => [...prev, data])
    }

    setSaving(false)
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subject? Tasks linked to it will be unlinked.')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (!error) setSubjects(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <TopBar title="Subjects" />
        <main className="pt-16 p-6">

          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-400">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              New Subject
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">No subjects yet</p>
              <p className="text-gray-300 text-xs mt-1">Create a subject to start organizing your tasks</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {subjects.map(subject => (
                <div key={subject.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                      <p className="font-medium text-gray-900 text-sm">{subject.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(subject)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingSubject ? 'Edit Subject' : 'New Subject'}
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="e.g. Mathematics, Web Development"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: color === c ? `3px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSubject ? 'Save changes' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}