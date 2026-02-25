import { useState, useMemo } from 'react'
import { Header } from '../components/header/Header'
import { CampusMap } from '../components/map/CampusMap'
import { courses, classes, getCompleteClasses } from '../data/mockData'
import type { Period } from '../utils/courseSchedule'

// main page component - displays campus map with course buttons
// each course button opens a modal with course information
function Home() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(null)
  const completeClasses = useMemo(() => getCompleteClasses(classes), [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* header with app title and period filters */}
      <Header onPeriodChange={setSelectedPeriod} />

      {/* main content area - campus map */}
      <main className="p-4 lg:p-8">
        {/* campus map canvas with course buttons */}
        {/* clicking a course button opens modal with course details */}
        <CampusMap courses={courses} period={selectedPeriod} completeClasses={completeClasses} />
      </main>
    </div>
  )
}

export default Home
