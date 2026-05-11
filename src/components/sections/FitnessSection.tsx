import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { FitnessLog } from '../../types'
import { format, subDays } from 'date-fns'

const TODAY = format(new Date(), 'yyyy-MM-dd')

export default function FitnessSection() {
  const [logs, setLogs] = useState<FitnessLog[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ workout_type: '', duration_min: '45', notes: '', calories: '' })

  useEffect(() => {
    supabase.from('fitness_logs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setLogs(data as FitnessLog[]) })
  }, [])

  async function addLog() {
    if (!form.workout_type.trim()) return
    const { data } = await supabase.from('fitness_logs').insert({
      date: TODAY,
      workout_type: form.workout_type.trim(),
      duration_min: parseInt(form.duration_min) || 0,
      notes: form.notes.trim() || null,
      calories: form.calories ? parseInt(form.calories) : null,
    }).select().single()
    if (data) setLogs(prev => [data as FitnessLog, ...prev])
    setForm({ workout_type: '', duration_min: '45', notes: '', calories: '' })
    setAdding(false)
  }

  async function remove(id: string) {
    await supabase.from('fitness_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const recent = logs.slice(0, 5)
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'))
  const activeDays = last7Days.filter(d => logs.some(l => l.date === d)).length

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Fitness</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600">{activeDays}/7 days</span>
          <button className="btn-ghost" onClick={() => setAdding(a => !a)}>+ log</button>
        </div>
      </div>

      <div className="flex gap-1">
        {last7Days.reverse().map((day, i) => {
          const hasLog = logs.some(l => l.date === day)
          const isToday = day === TODAY
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-6 rounded-sm transition-colors ${hasLog ? 'bg-accent/70' : 'bg-border/50'} ${isToday ? 'ring-1 ring-accent/40' : ''}`} />
              <span className="text-xs text-neutral-700">{format(new Date(day + 'T00:00:00'), 'EEE')[0]}</span>
            </div>
          )
        })}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded bg-black/20">
          <input
            className="input-base"
            placeholder="Workout type (e.g. Run, Lift, Yoga)"
            value={form.workout_type}
            onChange={e => setForm(f => ({ ...f, workout_type: e.target.value }))}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              className="input-base"
              placeholder="Duration (min)"
              type="number"
              value={form.duration_min}
              onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
            />
            <input
              className="input-base"
              placeholder="Calories (opt)"
              type="number"
              value={form.calories}
              onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
            />
          </div>
          <input
            className="input-base"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary" onClick={addLog}>Log</button>
          </div>
        </div>
      )}

      {recent.length === 0 && !adding && (
        <p className="text-sm text-neutral-600 py-1">No workouts logged yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {recent.map(log => (
          <div key={log.id} className="flex items-center gap-3 group py-0.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-200">{log.workout_type}</p>
              <p className="text-xs text-neutral-600">
                {log.date === TODAY ? 'Today' : log.date} · {log.duration_min}m
                {log.calories && ` · ${log.calories} cal`}
              </p>
            </div>
            <button
              onClick={() => remove(log.id)}
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
