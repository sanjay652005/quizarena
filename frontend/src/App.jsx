import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }      from './context/AuthContext';
import { SocketProvider }    from './context/SocketContext';
import { ProtectedRoute }    from './components/layout/ProtectedRoute';
import { Navbar }            from './components/layout/Navbar';

import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import CreateRoomPage  from './pages/CreateRoomPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import QuizRoomPage    from './pages/QuizRoomPage';
import ResultsPage     from './pages/ResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen flex flex-col bg-brand-dark text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/"         element={<HomePage />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/create-room" element={
                  <ProtectedRoute role="host"><CreateRoomPage /></ProtectedRoute>
                }/>
                <Route path="/waiting/:code" element={
                  <ProtectedRoute><WaitingRoomPage /></ProtectedRoute>
                }/>
                <Route path="/quiz/:code" element={
                  <ProtectedRoute><QuizRoomPage /></ProtectedRoute>
                }/>
                <Route path="/results/:id" element={
                  <ProtectedRoute><ResultsPage /></ProtectedRoute>
                }/>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
