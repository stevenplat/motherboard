import { useState } from 'react'
import { lsGet, lsSet, uid } from '../../lib/storage'
import type { ReadingItem } from '../../types'

const TYPES = ['book', 'article', 'course', 'podcast'] as const
const STATUSES = ['queue', 'in_progress', 'done'] as const

const STATUS_LABEL: Record<ReadingItem['status'], string> = {
  queue: 'Queue',
  in_progress: 'Reading',
  done: 'Done',
}

export default function ReadingSection() {
  const [items, setItems] = useState<ReadingItem[]>(() => lsGet<ReadingItem[]>('reading', []))
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<ReadingItem['status']>('in_progress')
  const [form, setForm] = useState({ title: '', author: '', type: 'book' as ReadingItem['type'], url: '' })

  function save(updated: ReadingItem[]) {
    lsSet('reading', updated)
    setItems(updated)
  }

  function addItem() {
    if (!form.title.trim()) return
    save([...items, {
      id: uid(),
      title: form.title.trim(),
      author: form.author.trim() || undefined,
      type: form.type,
      status: 'queue',
      url: form.url.trim() || undefined,
    }])
    setForm({ title: '', author: '', type: 'book', url: '' })
    setAdding(false)
  }

  function cycle(id: string) {
    save(items.map(item => {
      if (item.id !== id) return item
      const order: ReadingItem['status'][] = ['queue', 'in_progress', 'done']
      const next = order[(order.indexOf(item.status) + 1) % order.length]
      return { ...item, status: next }
    }))
  }

  function remove(id: string) {
    save(items.filter(i => i.id !== id))
  }

  const visible = items.filter(i => i.status === filter)
  const inProgressCount = items.filter(i => i.status === 'in_progress').length

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Reading Queue</span>
        <button className="btn-ghost" onClick={() => setAdding(a => !a)}>+ add</button>
      </div>

      <div className="flex gap-1">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn-ghost text-xs ${filter === s ? 'text-neutral-200 bg-white/5' : ''}`}
          >
            {STATUS_LABEL[s]}
            {s === 'in_progress' && inProgressCount > 0 && ` (${inProgressCount})`}
          </button>
        ))}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded bg-black/20">
          <input
            className="input-base"
            placeholder="Title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              className="input-base"
              placeholder="Author (opt)"
              value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            />
            <select
              className="input-base w-32 shrink-0"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as ReadingItem['type'] }))}
            >
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary" onClick={addItem}>Add</button>
          </div>
        </div>
      )}

      {visible.length === 0 && !adding && (
        <p className="text-sm text-neutral-600 py-1">Nothing in {STATUS_LABEL[filter].toLowerCase()}.</p>
      )}

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
        {visible.map(item => (
          <div key={item.id} className="flex items-start gap-3 group">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-200 leading-snug">{item.title}</p>
              <div className="flex gap-2 mt-0.5">
                {item.author && <span className="text-xs text-neutral-600">{item.author}</span>}
                <span className="tag capitalize">{item.type}</span>
              </div>
            </div>
            <button
              onClick={() => cycle(item.id)}
              className="tag text-xs shrink-0 hover:border-accent/40 hover:text-accent transition-colors cursor-pointer"
            >
              {STATUS_LABEL[item.status]}
            </button>
            <button
              onClick={() => remove(item.id)}
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
