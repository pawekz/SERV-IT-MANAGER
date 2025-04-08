import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage/LandingPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App
