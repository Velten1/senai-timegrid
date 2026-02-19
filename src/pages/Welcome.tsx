import { useNavigate } from 'react-router-dom'

const modalities = [
  {
    id: 'superior',
    name: 'Cursos Superiores',
    color: '#3B82F6',
  },
  {
    id: 'tecnico',
    name: 'Cursos Técnicos',
    color: '#10B981',
  },
  {
    id: 'livre',
    name: 'Cursos Livres',
    color: '#F59E0B',
  },
  {
    id: 'pos-graduacao',
    name: 'Cursos Pós-Graduação',
    color: '#EC4899',
  },
]

const announcements = [
  'Segunda Feira será feriado e não teremos aulas.',
  'Professor João está doente e não poderá lecionar a aula de hoje.',
  'Aula de AWS foi remarcada para sexta-feira.',
  // Adicione mais anúncios aqui conforme necessário
]

function Welcome() {
  const navigate = useNavigate()

  const handleModalityClick = (modalityId: string) => {
    navigate(`/cursos/${modalityId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* Título e Descrição */}
        <div className="text-center mb-12 pt-8">
          <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            SENAI MAP
          </h2>
          <p className="text-base lg:text-lg text-gray-400">
            Localização de Cursos e Horários
          </p>
        </div>

        {/* Grid de Modalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {modalities.map((modality) => (
            <button
              key={modality.id}
              onClick={() => handleModalityClick(modality.id)}
              className="rounded-xl p-10 lg:p-12 flex flex-col border transition-all duration-200 bg-slate-800/50 hover:bg-slate-800/70 active:scale-95 touch-manipulation"
              style={{
                borderColor: `${modality.color}30`,
                minHeight: '200px',
              }}
            >
              <div className="flex items-center justify-center flex-1">
                <span
                  className="text-3xl lg:text-4xl font-bold"
                  style={{ color: modality.color }}
                >
                  {modality.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Seção de Anúncios */}
        <div
          className="rounded-xl p-10 lg:p-12 border transition-all duration-200 bg-slate-800/50"
          style={{
            borderColor: '#EC489930',
            minHeight: '200px',
          }}
        >
          <h3 className="text-3xl lg:text-4xl font-bold text-center mb-8" style={{ color: '#EC4899' }}>
            Anúncios
          </h3>
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <p
                key={index}
                className="text-xl lg:text-2xl text-gray-300 text-center"
              >
                {announcement}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome
