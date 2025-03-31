const express = require('express');
const session = require('express-session');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dataDir, 'sessions.db'));

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
  
  // Insert test users if they don't exist
  const checkUsers = db.prepare("SELECT COUNT(*) as count FROM users");
  checkUsers.get((err, result) => {
    if (err) {
      console.error("Error checking users:", err);
      return;
    }
    if (result.count === 0) {
      console.log("Inserting test users");
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      stmt.run("admin", "admin123");
      stmt.run("user1", "password123");
      stmt.run("victim", "victim123");
      stmt.finalize();
    }
  });
  checkUsers.finalize();
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Default session configuration
const defaultSessionConfig = {
  secret: 'vulnerable-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Should be true in production with HTTPS
    httpOnly: true
  }
};

// This variable will store the current vulnerability mode
let currentVulnerability = 'none';

// Middleware to configure session based on vulnerability type
app.use((req, res, next) => {
  const vulnerability = req.query.vulnerability || currentVulnerability;
  
  // Remove any existing session middleware
  app.middleware = app.middleware || [];
  app.middleware = app.middleware.filter(m => m !== session);
  
  let sessionConfig = { ...defaultSessionConfig };
  
  switch (vulnerability) {
    case 'fixation':
      // For session fixation, we allow the session ID to be set via query parameter
      if (req.query.sessionId) {
        req.cookies['connect.sid'] = req.query.sessionId;
      }
      break;
      
    case 'hijacking':
      // For session hijacking, we don't invalidate the session after logout
      // Implementation happens in the logout route
      break;
      
    case 'timeout':
      // For session timeout, we set a very long session timeout
      sessionConfig.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      break;
      
    default:
      // Default secure configuration
      sessionConfig = {
        ...defaultSessionConfig,
        cookie: {
          ...defaultSessionConfig.cookie,
          maxAge: 15 * 60 * 1000, // 15 minutes
        }
      };
  }
  
  // Apply the session middleware with the configured settings
  app.use(session(sessionConfig));
  next();
});

// Set current vulnerability mode
app.post('/api/set-vulnerability', (req, res) => {
  const { vulnerability } = req.body;
  if (['none', 'fixation', 'hijacking', 'timeout'].includes(vulnerability)) {
    currentVulnerability = vulnerability;
    res.json({ success: true, mode: currentVulnerability });
  } else {
    res.status(400).json({ success: false, message: 'Invalid vulnerability mode' });
  }
});

// Get current vulnerability mode
app.get('/api/vulnerability', (req, res) => {
  res.json({ mode: currentVulnerability });
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Query the database for the user
  db.get('SELECT id, username FROM users WHERE username = ? AND password = ?', 
    [username, password], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (user) {
        // For session fixation vulnerability, we don't regenerate the session ID on login
        if (currentVulnerability !== 'fixation' && req.session.regenerate) {
          req.session.regenerate((err) => {
            if (err) {
              return res.status(500).json({ success: false, message: 'Session regeneration failed' });
            }
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.authenticated = true;
            
            return res.json({ 
              success: true, 
              user: { id: user.id, username: user.username },
              sessionId: req.sessionID
            });
          });
        } else {
          // Without session regeneration (vulnerable to session fixation)
          req.session.userId = user.id;
          req.session.username = user.username;
          req.session.authenticated = true;
          
          res.json({ 
            success: true, 
            user: { id: user.id, username: user.username },
            sessionId: req.sessionID
          });
        }
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    });
});

// Check authentication status
app.get('/api/check-auth', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username
      },
      sessionId: req.sessionID
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  if (currentVulnerability === 'hijacking') {
    // For session hijacking vulnerability, we don't destroy the session
    req.session.authenticated = false; // Just set authenticated to false but keep the session
    res.json({ success: true, message: 'Logged out but session not destroyed' });
  } else {
    // Normal secure logout
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }
});

// Get session ID for demonstration purposes
app.get('/api/session-id', (req, res) => {
  res.json({ sessionId: req.sessionID });
});

// Protected resource example
app.get('/api/protected', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({
      success: true,
      message: `Welcome to the protected area, ${req.session.username}!`,
      data: {
        secretInfo: 'This is sensitive information that only authenticated users should see.'
      }
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});