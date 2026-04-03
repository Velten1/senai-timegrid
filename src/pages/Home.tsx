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
  CalendarDays,
  Loader2,
} from 'lucide-react'
import senaiWhiteLogo from '../images/senaiWHITE.png'
import senaiRedLogo from '../images/senaiRED.png'
import { useAvisosDataContext } from '../contexts/AvisosDataContext'
import type { Aviso } from '../services/excelServiceAvisos'

/** Período do aviso para exibição (planilha: Data Início / Data Fim) */
function formatAvisoPeriodo(
  dataInicio: Aviso['dataInicio'],
  dataFim: Aviso['dataFim'],
): string | null {
  if (!dataInicio && !dataFim) return null
  const short = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (dataInicio && dataFim) {
    const same =
      dataInicio.getFullYear() === dataFim.getFullYear() &&
      dataInicio.getMonth() === dataFim.getMonth() &&
      dataInicio.getDate() === dataFim.getDate()
    if (same) return short(dataInicio)
    return `${short(dataInicio)} — ${short(dataFim)}`
  }
  if (dataInicio) return short(dataInicio)
  if (dataFim) return short(dataFim)
  return null
}

const modalities = [
  {
    id: 'tecnico',
    name: 'CAI e Cursos Técnicos',
    description: 'Formação técnica profissional com prática em laboratórios',
    icon: Wrench,
  },
  {
    id: 'superior',
    name: 'Cursos Superiores',
    description: 'Graduação em tecnologia',
    icon: GraduationCap,
  },
  {
    id: 'livre',
    name: 'Cursos Livres/FIC',
    description: 'Capacitação rápida em diversas áreas do conhecimento',
    icon: BookOpen,
  },
  {
    id: 'especializacao',
    name: 'Cursos de Especialização',
    description: 'MBA e Pós-Graduação',
    icon: Award,
  },
]

function Home() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const { avisos, loading: avisosLoading } = useAvisosDataContext()

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
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#ededed] font-montserrat">
      <div className="flex flex-col flex-1 min-w-0">
      {/* ══ TOP BAR VERMELHO — igual site SENAI ══ */}
      <div className="bg-[#e30613] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo SENAI branca sobre fundo vermelho (manual de marca) */}
          <div className="flex items-center gap-4">
            <img src={senaiWhiteLogo} alt="SENAI" className="h-8 lg:h-10" />
            <span className="hidden sm:inline text-white/50 text-sm font-light">|</span>
            <span className="hidden sm:inline text-white/90 text-sm font-medium">
              Grade de Horários
            </span>
          </div>

          {/* Data e hora */}
          <div className="flex items-center gap-2.5 text-white/90 text-sm select-none">
            <Calendar size={14} />
            <span className="capitalize hidden md:inline">{formatDate(currentTime)}</span>
            <span className="w-px h-3.5 bg-white/30" />
            <Clock size={14} />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 text-center">
          {/* Logo SENAI vermelha sobre fundo branco (manual de marca) */}
          <div className="flex justify-center mb-4">
            <img src={senaiRedLogo} alt="SENAI" className="h-14 sm:h-16 lg:h-20" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-gray-800 mb-3">
            Grade de Horários
          </h2>
          <p className="text-base lg:text-lg text-[#878787] max-w-lg mx-auto leading-relaxed">
            Sistema de Grade de Horários e Localização de Cursos
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1 w-20 bg-[#e30613] rounded-full" />
          </div>
        </div>
      </div>

      {/* ══ CONTEÚDO ══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ── Seção de modalidades ── */}
        <section className="mb-10 lg:mb-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-gray-800">
              Cursos
            </h2>
            <div className="mt-2 flex justify-center">
              <ChevronRight size={28} className="text-[#e30613] rotate-90" />
            </div>
          </div>

          {/* Grid 2×2 — cards com borda vermelha lateral (estilo site SENAI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {modalities.map((modality) => {
              const Icon = modality.icon
              return (
                <button
                  key={modality.id}
                  type="button"
                  onClick={() => handleModalityClick(modality.id)}
                  className="
                    group relative bg-white rounded-lg overflow-hidden
                    border border-gray-200 shadow-sm
                    hover:shadow-lg hover:shadow-[#e30613]/10
                    text-left transition-all duration-300 ease-out
                    hover:-translate-y-0.5
                    active:scale-[0.98]
                    touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e30613]
                  "
                >
                  {/* Borda vermelha lateral esquerda — assinatura SENAI */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e30613] group-hover:w-2 transition-all duration-300" />

                  <div className="flex items-center gap-4 p-5 lg:p-6 pl-6 lg:pl-7">
                    {/* Ícone */}
                    <div className="w-14 h-14 rounded-lg bg-[#e30613] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Icon size={26} className="text-white" />
                    </div>

                    {/* Texto */}
                    <div className="flex-1">
                      <h3 className="text-lg lg:text-xl font-bold text-gray-800 group-hover:text-[#e30613] transition-colors">
                        {modality.name}
                      </h3>
                      <p className="text-sm text-[#878787] mt-0.5 leading-relaxed">
                        {modality.description}
                      </p>
                    </div>

                    {/* Seta */}
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[#e30613] transition-colors flex-shrink-0" />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Anúncios ── */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-[#e30613]" />

          <div className="flex items-center gap-3 px-6 lg:px-8 pt-5 pb-3">
            <div className="w-12 h-12 rounded-lg bg-[#e30613] flex items-center justify-center flex-shrink-0">
              <Megaphone size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-800">Anúncios</h3>
              <p className="text-sm text-[#878787]">Comunicados e avisos importantes</p>
            </div>
          </div>

          <div className="px-6 lg:px-8 pb-6 space-y-3">
            {avisosLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-[#878787]">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-base">Carregando avisos...</span>
              </div>
            ) : avisos.length === 0 ? (
              <div className="text-center py-6 text-[#878787] text-base">
                Nenhum aviso no momento.
              </div>
            ) : (
              avisos.map((aviso, index) => {
                const Icon = aviso.tipo === 'evento' ? CalendarDays : Bell
                const periodo = formatAvisoPeriodo(aviso.dataInicio, aviso.dataFim)
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-[#ededed] hover:bg-gray-200/70 transition-colors"
                  >
                    <Icon size={22} className="text-[#e30613] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-base lg:text-lg font-medium text-gray-900 leading-snug">
                        {aviso.texto}
                      </p>
                      {periodo && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} className="flex-shrink-0 text-[#e30613]/80" />
                          <span>{periodo}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
      </div>

      {/* ══ FOOTER VERMELHO — igual site SENAI ══ */}
      <footer className="shrink-0 bg-[#e30613] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-3">
          {/* Logo SENAI branca no footer vermelho */}
          <img src={senaiWhiteLogo} alt="SENAI" className="h-7" />
          <p className="text-white/80 text-xs">
            Grade de Horários | Sistema de Grade de Horários e Localização de Cursos
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Home
