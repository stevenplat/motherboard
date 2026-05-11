import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Habit } from '../../types'
import { format, subDays } from 'date-fns'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const LAST_7 = Array.from({ length: 7 }, (_, i) =>
  format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
)

function calcStreak(completions: string[]): number {
  let s = 0
  let d = new Date()
  while (true) {
    const key = format(d, 'yyyy-MM-dd')
    if (completions.includes(key)) { s++; d = subDays(d, 1) } else break
  }
  return s
}

export default function HabitsSection() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: hData }, { data: cData }] = await Promise.all([
        supabase.from('habits').select('*').order('created_at'),
        supabase.from('habit_completions').select('*'),
      ])
      if (hData && cData) {
        setHabits(hData.map(h => {
          const completions = cData.filter(c => c.habit_id === h.id).map(c => c.date as string)
          return { id: h.id, name: h.name, completions, streak: calcStreak(completions) }
        }))
      }
    }
    load()
  }, [])

  async function toggle(id: string) {
    const habit = habits.find(h => h.id === id)
    if (!habit) return
    const done = habit.completions.includes(TODAY)
    if (done) {
      await supabase.from('habit_completions').delete().eq('habit_id', id).eq('date', TODAY)
    } else {
      await supabase.from('habit_completions').insert({ habit_id: id, date: TODAY })
    }
    const completions = done ? habit.completions.filter(d => d !== TODAY) : [...habit.completions, TODAY]
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completions, streak: calcStreak(completions) } : h))
  }

  async function addHabit() {
    if (!newName.trim()) return
    const { data } = await supabase.from('habits').insert({ name: newName.trim() }).select().single()
    if (data) setHabits(prev => [...prev, { id: data.id, name: data.name, completions: [], streak: 0 }])
    setNewName('')
    setAdding(false)
  }

  async function remove(id: string) {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const todayCount = habits.filter(h => h.completions.includes(TODAY)).length

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Daily Habits</span>
        <div className="flex items-center gap-3">
          {habits.length > 0 && (
            <span className="text-xs text-neutral-600">{todayCount}/{habits.length} today</span>
          )}
          <button className="btn-ghost" onClick={() => setAdding(a => !a)}>+ add</button>
        </div>
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            className="input-base"
            placeholder="Habit name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            autoFocus
          />
          <button className="btn-primary shrink-0" onClick={addHabit}>Add</button>
        </div>
      )}

      {habits.length === 0 && !adding && (
        <p className="text-sm text-neutral-600 py-2">No habits tracked yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {habits.map(habit => {
          const done = habit.completions.includes(TODAY)
          return (
            <div key={habit.id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggle(habit.id)}
                className={`w-4 h-4 rounded border shrink-0 transition-colors flex items-center justify-center
                  ${done ? 'bg-accent border-accent' : 'border-border hover:border-accent/60'}
                `}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className={`text-sm flex-1 ${done ? 'text-neutral-400' : 'text-neutral-200'}`}>
                {habit.name}
              </span>
              <div className="flex gap-0.5 items-center shrink-0">
                {LAST_7.map(day => {
                  const filled = habit.completions.includes(day)
                  const isToday = day === TODAY
                  return (
                    <div
                      key={day}
                      className={`w-2 h-2 rounded-sm transition-colors
                        ${filled ? 'bg-accent' : isToday ? 'bg-border border border-border' : 'bg-border/50'}
                      `}
                    />
                  )
                })}
              </div>
              {habit.streak > 0 && (
                <span className="text-xs text-neutral-600 font-mono w-8 text-right shrink-0">
                  {habit.streak}d
                </span>
              )}
              <button
                onClick={() => remove(habit.id)}
                className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-neutral-400 text-xs transition-opacity"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
