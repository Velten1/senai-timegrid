// header component that displays app title and subtitle
// simplified for map view - no menu or date needed
export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 backdrop-blur-sm">
      <div className="p-4 lg:p-6">
        {/* app title and subtitle */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SENAI MAP
          </h1>
          {/* subtitle */}
          <p className="text-sm text-gray-400">
            Localização de Cursos e Horários
          </p>
        </div>
      </div>
    </header>
  )
}
