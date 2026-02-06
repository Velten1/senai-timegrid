import { useState } from 'react'
import { Header } from '../components/header/Header'
import { Sidebar } from '../components/sidebar/Sidebar'
import { useFilters } from '../hooks/useFilters'
import { useCalendar } from '../hooks/useCalendar'
import { classes, getCompleteClasses } from '../data/mockData'

// main page component that orchestrates all the calendar functionality
// this is where data flows: mock data → filters → calendar → display
function Home() {
  // controls whether sidebar is open on mobile devices
  // false means closed, true means open
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // step 1: load raw class data and enrich it with course, teacher, and room info
  // this transforms simple class objects into complete objects with all related data
  const completeClasses = getCompleteClasses(classes)

  // step 2: apply user filters to the complete classes
  // this hook manages filter state and returns filtered results
  // filteredClasses will only contain classes that match the current filters
  const { filters, filteredClasses, updateFilter, clearFilters } =
    useFilters(completeClasses)

  // step 3: organize filtered classes by day and manage calendar state
  // this hook groups classes by day of week and handles view/date navigation
  const {
    currentView, // which view is active (weekly/monthly/grid)
    setCurrentView, // function to change view
    classesByDay, // classes organized in 7 arrays (one per day)
  } = useCalendar(filteredClasses)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* header with app title and mobile menu button */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* sidebar with filters and view selector */}
        {/* on mobile: overlay when open, hidden when closed */}
        {/* on desktop: always visible, sticky position */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* main content area where calendar views are displayed */}
        <main className="flex-1 p-4 lg:p-8">
          {/* conditionally render different views based on currentView state */}
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
