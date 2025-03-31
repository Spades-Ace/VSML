import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (user: any, sessionId: string) => void;
  currentVulnerability: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, currentVulnerability }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualSessionId, setManualSessionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For session fixation, allow using a predefined session ID
      let url = '/api/login';
      if (currentVulnerability === 'fixation' && manualSessionId) {
        url += `?sessionId=${manualSessionId}`;
      }

      const response = await axios.post(url, { username, password });
      
      if (response.data.success) {
        onLogin(response.data.user, response.data.sessionId);
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {currentVulnerability === 'fixation' && (
            <div className="form-group">
              <label htmlFor="sessionId">
                Session ID (for session fixation attack):
              </label>
              <input
                type="text"
                id="sessionId"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                placeholder="Enter a session ID to use"
              />
              <small className="help-text">
                This allows an attacker to set the session ID that the victim will use
              </small>
            </div>
          )}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="test-credentials">
          <h3>Test Credentials</h3>
          <ul>
            <li>Username: admin, Password: admin123</li>
            <li>Username: user1, Password: password123</li>
            <li>Username: victim, Password: victim123</li>
          </ul>
        </div>

        <div className="vulnerability-info">
          <h3>Current Vulnerability Mode: {currentVulnerability}</h3>
          {currentVulnerability === 'fixation' && (
            <div className="vulnerability-description">
              <p>
                <strong>Session Fixation:</strong> The attacker sets a session ID before the
                victim logs in. When the victim logs in, they inherit the attacker-controlled
                session ID, which the attacker can then use to hijack the session.
              </p>
              <p>
                To test: Enter a custom session ID above, log in, then use that same ID on another browser.
              </p>
            </div>
          )}
          {currentVulnerability === 'hijacking' && (
            <div className="vulnerability-description">
              <p>
                <strong>Session Hijacking:</strong> Even after a user logs out, their session
                remains active and can be reused by an attacker who has captured the session ID.
              </p>
              <p>
                To test: Log in, note your session ID, then log out. The session ID can still be
                used to access protected resources.
              </p>
            </div>
          )}
          {currentVulnerability === 'timeout' && (
            <div className="vulnerability-description">
              <p>
                <strong>Session Timeout:</strong> The session timeout is set to 30 days, which is
                excessively long. This allows an attacker to reuse a captured session long after
                the user has stopped using the application.
              </p>
              <p>
                To test: Log in and note that your session will remain active for a very long time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;