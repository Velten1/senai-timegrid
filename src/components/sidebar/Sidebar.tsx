import type { CalendarView, Filters } from '../../types'
import { ViewSelector } from './ViewSelector'
import { FiltersComponent } from './Filters'

interface SidebarProps {
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
  filters: Filters
  onFilterChange: (key: keyof Filters, value: string | undefined) => void
  onClearFilters: () => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  currentView,
  onViewChange,
  filters,
  onFilterChange,
  onClearFilters,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-80 bg-gradient-to-b from-slate-900 to-slate-950
          border-r border-slate-800 z-50 transition-transform duration-300
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between lg:justify-start">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SENAI MAP
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-400">
            Localização de Cursos e Horários
          </p>

          {/* View Selector */}
          <ViewSelector currentView={currentView} onViewChange={onViewChange} />

          {/* Filters */}
          <div className="border-t border-slate-800 pt-6">
            <FiltersComponent
              filters={filters}
              onFilterChange={onFilterChange}
              onClearFilters={onClearFilters}
            />
          </div>
        </div>
      </aside>
    </>
  )
}
