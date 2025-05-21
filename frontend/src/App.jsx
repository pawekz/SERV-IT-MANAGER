import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import SignUpPage from './pages/SignUpPage/SignUpPage';
import LoginPage from "./pages/LoginPage/LoginPage";
import ContactPage from "./pages/ContactPage/ContactPage";
import AboutPage from "./pages/AboutPage/AboutPage";
import AccountInformation from "./pages/AccountInformationPage/AccountInformation";
import PasswordManagement from "./pages/PasswordManagementPage/PasswordManagement";
import UserManagement from "./pages/UserManagementPage/UserManagement";
import AutomatedClaimFormGenerationPage from "./pages/AutomatedClaimFormGenerationPage/AutomatedClaimFormGenerationPage";
import BackUpPage from "./pages/BackUpPage/BackUpPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/accountinformation" element={<AccountInformation />} />
        <Route path="/passwordmanagement" element={<PasswordManagement />} />
        <Route path="/usermanagement" element={<UserManagement />} />
        <Route path="/automatedclaimformgeneration" element={<AutomatedClaimFormGenerationPage />} />
        <Route path="/backup" element={<BackUpPage />} />
        {/* <Route path="*" element={<LandingPage />} /> */}
      </Routes>
    </Router>
  )
}

export default App
