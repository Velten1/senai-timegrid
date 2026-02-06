import type { CalendarView } from '../../types'

interface ViewSelectorProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
}

const views: { id: CalendarView; label: string; icon: string }[] = [
  { id: 'weekly', label: 'Semanal', icon: '📅' },
  { id: 'monthly', label: 'Mensal', icon: '🗓️' },
  { id: 'grid', label: 'Grade Horária', icon: '📊' },
]

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Vista</h3>
      <div className="space-y-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${
                currentView === view.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-800/50 text-gray-300 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }
            `}
          >
            <span className="text-xl">{view.icon}</span>
            <span className="font-medium">{view.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
