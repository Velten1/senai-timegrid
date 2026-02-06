import type { CalendarView, Filters } from '../../types'
import { ViewSelector } from './ViewSelector'
import { FiltersComponent } from './Filters'

// props interface defining what data this component needs
interface SidebarProps {
  currentView: CalendarView // which calendar view is currently selected
  onViewChange: (view: CalendarView) => void // function to change the view
  filters: Filters // current filter values
  onFilterChange: (key: keyof Filters, value: string | undefined) => void // function to update a filter
  onClearFilters: () => void // function to reset all filters
  isOpen: boolean // whether sidebar is open (for mobile)
  onClose: () => void // function to close sidebar (for mobile)
}

// sidebar component that contains view selector and filters
// responsive: overlay on mobile, always visible on desktop
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
      {/* dark overlay that appears behind sidebar on mobile when open */}
      {/* clicking it closes the sidebar */}
      {/* hidden on desktop (lg:hidden) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* main sidebar container */}
      {/* fixed on mobile (slides in/out), sticky on desktop (always visible) */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-80 bg-gradient-to-b from-slate-900 to-slate-950
          border-r border-slate-800 z-50 transition-transform duration-300
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 space-y-6">
          {/* header section with app title and close button */}
          <div className="flex items-center justify-between lg:justify-start">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SENAI MAP
            </h2>
            {/* close button only visible on mobile */}
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

          {/* subtitle */}
          <p className="text-sm text-gray-400">
            Localização de Cursos e Horários
          </p>

          {/* component that lets user choose between weekly/monthly/grid view */}
          <ViewSelector currentView={currentView} onViewChange={onViewChange} />

          {/* separator and filters section */}
          <div className="border-t border-slate-800 pt-6">
            {/* component with all filter inputs (search, course, teacher, period) */}
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
