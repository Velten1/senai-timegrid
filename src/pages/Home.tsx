function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            SENAI MAP
          </h1>
          <p className="text-gray-400 mb-8">
            Localização de Cursos e Horários
          </p>
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-8">
            <p className="text-gray-300">
              Sistema de calendário de aulas em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
