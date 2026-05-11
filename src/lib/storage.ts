// Local storage fallback for when Supabase is not configured.
// All keys are prefixed with 'mb_' to avoid collisions.

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`mb_${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function lsSet<T>(key: string, value: T): void {
  localStorage.setItem(`mb_${key}`, JSON.stringify(value))
}

export function lsDel(key: string): void {
  localStorage.removeItem(`mb_${key}`)
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
