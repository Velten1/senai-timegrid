import type { Course } from '../../types'

interface CourseModalProps {
  course: Course
  isOpen: boolean
  onClose: () => void
}

// modal component that displays course information
// shows course details, schedules, teachers, etc
// modern design optimized for totem display
export function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* overlay with blur effect for depth */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity"
        onClick={onClose}
      />

      {/* modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: `0 30px 100px ${course.color}40`,
          }}
        >
          {/* header with course color accent */}
          <div
            className="relative p-10 border-b border-slate-700/50"
            style={{
              background: `linear-gradient(135deg, ${course.color}20 0%, transparent 100%)`,
            }}
          >
            {/* top accent bar - elegant gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl"
              style={{
                background: `linear-gradient(90deg, ${course.color} 0%, ${course.color}80 50%, transparent 100%)`,
              }}
            />

            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6 flex-1">
                {/* large icon with glow */}
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}dd 100%)`,
                    boxShadow: `0 15px 50px ${course.color}50`,
                  }}
                >
                  {course.icon}
                </div>
                <div className="flex-1 pt-2">
                  {/* course name - very prominent */}
                  <h2 className="text-4xl font-bold text-white mb-3">
                    {course.name}
                  </h2>
                  {/* course description - better readability */}
                  {course.description && (
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>
              {/* close button */}
              <button
                onClick={onClose}
                className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-slate-700/50 transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* content with tab-like sections */}
          <div className="p-10 space-y-8">
            {/* schedules section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                {/* accent bar */}
                <div
                  className="w-2 h-10 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <h3 className="text-2xl font-bold text-white">Horários</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* placeholder for schedule items */}
                {/* will be populated with actual data later */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <p className="text-gray-400">Horários serão exibidos aqui</p>
                </div>
              </div>
            </section>

            {/* teachers section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                {/* accent bar */}
                <div
                  className="w-2 h-10 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <h3 className="text-2xl font-bold text-white">Professores</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* placeholder for teacher items */}
                {/* will be populated with actual data later */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <p className="text-gray-400">Professores serão exibidos aqui</p>
                </div>
              </div>
            </section>

            {/* additional info section */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                {/* accent bar */}
                <div
                  className="w-2 h-10 rounded-full"
                  style={{ backgroundColor: course.color }}
                />
                <h3 className="text-2xl font-bold text-white">Informações</h3>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <p className="text-gray-400">
                  Informações adicionais serão exibidas aqui
                </p>
              </div>
            </section>
          </div>

          {/* footer with elegant button */}
          <div className="p-6 border-t border-slate-700/50 flex justify-end bg-slate-900/30">
            <button
              onClick={onClose}
              className="px-10 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${course.color} 0%, ${course.color}dd 100%)`,
                boxShadow: `0 8px 30px ${course.color}60`,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
