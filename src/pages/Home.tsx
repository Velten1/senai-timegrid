import { useState } from 'react'
import { Header } from '../components/header/Header'
import { Sidebar } from '../components/sidebar/Sidebar'
import { useFilters } from '../hooks/useFilters'
import { useCalendar } from '../hooks/useCalendar'
import { classes, getCompleteClasses } from '../data/mockData'

function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load and transform data
  const completeClasses = getCompleteClasses(classes)

  // Apply filters
  const { filters, filteredClasses, updateFilter, clearFilters } =
    useFilters(completeClasses)

  // Calendar management
  const {
    currentView,
    setCurrentView,
    classesByDay,
  } = useCalendar(filteredClasses)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 lg:p-8">
          {currentView === 'weekly' && (
            <div className="space-y-6">
              {/* TODO: Add NavWeek component */}
              {/* TODO: Add SemanalGrid component */}
              <div className="text-white">
                <p>Weekly view - Components to be added</p>
                <p>Classes by day: {classesByDay.flat().length} total</p>
              </div>
            </div>
          )}

          {currentView === 'monthly' && (
            <div className="text-white">
              <p>Monthly view - To be implemented</p>
            </div>
          )}

          {currentView === 'grid' && (
            <div className="text-white">
              <p>Grid view - To be implemented</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Home
