import type { Filters } from '../../types'
import { courses, teachers } from '../../data/mockData'

interface FiltersProps {
  filters: Filters
  onFilterChange: (key: keyof Filters, value: string | undefined) => void
  onClearFilters: () => void
}

export function FiltersComponent({
  filters,
  onFilterChange,
  onClearFilters,
}: FiltersProps) {
  const hasActiveFilters =
    filters.courseId || filters.teacherId || filters.period || filters.search

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar por título, curso, professor..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value || undefined)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Curso
          </label>
          <select
            value={filters.courseId || ''}
            onChange={(e) => onFilterChange('courseId', e.target.value || undefined)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos os cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.icon} {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Professor
          </label>
          <select
            value={filters.teacherId || ''}
            onChange={(e) => onFilterChange('teacherId', e.target.value || undefined)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos os professores</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Período
          </label>
          <select
            value={filters.period || ''}
            onChange={(e) => onFilterChange('period', e.target.value || undefined)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Todos os períodos</option>
            <option value="2026.1">2026.1</option>
            <option value="2026.2">2026.2</option>
            <option value="2025.2">2025.2</option>
          </select>
        </div>
      </div>
    </div>
  )
}
