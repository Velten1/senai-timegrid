import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import CoursesByModality from './pages/CoursesByModality'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/cursos/:modality" element={<CoursesByModality />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
