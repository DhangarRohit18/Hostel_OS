import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { WardenDashboard } from './pages/WardenDashboard';
import { SecurityDashboard } from './pages/SecurityDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Navbar } from './components/Navbar';
import { AiAssistant } from './components/AiAssistant';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar onOpenAiAssistant={() => setIsAiOpen(prev => !prev)} />
      <main className="flex-1 pb-16">{children}</main>
      <AiAssistant role={user?.role} isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};

const RoleBasedRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    case 'WARDEN':
      return <WardenDashboard />;
    case 'GUARD':
      return <SecurityDashboard />;
    case 'STAFF':
      return <StaffDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <div className="p-8 text-center text-red-400">Unauthorized role configuration.</div>;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <RoleBasedRouter />
              </ProtectedLayout>
            }
          />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
export default App;
