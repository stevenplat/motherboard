import { useRef, useState, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import { verifyPin, initPin } from '../lib/auth'

interface Props {
  onUnlock: () => void
}

export default function PinLock({ onUnlock }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    initPin()
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    const filled = digits.every(d => d !== '')
    if (filled) attempt(digits.join(''))
  }, [digits])

  async function attempt(pin: string) {
    const ok = await verifyPin(pin)
    if (ok) {
      onUnlock()
    } else {
      setShaking(true)
      setError(true)
      setTimeout(() => {
        setDigits(['', '', '', '', '', ''])
        setShaking(false)
        setError(false)
        inputs.current[0]?.focus()
      }, 600)
    }
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) {
        const next = [...digits]
        next[i] = ''
        setDigits(next)
      } else if (i > 0) {
        const next = [...digits]
        next[i - 1] = ''
        setDigits(next)
        inputs.current[i - 1]?.focus()
      }
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault()
      const next = [...digits]
      next[i] = e.key
      setDigits(next)
      if (i < 5) inputs.current[i + 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f0f]">
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-bold tracking-[0.3em] text-white uppercase mb-1">
          Motherboard
        </h1>
        <p className="text-xs tracking-widest text-neutral-600 uppercase">
          Personal Dashboard
        </p>
      </div>

      <div className={`flex flex-col items-center gap-8 ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}>
        <p className="text-xs tracking-widest uppercase text-neutral-500">
          Enter PIN
        </p>

        <div className="flex gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={() => {}}
              onKeyDown={e => handleKey(i, e)}
              onPaste={handlePaste}
              className={`w-11 h-14 bg-surface border rounded text-xl font-mono text-center text-white focus:outline-none transition-colors
                ${error ? 'border-red-500/60' : 'border-border focus:border-accent/60'}
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 tracking-wide">Incorrect PIN</p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
