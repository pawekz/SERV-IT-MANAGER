import {BrowserRouter as Router, Routes, Route, Navigate, useLocation} from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import SignUpPage from './pages/SignUpPage/SignUpPage';
import LoginPage from "./pages/LoginPage/LoginPage";
import LoginStaffPage from "./pages/LoginPage/LoginStaffPage.jsx";
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
import InventoryAssignmentPanel from "./pages/QuotationBuilderPanel/InventoryAssignmentPanel.jsx";
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
import EmployeeSignUpPage from './pages/SignUpPage/EmployeeSignUpPage';
import Quotation from './pages/QuotationBuilderPanel/InventoryAssignmentPanel.jsx'
import InitialSetupPage from "./pages/InitialSetupPage/InitialSetupPage.jsx";
import api from "./config/ApiConfig.jsx";
import Spinner from "./components/Spinner/Spinner.jsx";
import CreateEmployeePage from './pages/SignUpPage/CreateEmployeePage';
import QuotationApproval from './pages/QuotationApproval/QuotationApproval.jsx'
import QuotationViewer from "./pages/QuotationViewer/QuotationViewer.jsx";
import Error401 from "./pages/StatusCodeErrorPages/Error401.jsx";
import Error404 from "./pages/StatusCodeErrorPages/Error404.jsx";
import Error403 from "./pages/StatusCodeErrorPages/Error403.jsx";
import Error500 from "./pages/StatusCodeErrorPages/Error500.jsx";



function AppContent() {
  const location = useLocation();
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

  // Initial admin setup detection
  const [needsSetup, setNeedsSetup] = useState(null); // null while loading
  useEffect(() => {
    const checkUserCount = async () => {
      try {
        const res = await api.get("/user/getUserCountInit");
        if (res.status === 200) {
          const count = res.data;
          setNeedsSetup(count === 0);
        } else {
          setNeedsSetup(false); // fallback to normal mode on error
        }
      } catch (e) {
        setNeedsSetup(false);
      }
    };
    if (location.pathname === "/") {
      checkUserCount();
    } else {
      setNeedsSetup(false);
    }
  }, [location.pathname]);

  if (needsSetup === null && location.pathname === "/") {
    // Still checking the server – show spinner
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Spinner size="large" />
        <span className="text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      {needsSetup ? (
        <Route path="/*" element={<InitialSetupPage />} />
      ) : (
        <>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/employee-onboarding" element={<EmployeeSignUpPage />} />
          <Route path="/employee-signup" element={
            <ProtectedRoute element={<CreateEmployeePage />} allowedRoles={['admin']} />
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/staff" element={<LoginStaffPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/401" element={<Error401 />} />
          <Route path="/404" element={<Error404 />} />
          <Route path="/500" element={<Error500 />} />
          <Route path="/403" element={<Error403 />} />
          <Route path="/quotationapproval/:ticketNumber" element={
            <ProtectedRoute element={<QuotationApproval />} allowedRoles={['customer']} />
          } />

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
            <ProtectedRoute element={<FAQ />} allowedRoles={['customer', 'technician', 'admin']} />
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
          <Route path="/warrantyrequest" element={
            <ProtectedRoute element={<WarrantyRequestPage />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/devicecard" element={
            <ProtectedRoute element={<DeviceCard />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/sidebar" element={
            <ProtectedRoute element={<Sidebar />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/quotationeditor" element={
            <ProtectedRoute element={<InventoryAssignmentPanel />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/quotation-builder/:ticketNumber" element={
            <ProtectedRoute element={<InventoryAssignmentPanel />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/quotationviewer/:ticketNumber" element={
            <ProtectedRoute element={<QuotationViewer />} allowedRoles={['admin', 'technician']} />
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
          <Route path="/feedbackform/:ticketId" element={
            <ProtectedRoute element={<Feedbackform />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/realtimestatus" element={
            <ProtectedRoute element={<RealTimeStatus />} allowedRoles={['admin', 'technician', 'customer']} />
          } />
          <Route path="/newrepair" element={
            <ProtectedRoute element={<NewRepair />} allowedRoles={['admin', 'technician']} />
          } />
          <Route path="/mockupstatus" element={<MockUpUpdateStatusAndPushNotifications />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App
