import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

interface DashboardProps {
  user: { id: number; username: string } | null;
  sessionId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, sessionId }) => {
  const [protectedData, setProtectedData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const response = await axios.get('/api/protected');
        setProtectedData(response.data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch protected data');
        setProtectedData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProtectedData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-panel">
        <h2>Welcome, {user?.username}!</h2>
        
        <div className="session-info-panel">
          <h3>Session Information</h3>
          <p>User ID: <strong>{user?.id}</strong></p>
          <p>Session ID: <code>{sessionId}</code></p>
        </div>
        
        <div className="protected-data-panel">
          <h3>Protected Data</h3>
          {loading ? (
            <p>Loading protected data...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div>
              <p>{protectedData?.message}</p>
              <div className="secret-box">
                <h4>Secret Information</h4>
                <p>{protectedData?.data?.secretInfo}</p>
              </div>
            </div>
          )}
        </div>

        <div className="vulnerability-explanation">
          <h3>Security Demonstration</h3>
          <p>
            This dashboard displays sensitive information that should only be accessible to 
            authenticated users. Depending on the active vulnerability mode, this data could 
            potentially be exposed in the following ways:
          </p>
          <ul>
            <li>
              <strong>Session Fixation:</strong> An attacker who pre-sets your session ID can 
              access this dashboard after you authenticate.
            </li>
            <li>
              <strong>Session Hijacking:</strong> If you log out, your session may still be 
              active and usable by someone who knows your session ID.
            </li>
            <li>
              <strong>Session Timeout:</strong> Your session remains active for 30 days, 
              allowing potential access to this page long after you've left.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;