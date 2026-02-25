import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import CoursesByModality from './pages/CoursesByModality'
import { ExcelDataProvider } from './contexts/ExcelDataContext'

function App() {
  return (
    <ExcelDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/cursos/:modality" element={<CoursesByModality />} />
        </Routes>
      </BrowserRouter>
    </ExcelDataProvider>
  )
}

export default App
