import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { HealthEntry, HealthMetricKey } from '../../types'
import { format, addDays } from 'date-fns'
import {
  ResponsiveContainer, ComposedChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts'

const TODAY = format(new Date(), 'yyyy-MM-dd')

const METRICS: { key: HealthMetricKey; label: string; unit: string }[] = [
  { key: 'weight_lbs',    label: 'Weight',     unit: 'lbs' },
  { key: 'body_fat_pct',  label: 'Body Fat',   unit: '%'   },
  { key: 'lean_mass_lbs', label: 'Lean Mass',  unit: 'lbs' },
]

// ── Linear regression ────────────────────────────────────────────
function linReg(pts: { x: number; y: number }[]) {
  const n = pts.length
  if (n < 2) return null
  const sx = pts.reduce((s, p) => s + p.x, 0)
  const sy = pts.reduce((s, p) => s + p.y, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const sx2 = pts.reduce((s, p) => s + p.x * p.x, 0)
  const d = n * sx2 - sx * sx
  if (d === 0) return null
  const slope = (n * sxy - sx * sy) / d
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

function buildChartData(entries: HealthEntry[], key: HealthMetricKey) {
  const valid = entries
    .filter(e => e[key] != null)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!valid.length) return { data: [], projected6m: null }

  const epoch = new Date(valid[0].date + 'T00:00:00').getTime()
  const DAY = 86_400_000

  const regPts = valid.map(e => ({
    x: (new Date(e.date + 'T00:00:00').getTime() - epoch) / DAY,
    y: e[key] as number,
  }))
  const reg = linReg(regPts)

  const data: {
    label: string; x: number;
    actual?: number; projected?: number
  }[] = valid.map(e => ({
    label: format(new Date(e.date + 'T00:00:00'), 'MMM d'),
    x: (new Date(e.date + 'T00:00:00').getTime() - epoch) / DAY,
    actual: e[key] as number,
  }))

  let projected6m: number | null = null
  if (reg) {
    const lastEntry = valid[valid.length - 1]
    const lastDate = new Date(lastEntry.date + 'T00:00:00')
    // connect projection at last actual point
    data[data.length - 1].projected = data[data.length - 1].actual

    for (let m = 1; m <= 6; m++) {
      const d = addDays(lastDate, m * 30)
      const x = (d.getTime() - epoch) / DAY
      const y = Math.round((reg.slope * x + reg.intercept) * 10) / 10
      data.push({ label: format(d, 'MMM d'), x, projected: y })
      if (m === 6) projected6m = y
    }
  }

  return { data, projected6m }
}

// ── Custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null
  const actual = payload.find((p: any) => p.dataKey === 'actual')
  const proj   = payload.find((p: any) => p.dataKey === 'projected')
  const label  = payload[0]?.payload?.label
  return (
    <div className="bg-[#1a1a1a] border border-border px-3 py-2 rounded text-xs">
      <p className="text-neutral-500 mb-1">{label}</p>
      {actual && <p className="text-neutral-200">{actual.value} {unit}</p>}
      {proj && !actual && <p className="text-accent/70">{proj.value} {unit} <span className="text-neutral-600">(proj.)</span></p>}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function HealthSection() {
  const [entries, setEntries] = useState<HealthEntry[]>([])
  const [selected, setSelected] = useState<HealthMetricKey | null>(null)
  const [logging, setLogging] = useState(false)
  const [form, setForm] = useState({ date: TODAY, weight_lbs: '', body_fat_pct: '', lean_mass_lbs: '' })

  useEffect(() => {
    supabase.from('health_metrics').select('*').order('date', { ascending: false })
      .then(({ data }) => { if (data) setEntries(data as HealthEntry[]) })
  }, [])

  // auto-calc lean mass when weight + body fat are both filled
  function handleFormChange(field: string, val: string) {
    const next = { ...form, [field]: val }
    if (field === 'weight_lbs' || field === 'body_fat_pct') {
      const w = parseFloat(next.weight_lbs)
      const bf = parseFloat(next.body_fat_pct)
      if (!isNaN(w) && !isNaN(bf)) {
        next.lean_mass_lbs = (w * (1 - bf / 100)).toFixed(1)
      }
    }
    setForm(next)
  }

  async function logEntry() {
    const payload = {
      date: form.date,
      weight_lbs:    form.weight_lbs    ? parseFloat(form.weight_lbs)    : null,
      body_fat_pct:  form.body_fat_pct  ? parseFloat(form.body_fat_pct)  : null,
      lean_mass_lbs: form.lean_mass_lbs ? parseFloat(form.lean_mass_lbs) : null,
      source: 'manual',
    }
    const { data } = await supabase.from('health_metrics')
      .upsert(payload, { onConflict: 'date' }).select().single()
    if (data) {
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== data.date)
        return [data as HealthEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
      })
    }
    setForm({ date: TODAY, weight_lbs: '', body_fat_pct: '', lean_mass_lbs: '' })
    setLogging(false)
  }

  // ── Summary helpers ──────────────────────────────────────────
  function latest(key: HealthMetricKey) {
    return entries.find(e => e[key] != null)?.[key] ?? null
  }
  function delta(key: HealthMetricKey) {
    const valid = entries.filter(e => e[key] != null)
    if (valid.length < 2) return null
    return Math.round(((valid[0][key] as number) - (valid[1][key] as number)) * 10) / 10
  }

  // ── Chart view ───────────────────────────────────────────────
  if (selected) {
    const meta = METRICS.find(m => m.key === selected)!
    const { data: chartData, projected6m } = buildChartData(entries, selected)
    const todayLabel = format(new Date(), 'MMM d')

    return (
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="btn-ghost text-xs px-1">←</button>
            <span className="section-label mb-0">{meta.label}</span>
          </div>
          <div className="flex gap-1">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                className={`btn-ghost text-xs ${selected === m.key ? 'text-neutral-200 bg-white/5' : ''}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <p className="text-sm text-neutral-600 py-4 text-center">
            Add at least 2 entries to see a trend.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#525252', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#525252', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<ChartTooltip unit={meta.unit} />} />
                <ReferenceLine x={todayLabel} stroke="#404040" strokeDasharray="3 3" />
                <Line
                  dataKey="actual"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  activeDot={{ r: 3, fill: '#818cf8' }}
                />
                <Line
                  dataKey="projected"
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  connectNulls={false}
                  activeDot={{ r: 3, fill: '#818cf8', opacity: 0.6 }}
                  opacity={0.5}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {projected6m != null && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-neutral-600">6-month projection</span>
                <span className="text-sm font-mono text-accent/80">
                  {projected6m} {meta.unit}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ── Summary cards view ───────────────────────────────────────
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-label mb-0">Health</span>
        <button className="btn-ghost" onClick={() => setLogging(l => !l)}>+ log</button>
      </div>

      {logging && (
        <div className="flex flex-col gap-2 p-3 border border-border rounded bg-black/20">
          <input
            type="date"
            className="input-base text-xs"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              className="input-base"
              placeholder="Weight (lbs)"
              type="number"
              value={form.weight_lbs}
              onChange={e => handleFormChange('weight_lbs', e.target.value)}
            />
            <input
              className="input-base"
              placeholder="Body Fat %"
              type="number"
              value={form.body_fat_pct}
              onChange={e => handleFormChange('body_fat_pct', e.target.value)}
            />
          </div>
          <input
            className="input-base"
            placeholder="Lean Mass (lbs) — auto-calculated"
            type="number"
            value={form.lean_mass_lbs}
            onChange={e => setForm(f => ({ ...f, lean_mass_lbs: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost" onClick={() => setLogging(false)}>Cancel</button>
            <button className="btn-primary" onClick={logEntry}>Save</button>
          </div>
        </div>
      )}

      {entries.length === 0 && !logging && (
        <p className="text-sm text-neutral-600 py-2">No health data yet. Log an entry or connect Apple Health.</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {METRICS.map(({ key, label, unit }) => {
          const val = latest(key)
          const d = delta(key)
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className="flex flex-col gap-1 p-3 rounded-lg bg-black/20 border border-border hover:border-accent/30 transition-colors text-left group"
            >
              <span className="text-xs text-neutral-600 tracking-wide">{label}</span>
              {val != null ? (
                <>
                  <span className="text-lg font-mono text-neutral-100 leading-none">
                    {val}
                    <span className="text-xs text-neutral-600 ml-1">{unit}</span>
                  </span>
                  {d != null && (
                    <span className={`text-xs font-mono ${d < 0 ? 'text-emerald-500' : d > 0 ? 'text-red-400' : 'text-neutral-600'}`}>
                      {d > 0 ? '+' : ''}{d} {unit}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-neutral-700">—</span>
              )}
              <span className="text-xs text-neutral-700 group-hover:text-neutral-500 transition-colors mt-1">trend →</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
