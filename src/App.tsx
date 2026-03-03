import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CoursesByModality from './pages/CoursesByModality'
import { ExcelDataProvider } from './contexts/ExcelDataContext'
import { LivresDataProvider } from './contexts/LivresDataContext'

function App() {
  return (
    <ExcelDataProvider>
      <LivresDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cursos/:modality" element={<CoursesByModality />} />
          </Routes>
        </BrowserRouter>
      </LivresDataProvider>
    </ExcelDataProvider>
  )
}

export default App
