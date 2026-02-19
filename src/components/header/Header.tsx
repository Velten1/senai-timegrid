import { useState } from 'react'
import type { Period } from '../../utils/courseSchedule'

interface HeaderProps {
  onPeriodChange: (period: Period) => void
}

// header component that displays app title, subtitle, and period filter buttons
// period buttons filter classes by time of day (manhã, tarde, noite)
export function Header({ onPeriodChange }: HeaderProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(null)

  const handlePeriodClick = (period: Period) => {
    const newPeriod = selectedPeriod === period ? null : period
    setSelectedPeriod(newPeriod)
    onPeriodChange(newPeriod)
  }

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 backdrop-blur-sm">
      <div className="p-4 lg:p-6">
        {/* app title and subtitle */}
        <div className="mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SENAI MAP
          </h1>
          {/* subtitle */}
          <p className="text-sm text-gray-400">
            Localização de Cursos e Horários
          </p>
        </div>

        {/* period filter buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handlePeriodClick('manha')}
            className={`
              flex-1 py-5 rounded-lg font-bold text-lg lg:text-xl transition-all duration-200 
              active:scale-95 touch-manipulation
              ${selectedPeriod === 'manha'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
              }
            `}
            style={{ minHeight: '64px' }}
          >
            Manhã
          </button>
          <button
            onClick={() => handlePeriodClick('tarde')}
            className={`
              flex-1 py-5 rounded-lg font-bold text-lg lg:text-xl transition-all duration-200 
              active:scale-95 touch-manipulation
              ${selectedPeriod === 'tarde'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
              }
            `}
            style={{ minHeight: '64px' }}
          >
            Tarde
          </button>
          <button
            onClick={() => handlePeriodClick('noite')}
            className={`
              flex-1 py-5 rounded-lg font-bold text-lg lg:text-xl transition-all duration-200 
              active:scale-95 touch-manipulation
              ${selectedPeriod === 'noite'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
              }
            `}
            style={{ minHeight: '64px' }}
          >
            Noite
          </button>
        </div>
      </div>
    </header>
  )
}
