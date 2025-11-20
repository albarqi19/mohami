import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetailPage from './pages/CaseDetailPage';
import ClientCases from './pages/ClientCases';
import ClientCaseDetail from './pages/ClientCaseDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Documents from './pages/Documents';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import WhatsappSettings from './pages/WhatsappSettings';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Routes for all users except clients */}
            <Route path="cases" element={
              <ProtectedRoute allowedRoles={['admin', 'lawyer', 'legal_assistant']}>
                <Cases />
              </ProtectedRoute>
            } />
            <Route path="cases/:caseId" element={
              <ProtectedRoute allowedRoles={['admin', 'lawyer', 'legal_assistant']}>
                <CaseDetailPage />
              </ProtectedRoute>
            } />
            
            {/* Client-specific routes */}
            <Route path="my-cases" element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientCases />
              </ProtectedRoute>
            } />
            <Route path="my-cases/:caseId" element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientCaseDetail />
              </ProtectedRoute>
            } />
            
            <Route path="tasks" element={
              <ProtectedRoute allowedRoles={['admin', 'lawyer', 'legal_assistant']}>
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="tasks/:taskId" element={
              <ProtectedRoute allowedRoles={['admin', 'lawyer', 'legal_assistant']}>
                <TaskDetail />
              </ProtectedRoute>
            } />
            <Route path="documents" element={<Documents />} />
            <Route path="activities" element={<Activities />} />
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['admin', 'lawyer']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="admin/statistics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Statistics />
              </ProtectedRoute>
            } />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="whatsapp-settings" element={<WhatsappSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
