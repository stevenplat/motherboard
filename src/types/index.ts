export interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  created_at: string
}

export interface Habit {
  id: string
  name: string
  streak: number
  completions: string[] // ISO date strings
  color?: string
}

export interface Goal {
  id: string
  title: string
  category: 'health' | 'career' | 'personal' | 'finance' | 'learning'
  progress: number // 0–100
  target_date?: string
  notes?: string
}

export interface FitnessLog {
  id: string
  date: string
  workout_type: string
  duration_min: number
  notes?: string
  calories?: number
}

export interface JournalEntry {
  id: string
  date: string // ISO date YYYY-MM-DD
  content: string
  mood?: 1 | 2 | 3 | 4 | 5
}

export interface SleepLog {
  id: string
  date: string
  bedtime: string
  wake_time: string
  quality: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface ReadingItem {
  id: string
  title: string
  author?: string
  type: 'book' | 'article' | 'course' | 'podcast'
  status: 'queue' | 'in_progress' | 'done'
  url?: string
}

export interface FinanceEntry {
  id: string
  date: string
  category: string
  amount: number
  type: 'income' | 'expense'
  description?: string
}

export interface HealthEntry {
  id: string
  date: string
  weight_lbs: number | null
  body_fat_pct: number | null
  lean_mass_lbs: number | null
  source: string
}

export type HealthMetricKey = 'weight_lbs' | 'body_fat_pct' | 'lean_mass_lbs'

export interface FocusTask {
  id: string
  title: string
  estimated_min: number
  done: boolean
  date: string
}
