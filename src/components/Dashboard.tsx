import { format } from 'date-fns'
import { logout } from '../lib/auth'
import FocusSection from './sections/FocusSection'
import HabitsSection from './sections/HabitsSection'
import TasksSection from './sections/TasksSection'
import GoalsSection from './sections/GoalsSection'
import FitnessSection from './sections/FitnessSection'
import JournalSection from './sections/JournalSection'
import SleepSection from './sections/SleepSection'
import ReadingSection from './sections/ReadingSection'
import HealthSection from './sections/HealthSection'

interface Props {
  onLock: () => void
}

export default function Dashboard({ onLock }: Props) {
  function handleLock() {
    logout()
    onLock()
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-3 md:p-6 lg:p-8 overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-lg font-bold tracking-[0.25em] uppercase text-white">
            Motherboard
          </h1>
          <p className="text-xs text-neutral-600 tracking-wide mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="btn-ghost text-xs tracking-widest uppercase"
            title="Refresh"
          >
            ↻
          </button>
          <button
            onClick={handleLock}
            className="btn-ghost text-xs tracking-widest uppercase"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Focus — spans 2 cols on xl */}
        <div className="xl:col-span-2">
          <FocusSection />
        </div>

        {/* Habits */}
        <div>
          <HabitsSection />
        </div>

        {/* Tasks */}
        <div>
          <TasksSection />
        </div>

        {/* Goals */}
        <div>
          <GoalsSection />
        </div>

        {/* Journal */}
        <div>
          <JournalSection />
        </div>

        {/* Fitness */}
        <div>
          <FitnessSection />
        </div>

        {/* Sleep */}
        <div>
          <SleepSection />
        </div>

        {/* Reading */}
        <div>
          <ReadingSection />
        </div>

        {/* Health — spans full width */}
        <div className="xl:col-span-3 md:col-span-2">
          <HealthSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pb-6 flex items-center justify-between">
        <p className="text-xs text-neutral-800 tracking-widest uppercase">Motherboard</p>
        <p className="text-xs text-neutral-800">
          {format(new Date(), 'yyyy')}
        </p>
      </footer>
    </div>
  )
}
