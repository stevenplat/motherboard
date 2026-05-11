import { useState } from 'react'
import { lsGet, lsSet, uid } from '../../lib/storage'
import type { Goal } from '../../types'

const CATEGORIES = ['health', 'career', 'personal', 'finance', 'learning'] as const
const CAT_COLOR: Record<Goal['category'], string> = {
  health: 'text-emerald-400',
  career: 'text-blue-400',
  personal: 'text-violet-400',
  finance: 'text-amber-400',
  learning: 'text-sky-400',
}

export default function GoalsSection() {
  const [goals, setGoals] = useState<Goal[]>(() => lsGet<Goal[]>('goals', []))
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', category: 'personal' as Goal['category'], progress: 0, target_date: '', notes: '' })

  function save(updated: Goal[]) {
    lsSet('goals', updated)
    setGoals(updated)
  }

  function addGoal() {
    if (!form.title.trim()) return
    save([...goals, { id: uid(), ...form, progress: Number(form.progress) }])
    setForm({ title: '', category: 'personal', progress: 0, target_date: '', notes: '' })
    setAdding(false)
  }

  function updateProgress(id: string, progress: number) {
    save(goals.map(g => g.id === id ? { ...g, progress } : g))
  }

  function remove(id: string) {
    save(goals.filter(g => g.id !== id))
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Goals</span>
        <button className="btn-ghost" onClick={() => setAdding(a => !a)}>+ add</button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded bg-black/20">
          <input
            className="input-base"
            placeholder="Goal title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <div className="flex gap-2">
            <select
              className="input-base flex-1"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Goal['category'] }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              className="input-base flex-1"
              value={form.target_date}
              onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
            />
          </div>
          <textarea
            className="input-base resize-none h-16 text-xs"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary" onClick={addGoal}>Add Goal</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding && (
        <p className="text-sm text-neutral-600 py-2">No goals set yet.</p>
      )}

      <div className="flex flex-col gap-4 max-h-72 overflow-y-auto">
        {goals.map(goal => (
          <div key={goal.id} className="group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200 leading-snug">{goal.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs capitalize ${CAT_COLOR[goal.category]}`}>{goal.category}</span>
                  {goal.target_date && (
                    <span className="text-xs text-neutral-600">{goal.target_date}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-neutral-500">{goal.progress}%</span>
                <button
                  onClick={() => remove(goal.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-neutral-400 text-xs transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${goal.progress}%` }} />
            </div>
            {editing === goal.id ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={e => updateProgress(goal.id, Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <button className="btn-ghost" onClick={() => setEditing(null)}>done</button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(goal.id)}
                className="text-xs text-neutral-700 hover:text-neutral-500 mt-1 transition-colors"
              >
                update progress
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
