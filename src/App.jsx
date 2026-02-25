import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CriteriaPage from './pages/CriteriaPage';
import MatchesPage from './pages/MatchesPage';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import UserContext from './context/UserContext';
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    return user ? children : <Navigate to="/login" replace />;
  };

  // Show navbar only when user is logged in
  const showNavbar = user && !loading;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>;
  }

  return (
    <UserContext.Provider value={{ user, setUser, supabase }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {showNavbar && <Navbar />}
          <main className={showNavbar ? 'container mx-auto px-4 py-8' : ''}>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/criteria" element={
                <ProtectedRoute>
                  <CriteriaPage />
                </ProtectedRoute>
              } />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <MatchesPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
