const express = require('express');
const session = require('express-session');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Logger function for better debugging
const logger = (message, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
  
  // Also log to a file for persistence
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  fs.appendFileSync(
    path.join(logDir, 'session-debug.log'), 
    `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`
  );
};

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

// SIMPLE SESSION IMPLEMENTATION
// Store sessions in memory (for demonstration purposes)
const sessions = {};

// Generate a random session ID
const generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Custom session middleware
const customSessionMiddleware = (req, res, next) => {
  // Get the session ID from the cookie
  let sessionId = req.cookies.sessionId;
  
  logger('Request received', { 
    url: req.url, 
    method: req.method, 
    sessionId,
    cookies: req.headers.cookie
  });
  
  // For session fixation vulnerability
  if (currentVulnerability === 'fixation' && req.query.sessionId) {
    sessionId = req.query.sessionId;
    logger('Using session ID from query parameter (fixation)', { sessionId });
    
    // Set the custom sessionId as a cookie for session fixation vulnerability
    res.cookie('sessionId', sessionId, { 
      httpOnly: true,
      path: '/'
    });
  }
  
  // If no session ID, create a new one
  if (!sessionId) {
    sessionId = generateSessionId();
    logger('Generated new session ID', { sessionId });
    
    // Set the cookie
    res.cookie('sessionId', sessionId, { 
      httpOnly: true,
      path: '/'
    });
  }
  
  // Look up the session
  let session = sessions[sessionId];
  
  // If no session exists for this ID, create one
  if (!session) {
    session = {
      cookie: {} // Add cookie property to the session object
    };
    sessions[sessionId] = session;
    logger('Created new session', { sessionId });
  } else if (!session.cookie) {
    // Add cookie property if it doesn't exist
    session.cookie = {};
  }
  
  // Add the session to the request
  req.sessionId = sessionId;
  req.session = session;
  
  // Session regeneration method
  req.session.regenerate = (callback) => {
    // Only regenerate if not in fixation mode
    if (currentVulnerability !== 'fixation') {
      const oldSessionId = req.sessionId;
      const oldSession = {...req.session};
      
      // Generate a new session ID
      const newSessionId = generateSessionId();
      logger('Regenerating session', { oldSessionId, newSessionId });
      
      // Create a new session with the same data
      sessions[newSessionId] = {...oldSession};
      req.sessionId = newSessionId;
      req.session = sessions[newSessionId];
      
      // Set the new cookie
      res.cookie('sessionId', newSessionId, { 
        httpOnly: true,
        path: '/'
      });
      
      // Clean up the old session
      delete sessions[oldSessionId];
    }
    
    if (callback) callback(null);
  };
  
  // Session destroy method
  req.session.destroy = (callback) => {
    logger('Destroying session', { sessionId: req.sessionId });
    delete sessions[req.sessionId];
    
    // Clear the cookie
    res.clearCookie('sessionId');
    
    req.session = null;
    
    if (callback) callback(null);
  };
  
  next();
};

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

// This variable will store the current vulnerability mode
let currentVulnerability = 'none';

// Apply custom session middleware
app.use(customSessionMiddleware);

// Add middleware to observe session after processing
app.use((req, res, next) => {
  logger('Session after middleware processing', { 
    sessionID: req.sessionId,
    hasSession: !!req.session,
    authenticated: req.session ? req.session.authenticated : false
  });
  next();
});

// Middleware to modify session based on vulnerability type
app.use((req, res, next) => {
  const vulnerability = req.query.vulnerability || currentVulnerability;
  
  switch (vulnerability) {
    case 'fixation':
      // For session fixation, we allow the session ID to be set via query parameter
      // This is now handled by the custom session middleware
      break;
      
    case 'hijacking':
      // For session hijacking, we don't invalidate the session after logout
      // Implementation happens in the logout route
      break;
      
    case 'timeout':
      // For session timeout, we set a very long session timeout
      if (req.session) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      break;
      
    default:
      // Default secure configuration
      if (req.session) {
        req.session.cookie.maxAge = 15 * 60 * 1000; // 15 minutes
      }
  }
  
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
  
  logger('Login attempt', { username, sessionID: req.sessionId });
  
  // Query the database for the user
  db.get('SELECT id, username FROM users WHERE username = ? AND password = ?', 
    [username, password], 
    (err, user) => {
      if (err) {
        logger('Database error during login', { error: err });
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (user) {
        logger('User authenticated', { user, sessionID: req.sessionId });
        
        // For session fixation vulnerability, we don't regenerate the session ID on login
        if (currentVulnerability !== 'fixation' && req.session.regenerate) {
          logger('Regenerating session for secure login', { oldSessionID: req.sessionId });
          req.session.regenerate((err) => {
            if (err) {
              logger('Session regeneration failed', { error: err });
              return res.status(500).json({ success: false, message: 'Session regeneration failed' });
            }
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.authenticated = true;
            
            logger('New session created', { newSessionID: req.sessionId });
            
            return res.json({ 
              success: true, 
              user: { id: user.id, username: user.username },
              sessionId: req.sessionId
            });
          });
        } else {
          // Without session regeneration (vulnerable to session fixation)
          logger('Using existing session (vulnerable to fixation)', { sessionID: req.sessionId });
          req.session.userId = user.id;
          req.session.username = user.username;
          req.session.authenticated = true;
          
          res.json({ 
            success: true, 
            user: { id: user.id, username: user.username },
            sessionId: req.sessionId
          });
        }
      } else {
        logger('Authentication failed - invalid credentials', { username });
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
      sessionId: req.sessionId
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  if (currentVulnerability === 'hijacking') {
    // For session hijacking vulnerability, we don't destroy the session
    logger('Session hijacking vulnerability: Session kept alive after logout', {
      sessionID: req.sessionId,
      username: req.session ? req.session.username : null
    });
    
    req.session.authenticated = true; // Just set authenticated to false but keep the session
    res.json({ success: true, message: 'Logged out but session not destroyed' });
  } else {
    // Normal secure logout
    logger('Secure logout: Destroying session', { sessionID: req.sessionId });
    
    req.session.destroy((err) => {
      if (err) {
        logger('Session destruction failed', { error: err });
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      logger('Session successfully destroyed');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }
});

// Get session ID for demonstration purposes
app.get('/api/session-id', (req, res) => {
  res.json({ sessionId: req.sessionId });
});

// Protected resource example
app.get('/api/protected', (req, res) => {
  logger('Protected resource access attempt', {
    sessionID: req.sessionId,
    hasSession: !!req.session,
    authenticated: req.session ? req.session.authenticated : false,
    username: req.session ? req.session.username : null,
    cookies: req.headers.cookie
  });
  
  if (req.session && req.session.authenticated) {
    logger('Protected resource access granted', { 
      username: req.session.username,
      sessionID: req.sessionId 
    });
    
    res.json({
      success: true,
      message: `Welcome to the protected area, ${req.session.username}!`,
      data: {
        secretInfo: 'This is sensitive information that only authenticated users should see.'
      }
    });
  } else {
    logger('Protected resource access denied', { sessionID: req.sessionId });
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});