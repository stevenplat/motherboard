import { useState } from 'react'
import { isAuthenticated } from './lib/auth'
import PinLock from './components/PinLock'
import Dashboard from './components/Dashboard'

export default function App() {
  const [unlocked, setUnlocked] = useState(isAuthenticated)

  return unlocked
    ? <Dashboard onLock={() => setUnlocked(false)} />
    : <PinLock onUnlock={() => setUnlocked(true)} />
}
