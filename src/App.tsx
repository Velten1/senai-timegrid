import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CoursesByModality from './pages/CoursesByModality'
import { ExcelDataProvider } from './contexts/ExcelDataContext'

function App() {
  return (
    <ExcelDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cursos/:modality" element={<CoursesByModality />} />
        </Routes>
      </BrowserRouter>
    </ExcelDataProvider>
  )
}

export default App
