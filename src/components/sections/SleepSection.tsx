import { useState } from 'react'
import { lsGet, lsSet, uid } from '../../lib/storage'
import type { SleepLog } from '../../types'
import { format, subDays, differenceInMinutes, parse } from 'date-fns'

const TODAY = format(new Date(), 'yyyy-MM-dd')

function calcDuration(bedtime: string, wake: string): string {
  try {
    const bed = parse(bedtime, 'HH:mm', new Date())
    let wakeDate = parse(wake, 'HH:mm', new Date())
    if (wakeDate < bed) wakeDate = new Date(wakeDate.getTime() + 86400000)
    const mins = differenceInMinutes(wakeDate, bed)
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  } catch {
    return ''
  }
}

export default function SleepSection() {
  const [logs, setLogs] = useState<SleepLog[]>(() => lsGet<SleepLog[]>('sleep', []))
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ bedtime: '23:00', wake_time: '07:00', quality: 3 as SleepLog['quality'], notes: '' })

  function save(updated: SleepLog[]) {
    lsSet('sleep', updated)
    setLogs(updated)
  }

  function addLog() {
    save([{
      id: uid(),
      date: TODAY,
      bedtime: form.bedtime,
      wake_time: form.wake_time,
      quality: form.quality,
      notes: form.notes || undefined,
    }, ...logs.filter(l => l.date !== TODAY)])
    setAdding(false)
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return logs.find(l => l.date === d)
  })

  const todayLog = logs.find(l => l.date === TODAY)
  const avgQuality = logs.length
    ? (logs.slice(0, 7).reduce((s, l) => s + l.quality, 0) / Math.min(logs.length, 7)).toFixed(1)
    : null

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Sleep</span>
        <div className="flex items-center gap-3">
          {avgQuality && <span className="text-xs text-neutral-600">avg {avgQuality}/5</span>}
          <button className="btn-ghost" onClick={() => setAdding(a => !a)}>+ log</button>
        </div>
      </div>

      <div className="flex gap-1 items-end h-10">
        {last7.map((log, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-accent/70 transition-all"
              style={{ height: log ? `${(log.quality / 5) * 100}%` : '10%', opacity: log ? 1 : 0.15 }}
            />
          </div>
        ))}
      </div>

      {todayLog ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-200">
              {todayLog.bedtime} → {todayLog.wake_time}
              <span className="text-neutral-600 ml-2">{calcDuration(todayLog.bedtime, todayLog.wake_time)}</span>
            </p>
            <p className="text-xs text-neutral-600">Quality {todayLog.quality}/5</p>
          </div>
          <button className="btn-ghost" onClick={() => setAdding(true)}>edit</button>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">No sleep logged today.</p>
      )}

      {adding && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded bg-black/20">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-neutral-600 mb-1 block">Bedtime</label>
              <input type="time" className="input-base" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-neutral-600 mb-1 block">Wake time</label>
              <input type="time" className="input-base" value={form.wake_time} onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-600 mb-1 block">Quality: {form.quality}/5</label>
            <input
              type="range" min={1} max={5} value={form.quality}
              onChange={e => setForm(f => ({ ...f, quality: Number(e.target.value) as SleepLog['quality'] }))}
              className="w-full accent-accent"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary" onClick={addLog}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
