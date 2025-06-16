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
import Sidebar from "./components/SideBar/Sidebar.jsx";
import InventoryAssignmentPanel from "./pages/InventoryAssignmentPanel/InventoryAssignmentPanel.jsx";
import TermsEditor from "./pages/TermsEditor/TermsEditor.jsx";
import SignatureCapturePad from "./pages/SignatureCapturePad/SignatureCapturePad.jsx";
import RepairQueue from "./pages/RepairQueue/RepairQueue.jsx";
import Inventory from "./pages/Inventory/Inventory.jsx";
import Feedbackform from "./pages/FeedbackForm/FeedbackForm.jsx";
import RealTimeStatus from "./pages/RealTimeStatus/RealTimeStatus.jsx"
import NewRepair from "./pages/NewRepair/NewRepair.jsx";
import AdminDashboard from "./pages/DashboardPage/AdminDashboard.jsx";
import CustomerDashboard from "./pages/DashboardPage/CustomerDashboard.jsx";
import Techniciandashboard from "./pages/DashboardPage/techniciandashboard.jsx";
import MockUpUpdateStatusAndPushNotifications from "./pages/MockUpUpdateStatusAndPushNotifications/MockUpUpdateStatusAndPushNotifications";
import { useEffect, useState } from "react";
import HistoryPage from "./pages/History/HistoryPage.jsx";
import FAQ from "./pages/FAQ/FAQ.jsx";

function App() {
  // Function to parse JWT token
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  // Role-based route renderer
  const ProtectedRoute = ({ element, allowedRoles }) => {
    // Check if logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      return <Navigate to="/login" />;
    }

    // Check if role matches
    const decodedToken = parseJwt(token);
    if (!decodedToken || !allowedRoles.includes(decodedToken.role?.toLowerCase())) {
      return <Navigate to="/login" />;
    }

    return element;
  };

  // Dashboard component based on role
  const Dashboard = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return <Navigate to="/login" />;
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.role) {
      return <Navigate to="/login" />;
    }

    switch (decodedToken.role.toLowerCase()) {
      case 'admin':
        return <AdminDashboard />;
      case 'technician':
        return <Techniciandashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <Navigate to="/login" />;
    }
  };

  return (
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Protected History route */}
          <Route path="/history" element={
            <ProtectedRoute element={<HistoryPage />} allowedRoles={['admin', 'technician', 'customer']} />
          } />

          {/* Single dashboard route that renders different components based on role */}
          <Route path="/dashboard" element={
            <ProtectedRoute element={<Dashboard />} allowedRoles={['admin', 'technician', 'customer']} />
          } />

          {/* Protected routes */}

          <Route path="/faq" element={
            <ProtectedRoute element={<FAQ />} allowedRoles={['customer']} />
          } />

          <Route path="/accountinformation" element={
            <ProtectedRoute element={<AccountInformation />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/passwordmanagement" element={
            <ProtectedRoute element={<PasswordManagement />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/automatedclaimformgeneration" element={
            <ProtectedRoute element={<AutomatedClaimFormGenerationPage />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/backup" element={
            <ProtectedRoute element={<BackUpPage />} allowedRoles={['admin']} />
          } />
          <Route path="/warranty" element={
            <ProtectedRoute element={<WarrantyRequestPage />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/devicecard" element={
            <ProtectedRoute element={<DeviceCard />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/sidebar" element={
            <ProtectedRoute element={<Sidebar />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/inventoryassignment" element={
            <ProtectedRoute element={<InventoryAssignmentPanel />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/inventory" element={
            <ProtectedRoute element={<Inventory />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/termseditor" element={
            <ProtectedRoute element={<TermsEditor />} allowedRoles={['admin']} />
          } />
          <Route path="/signature" element={
            <ProtectedRoute element={<SignatureCapturePad />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/repairqueue" element={
            <ProtectedRoute element={<RepairQueue />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/profilemanage" element={
            <ProtectedRoute element={<UserManagement />} allowedRoles={['admin']} />
          } />
          <Route path="/feedbackform" element={
            <ProtectedRoute element={<Feedbackform />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/realtimestatus" element={
            <ProtectedRoute element={<RealTimeStatus />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/newrepair" element={
            <ProtectedRoute element={<NewRepair />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/mockupstatus" element={<MockUpUpdateStatusAndPushNotifications />} />
        </Routes>
      </Router>
  )
}

export default App
