import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Rooms from './pages/Rooms';
import Notifications from './pages/Notifications';
import ActivityLogs from './pages/ActivityLogs';
import AutomationRules from './pages/AutomationRules';
import AISuggestions from './pages/AISuggestions';
import AIChat from './pages/AIChat';
import Profile from './pages/Profile';
import SmartInsights from './pages/SmartInsights';
import VacationMode from './pages/VacationMode';
import AIReport from './pages/AIReport';
import AIAssistantPanel from './components/AIAssistantPanel';
import AdminPanel from './pages/AdminPanel';
import Weather from './pages/Weather';
import SecurityDashboard from './pages/SecurityDashboard';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminDevices from './pages/admin/AdminDevices';
import AdminEnergy from './pages/admin/AdminEnergy';
import AdminAI from './pages/admin/AdminAI';
import AdminWeather from './pages/admin/AdminWeather';
import AdminActivity from './pages/admin/AdminActivity';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SignalRProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="devices" element={<AdminDevices />} />
                    <Route path="energy" element={<AdminEnergy />} />
                    <Route path="ai" element={<AdminAI />} />
                    <Route path="weather" element={<AdminWeather />} />
                    <Route path="activity" element={<AdminActivity />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<AdminDashboard />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Protected Routes wrapped in Sidebar Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/vacation-mode" element={<VacationMode />} />
                    <Route path="/ai-report" element={<AIReport />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/activity-logs" element={<ActivityLogs />} />
                    <Route path="/automation-rules" element={<AutomationRules />} />
                    <Route path="/ai-suggestions" element={<AISuggestions />} />
                    <Route path="/smart-insights" element={<SmartInsights />} />
                    <Route path="/ai-chat" element={<AIChat />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/weather" element={<Weather />} />
                    <Route path="/security" element={<SecurityDashboard />} />
                    <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
                    
                    {/* Fallback routing */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
                <AIAssistantPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SignalRProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;