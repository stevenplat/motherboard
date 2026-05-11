const SESSION_KEY = 'mb_session'
const PIN_HASH_KEY = 'mb_pin_hash'
const DEFAULT_PIN = '258585'

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function initPin(): Promise<void> {
  if (!localStorage.getItem(PIN_HASH_KEY)) {
    const hash = await sha256(DEFAULT_PIN)
    localStorage.setItem(PIN_HASH_KEY, hash)
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY)
  if (!stored) {
    await initPin()
    return verifyPin(pin)
  }
  const hash = await sha256(pin)
  const valid = hash === stored
  if (valid) sessionStorage.setItem(SESSION_KEY, '1')
  return valid
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const valid = await verifyPin(currentPin)
  if (!valid) return false
  const hash = await sha256(newPin)
  localStorage.setItem(PIN_HASH_KEY, hash)
  return true
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
