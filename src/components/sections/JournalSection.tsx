import { useState, useEffect } from 'react'
import { lsGet, lsSet, uid } from '../../lib/storage'
import type { JournalEntry } from '../../types'
import { format } from 'date-fns'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const MOODS = ['😔', '😐', '🙂', '😊', '🔥'] as const

export default function JournalSection() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => lsGet<JournalEntry[]>('journal', []))
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>()
  const [viewing, setViewing] = useState<string | null>(null)

  const todayEntry = entries.find(e => e.date === TODAY)

  useEffect(() => {
    if (todayEntry) {
      setContent(todayEntry.content)
      setMood(todayEntry.mood)
    }
  }, [])

  function save() {
    if (!content.trim()) return
    const updated = todayEntry
      ? entries.map(e => e.date === TODAY ? { ...e, content, mood } : e)
      : [{ id: uid(), date: TODAY, content, mood }, ...entries]
    lsSet('journal', updated)
    setEntries(updated)
  }

  const recent = entries.slice(0, 3)

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Journal</span>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map(m => (
            <button
              key={m}
              onClick={() => setMood(prev => prev === m ? undefined : m)}
              className={`text-base transition-opacity ${mood === m ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
              title={`Mood ${m}`}
            >
              {MOODS[m - 1]}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="input-base resize-none h-28 text-sm leading-relaxed"
        placeholder="How's today going? What's on your mind..."
        value={content}
        onChange={e => setContent(e.target.value)}
        onBlur={save}
      />

      {entries.length > 0 && (
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <p className="text-xs text-neutral-600 mb-1">Past entries</p>
          {recent.filter(e => e.date !== TODAY).slice(0, 2).map(entry => (
            <button
              key={entry.id}
              onClick={() => setViewing(viewing === entry.id ? null : entry.id)}
              className="text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600">{entry.date}</span>
                {entry.mood && <span className="text-xs">{MOODS[entry.mood - 1]}</span>}
              </div>
              {viewing === entry.id ? (
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{entry.content}</p>
              ) : (
                <p className="text-xs text-neutral-600 truncate mt-0.5 group-hover:text-neutral-500">
                  {entry.content.slice(0, 80)}...
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
