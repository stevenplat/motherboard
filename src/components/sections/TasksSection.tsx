import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Task } from '../../types'

const PRIORITIES = ['high', 'medium', 'low'] as const
const PRIORITY_COLOR: Record<Task['priority'], string> = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-neutral-600',
}

export default function TasksSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<'active' | 'done'>('active')

  useEffect(() => {
    supabase.from('tasks').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTasks(data as Task[]) })
  }, [])

  async function addTask() {
    if (!input.trim()) return
    const { data } = await supabase.from('tasks').insert({ title: input.trim(), completed: false, priority }).select().single()
    if (data) setTasks(prev => [data as Task, ...prev])
    setInput('')
    setAdding(false)
  }

  async function toggle(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  async function remove(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const visible = tasks
    .filter(t => filter === 'active' ? !t.completed : t.completed)
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.priority] - order[b.priority]
    })

  const doneCount = tasks.filter(t => t.completed).length

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Tasks</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`btn-ghost ${filter === 'active' ? 'text-neutral-200' : ''}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`btn-ghost ${filter === 'done' ? 'text-neutral-200' : ''}`}
          >
            Done {doneCount > 0 && `(${doneCount})`}
          </button>
          <button className="btn-primary" onClick={() => setAdding(a => !a)}>+ new</button>
        </div>
      </div>

      {adding && (
        <div className="flex flex-col gap-2">
          <input
            className="input-base"
            placeholder="Task description..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`tag capitalize transition-colors ${priority === p ? 'border-accent/50 text-accent' : ''}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="btn-primary ml-auto" onClick={addTask}>Add</button>
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <p className="text-sm text-neutral-600 py-2">
          {filter === 'active' ? 'All caught up.' : 'Nothing completed yet.'}
        </p>
      )}

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {visible.map(task => (
          <div key={task.id} className="flex items-start gap-3 group py-0.5">
            <button
              onClick={() => toggle(task.id)}
              className={`w-4 h-4 rounded border shrink-0 mt-0.5 transition-colors flex items-center justify-center
                ${task.completed ? 'bg-accent border-accent' : 'border-border hover:border-accent/60'}
              `}
            >
              {task.completed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className={`text-sm flex-1 leading-5 ${task.completed ? 'line-through text-neutral-600' : 'text-neutral-200'}`}>
              {task.title}
            </span>
            <span className={`text-xs shrink-0 mt-0.5 ${PRIORITY_COLOR[task.priority]}`}>
              {task.priority === 'high' ? '!' : task.priority === 'medium' ? '·' : ''}
            </span>
            <button
              onClick={() => remove(task.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-neutral-400 text-xs transition-opacity mt-0.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
