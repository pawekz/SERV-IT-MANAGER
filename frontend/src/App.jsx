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
import WarrantyRequestPage from "./pages/WarrantyRequestPage/WarrantyRequestPage.jsx";
import DeviceCard from "./components/DeviceCard/DeviceCard.jsx";
import RepairCheckInForm from "./pages/RepairCheckInForm/RepairCheckInForm.jsx";
import Sidebar from "./components/SideBar/Sidebar.jsx";
import InventoryAssignmentPanel from "./pages/InventoryAssignmentPanel/InventoryAssignmentPanel.jsx";
import TermsEditor from "./pages/TermsEditor/TermsEditor.jsx";
import SignatureCapturePad from "./pages/SignatureCapturePad/SignatureCapturePad.jsx";
import RepairQueue from "./pages/RepairQueue/RepairQueue.jsx";
import DashboardPage from "./pages/DashboardPage/DashboardPage.jsx";
import Inventory from "./pages/Inventory/Inventory.jsx";
import RealTimeStatus from "./pages/RealTimeStatus/RealTimeStatus.jsx"


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
        <Route path="/automatedclaimformgeneration" element={<AutomatedClaimFormGenerationPage />} />
        <Route path="/backup" element={<BackUpPage />} />
        <Route path="/warranty" element={<WarrantyRequestPage />} />
        <Route path="/devicecard" element={<DeviceCard />} />
        <Route path="/repaircheckin" element={<RepairCheckInForm />} />
        <Route path="sidebar" element={<Sidebar />} />
        <Route path="/inventoryassignment" element={<InventoryAssignmentPanel />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/termseditor" element={<TermsEditor />} />
        <Route path="/signature" element={<SignatureCapturePad />} />
        <Route path="/repairqueue" element={<RepairQueue />} />
        <Route path="/profilemanage" element={<UserManagement />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/realtimestatus" element={<RealTimeStatus />} />
      </Routes>
    </Router>
  )
}

export default App
