import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Wrench,
  BookOpen,
  Award,
  Megaphone,
  Clock,
  Calendar,
  ChevronRight,
  Bell,
} from 'lucide-react'

// ── Dados das modalidades ──────────────────────────
const modalities = [
  {
    id: 'tecnico',
    name: 'Cursos Técnicos',
    description: 'Formação técnica profissional com prática em laboratórios',
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-400/50',
    icon: Wrench,
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 'superior',
    name: 'Cursos Superiores',
    description: 'Graduação em engenharia e tecnologia',
    color: '#3B82F6',
    gradient: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/50',
    icon: GraduationCap,
    iconBg: 'bg-blue-500/10',
  },
  {
    id: 'livre',
    name: 'Cursos Livres',
    description: 'Capacitação rápida em diversas áreas do conhecimento',
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-400/50',
    icon: BookOpen,
    iconBg: 'bg-amber-500/10',
  },
  {
    id: 'pos-graduacao',
    name: 'Pós-Graduação',
    description: 'Especialização e MBA para profissionais',
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-violet-600/5',
    borderColor: 'border-violet-500/20',
    hoverBorder: 'hover:border-violet-400/50',
    icon: Award,
    iconBg: 'bg-violet-500/10',
  },
]

// ── Anúncios ───────────────────────────────────────
const announcements = [
  'Segunda Feira será feriado e não teremos aulas.',
  'Professor João está doente e não poderá lecionar a aula de hoje.',
  'Aula de AWS foi remarcada para sexta-feira.',
]

// ── Componente principal ───────────────────────────
function Home() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  // atualiza relógio a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const handleModalityClick = (modalityId: string) => {
    navigate(`/cursos/${modalityId}`)
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-[#0B1120] relative overflow-hidden">
      {/* ── Background decorativo sutil ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-violet-950/20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* ── Conteúdo principal ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ══════════════════════════════════════════
            HEADER / HERO
        ══════════════════════════════════════════ */}
        <header className="text-center mb-12 lg:mb-16">
          {/* Badge de data e hora */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-gray-400 text-sm mb-8 backdrop-blur-sm select-none">
            <Calendar size={14} className="text-blue-400" />
            <span className="capitalize">{formatDate(currentTime)}</span>
            <span className="w-px h-3.5 bg-white/10" />
            <Clock size={14} className="text-cyan-400" />
            <span>{formatTime(currentTime)}</span>
          </div>

          {/* Título principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              SENAI
            </span>
            <span className="text-white/90 ml-2 lg:ml-3">TimeGrid</span>
          </h1>

          {/* Subtítulo */}
          <p className="text-base lg:text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Sistema de Grade de Horários e Localização de Cursos
          </p>

          {/* Linha decorativa */}
          <div className="mt-8 flex justify-center">
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          </div>
        </header>

        {/* ══════════════════════════════════════════
            SEÇÃO DE MODALIDADES
        ══════════════════════════════════════════ */}
        <section className="mb-10 lg:mb-14">
          {/* Título da seção */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-lg font-semibold text-white/80 tracking-wide">
              Selecione uma modalidade
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Escolha a categoria para visualizar os horários disponíveis
            </p>
          </div>

          {/* Grid de cards 2×2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {modalities.map((modality) => {
              const Icon = modality.icon
              return (
                <button
                  key={modality.id}
                  onClick={() => handleModalityClick(modality.id)}
                  className={`
                    group relative overflow-hidden rounded-2xl p-6 lg:p-8
                    bg-gradient-to-br ${modality.gradient}
                    border ${modality.borderColor} ${modality.hoverBorder}
                    backdrop-blur-sm text-left
                    transition-all duration-300 ease-out
                    hover:shadow-xl hover:shadow-black/25
                    hover:-translate-y-1
                    active:scale-[0.98] active:translate-y-0
                    touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                  `}
                  style={{ minHeight: '190px' }}
                >
                  {/* Linha de acento no topo */}
                  <div
                    className="absolute top-0 inset-x-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to right, transparent, ${modality.color}, transparent)`,
                    }}
                  />

                  {/* Conteúdo do card */}
                  <div className="flex items-start justify-between h-full">
                    <div className="flex-1 flex flex-col">
                      {/* Ícone */}
                      <div
                        className={`w-12 h-12 rounded-xl ${modality.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon size={24} style={{ color: modality.color }} />
                      </div>

                      {/* Nome da modalidade */}
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 transition-colors">
                        {modality.name}
                      </h3>

                      {/* Descrição */}
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                        {modality.description}
                      </p>
                    </div>

                    {/* Seta de navegação */}
                    <div className="ml-4 mt-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRight size={22} style={{ color: modality.color }} />
                    </div>
                  </div>

                  {/* Glow sutil no hover */}
                  <div
                    className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500 blur-2xl pointer-events-none"
                    style={{ background: modality.color }}
                  />
                </button>
              )
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            BANNER DE ANÚNCIOS
        ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-2xl border border-rose-500/[0.12] bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-transparent backdrop-blur-sm">
          {/* Linha de acento no topo */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

          {/* Cabeçalho dos anúncios */}
          <div className="flex items-center gap-3 px-6 lg:px-8 pt-6 lg:pt-8 pb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <Megaphone size={20} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Anúncios</h3>
              <p className="text-xs text-gray-500">Comunicados e avisos importantes</p>
            </div>
          </div>

          {/* Lista de anúncios */}
          <div className="px-6 lg:px-8 pb-6 lg:pb-8 space-y-3">
            {announcements.map((text, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3.5 lg:p-4 rounded-xl bg-white/[0.025] border border-white/[0.04] hover:bg-white/[0.05] transition-colors duration-200"
              >
                <Bell
                  size={16}
                  className="text-rose-400/60 mt-0.5 flex-shrink-0"
                />
                <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════ */}
        <footer className="mt-12 lg:mt-16 text-center pb-6">
          <div className="flex justify-center mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <p className="text-xs text-gray-600">
            SENAI TimeGrid &bull; Sistema de Grade de Horários
          </p>
        </footer>
      </div>
    </div>
  )
}

export default Home
