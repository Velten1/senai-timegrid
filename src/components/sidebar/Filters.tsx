import type { Filters } from '../../types'
import { courses, teachers } from '../../data/mockData'

// props interface for filters component
interface FiltersProps {
  filters: Filters // current filter values
  onFilterChange: (key: keyof Filters, value: string | undefined) => void // function to update a filter
  onClearFilters: () => void // function to reset all filters
}

// component that displays all filter inputs (search, course, teacher, period)
// each input updates the filter state when changed
export function FiltersComponent({
  filters,
  onFilterChange,
  onClearFilters,
}: FiltersProps) {
  // check if any filter is currently active
  // used to show/hide the "clear" button
  const hasActiveFilters =
    filters.courseId || filters.teacherId || filters.period || filters.search

  return (
    <div className="space-y-4">
      {/* header with title and clear button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Filtros</h3>
        {/* only show clear button if at least one filter is active */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* all filter inputs */}
      <div className="space-y-3">
        {/* text search input - searches in title, course name, teacher name, room name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar por título, curso, professor..."
            value={filters.search || ''} // controlled input (value comes from state)
            onChange={(e) => onFilterChange('search', e.target.value || undefined)} // update filter on change
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* course dropdown - filter by specific course */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Curso
          </label>
          <select
            value={filters.courseId || ''} // controlled select
            onChange={(e) => onFilterChange('courseId', e.target.value || undefined)} // update filter on change
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos os cursos</option>
            {/* map through all courses and create an option for each */}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.icon} {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* teacher dropdown - filter by specific teacher */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Professor
          </label>
          <select
            value={filters.teacherId || ''} // controlled select
            onChange={(e) => onFilterChange('teacherId', e.target.value || undefined)} // update filter on change
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos os professores</option>
            {/* map through all teachers and create an option for each */}
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        {/* period dropdown - filter by academic period */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Período
          </label>
          <select
            value={filters.period || ''} // controlled select
            onChange={(e) => onFilterChange('period', e.target.value || undefined)} // update filter on change
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos os períodos</option>
            {/* hardcoded period options */}
            <option value="2026.1">2026.1</option>
            <option value="2026.2">2026.2</option>
            <option value="2025.2">2025.2</option>
          </select>
        </div>
      </div>
    </div>
  )
}
