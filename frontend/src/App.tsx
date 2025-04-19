import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './components/LoginPage.tsx';
import Dashboard from './components/Dashboard.tsx';
import VulnerabilitySelector from './components/VulnerabilitySelector.tsx';
import './App.css';

// Configure axios to include credentials with all requests
axios.defaults.withCredentials = true;
// Update the baseURL to use the relative path for API which will be proxied through Nginx
axios.defaults.baseURL = '';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [currentVulnerability, setCurrentVulnerability] = useState<string>('none');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/check-auth');
        setIsAuthenticated(response.data.authenticated);
        if (response.data.authenticated) {
          setUser(response.data.user);
          setSessionId(response.data.sessionId);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get current vulnerability mode
    const getVulnerabilityMode = async () => {
      try {
        const response = await axios.get('/api/vulnerability');
        setCurrentVulnerability(response.data.mode);
      } catch (error) {
        console.error('Failed to get vulnerability mode:', error);
      }
    };

    checkAuth();
    getVulnerabilityMode();
  }, []);

  const handleLogin = (userData: any, sessionId: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    setSessionId(sessionId);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      setIsAuthenticated(false);
      setSessionId('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleVulnerabilityChange = async (vulnerability: string) => {
    try {
      const response = await axios.post('/api/set-vulnerability', { vulnerability });
      if (response.data.success) {
        setCurrentVulnerability(vulnerability);
      }
    } catch (error) {
      console.error('Failed to set vulnerability mode:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>Vulnerable Session Management Lab</h1>
          {isAuthenticated && (
            <div className="user-info">
              Logged in as <strong>{user?.username}</strong>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </header>
        
        <VulnerabilitySelector
          currentVulnerability={currentVulnerability}
          onVulnerabilityChange={handleVulnerabilityChange}
        />
        
        {sessionId && (
          <div className="session-info">
            <p>Current Session ID: <code>{sessionId}</code></p>
          </div>
        )}

        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <LoginPage onLogin={handleLogin} currentVulnerability={currentVulnerability} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <Dashboard user={user} sessionId={sessionId} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;