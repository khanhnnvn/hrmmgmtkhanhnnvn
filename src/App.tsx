import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';

// Auth Components
import { LoginForm } from './components/Auth/LoginForm';

// Public Components
import { CandidateApplicationForm } from './components/Forms/CandidateApplicationForm';

// Pages
import { Dashboard } from './pages/Dashboard';
import { CandidateList } from './pages/Candidates/CandidateList';
import { CandidateDetail } from './pages/Candidates/CandidateDetail';
import { InterviewList } from './pages/Interviews/InterviewList';
import { UserList } from './pages/Users/UserList';
import { EmployeeProfile } from './pages/Employee/EmployeeProfile';
import { InterviewAssignments } from './pages/Employee/InterviewAssignments';
import { Unauthorized } from './pages/Unauthorized';

function AppRoutes() {
  const { user, role } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={user ? (
          <Navigate to={
            role === 'ADMIN' ? '/dashboard' : 
            role === 'HR' ? '/candidates' : 
            '/employee'
          } replace />
        ) : <LoginForm />} 
      />
      <Route path="/apply" element={<CandidateApplicationForm />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidates"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Layout>
              <CandidateList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/candidates/:id"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Layout>
              <CandidateDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interviews"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Layout>
              <InterviewList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Layout>
              <UserList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <Layout>
              <EmployeeProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/profile"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <Layout>
              <EmployeeProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/interviews"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <Layout>
              <InterviewAssignments />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={
              role === 'ADMIN' ? '/dashboard' : 
              role === 'HR' ? '/candidates' : 
              role === 'EMPLOYEE' ? '/employee' : 
              '/login'
            } replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <div style={{ display: 'none' }}>
            {/* Debug info for development */}
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</div>
            <div>Environment: {import.meta.env.MODE}</div>
          </div>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;