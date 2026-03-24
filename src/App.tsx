import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CoursesByModality from './pages/CoursesByModality'
import { TotemIdleReturn } from './components/TotemIdleReturn'
import { ExcelDataProvider } from './contexts/ExcelDataContext'
import { LivresDataProvider } from './contexts/LivresDataContext'
import { SuperiorPosGradDataProvider } from './contexts/SuperiorPosGradDataContext'
import { AvisosDataProvider } from './contexts/AvisosDataContext'

function App() {
  return (
    <ExcelDataProvider>
      <LivresDataProvider>
        <SuperiorPosGradDataProvider>
          <AvisosDataProvider>
            <BrowserRouter>
              <TotemIdleReturn idleMs={20_000} />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cursos/:modality" element={<CoursesByModality />} />
              </Routes>
            </BrowserRouter>
          </AvisosDataProvider>
        </SuperiorPosGradDataProvider>
      </LivresDataProvider>
    </ExcelDataProvider>
  )
}

export default App
