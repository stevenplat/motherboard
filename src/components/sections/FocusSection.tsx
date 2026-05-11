import { useState } from 'react'
import { lsGet, lsSet, uid } from '../../lib/storage'
import type { FocusTask } from '../../types'
import { format } from 'date-fns'

const TODAY = format(new Date(), 'yyyy-MM-dd')

function getTodayTasks(): FocusTask[] {
  const all = lsGet<FocusTask[]>('focus_tasks', [])
  return all.filter(t => t.date === TODAY)
}

export default function FocusSection() {
  const [tasks, setTasks] = useState<FocusTask[]>(getTodayTasks)
  const [input, setInput] = useState('')
  const [minutes, setMinutes] = useState('30')
  const [adding, setAdding] = useState(false)

  function save(updated: FocusTask[]) {
    const all = lsGet<FocusTask[]>('focus_tasks', []).filter(t => t.date !== TODAY)
    lsSet('focus_tasks', [...all, ...updated])
    setTasks(updated)
  }

  function addTask() {
    if (!input.trim()) return
    const next = [...tasks, {
      id: uid(),
      title: input.trim(),
      estimated_min: parseInt(minutes) || 30,
      done: false,
      date: TODAY,
    }]
    save(next)
    setInput('')
    setMinutes('30')
    setAdding(false)
  }

  function toggle(id: string) {
    save(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function remove(id: string) {
    save(tasks.filter(t => t.id !== id))
  }

  const done = tasks.filter(t => t.done).length
  const totalMin = tasks.filter(t => !t.done).reduce((s, t) => s + t.estimated_min, 0)

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Today's Focus</span>
        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <span className="text-xs text-neutral-600">
              {done}/{tasks.length} done
              {totalMin > 0 && <> · {totalMin}m left</>}
            </span>
          )}
          <button className="btn-ghost" onClick={() => setAdding(a => !a)}>+ add</button>
        </div>
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            className="input-base"
            placeholder="Task name..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            autoFocus
          />
          <input
            className="input-base w-20 shrink-0"
            placeholder="min"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            type="number"
          />
          <button className="btn-primary shrink-0" onClick={addTask}>Add</button>
        </div>
      )}

      {tasks.length === 0 && !adding && (
        <p className="text-sm text-neutral-600 py-2">No focus tasks set for today.</p>
      )}

      <div className="flex flex-col gap-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`flex items-center gap-3 group py-1 ${task.done ? 'opacity-40' : ''}`}
          >
            <button
              onClick={() => toggle(task.id)}
              className={`w-4 h-4 rounded border shrink-0 transition-colors flex items-center justify-center
                ${task.done ? 'bg-accent border-accent' : 'border-border hover:border-accent/60'}
              `}
            >
              {task.done && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className={`text-sm flex-1 ${task.done ? 'line-through text-neutral-600' : 'text-neutral-200'}`}>
              {task.title}
            </span>
            <span className="text-xs text-neutral-600 shrink-0">{task.estimated_min}m</span>
            <button
              onClick={() => remove(task.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-neutral-400 text-xs transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
