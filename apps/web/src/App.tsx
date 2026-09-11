import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import CreateSession from './pages/CreateSession';
import SessionDetail from './pages/SessionDetail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
    <ToastProvider>
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
        <Navbar></Navbar>

        <main className="mx-auto w-full flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
                path="/grupo/:slug" 
                element={
                  <ProtectedRoute>
                    <GroupDetail />
                  </ProtectedRoute>
                } 
              />
            <Route
                path="/grupo/:slug/nueva-cuenta"
                element={
                  <ProtectedRoute>
                    <CreateSession />
                  </ProtectedRoute>
                }
              />
            <Route
                path="/cuenta/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionDetail />
                  </ProtectedRoute>
                }
              />
            <Route path="*" element={<NotFound />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
    </ToastProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}

export default App;