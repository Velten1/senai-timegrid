import { useState } from 'react'
import type { Period } from '../../utils/courseSchedule'

interface HeaderProps {
  onPeriodChange: (period: Period) => void
}

/**
 * Header com identidade SENAI.
 * Barra vermelha #e30613 com logo branco e filtros de período em vermelho.
 */
export function Header({ onPeriodChange }: HeaderProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(null)

  const handlePeriodClick = (period: Period) => {
    const newPeriod = selectedPeriod === period ? null : period
    setSelectedPeriod(newPeriod)
    onPeriodChange(newPeriod)
  }

  const periods: { key: Period; label: string }[] = [
    { key: 'manha', label: 'Manhã' },
    { key: 'tarde', label: 'Tarde' },
    { key: 'noite', label: 'Noite' },
  ]

  return (
    <header className="sticky top-0 z-30 shadow-md">
      {/* Barra vermelha principal — estilo site SENAI */}
      <div className="bg-[#e30613] px-4 lg:px-6 py-3 flex items-center gap-4">
        <span className="text-xl lg:text-2xl font-black text-white tracking-tight">SENAI</span>
        <span className="text-white/50">|</span>
        <span className="text-white/90 text-sm font-medium">TimeGrid</span>
      </div>

      {/* Filtros de período — fundo branco com botões vermelhos */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <p className="text-xs text-[#878787] mb-3 font-medium uppercase tracking-wider">
          Filtrar por período
        </p>
        <div className="flex gap-3">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handlePeriodClick(key)}
              className={`
                flex-1 py-3.5 rounded-lg font-bold text-base lg:text-lg transition-all duration-200
                active:scale-95 touch-manipulation
                ${selectedPeriod === key
                  ? 'bg-[#e30613] text-white shadow-lg shadow-[#e30613]/30'
                  : 'bg-[#ededed] text-gray-600 hover:bg-[#e30613]/10 hover:text-[#e30613] border border-gray-200'
                }
              `}
              style={{ minHeight: '52px' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
