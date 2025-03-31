# Session Management Vulnerabilities: Technical Documentation

This document provides detailed technical information about the session management vulnerabilities demonstrated in this lab.

## 1. Session Fixation

### Technical Details

Session fixation attacks exploit applications that don't generate new session identifiers upon authentication. The attack follows this pattern:

1. The attacker obtains a valid session ID (by visiting the site or through other means)
2. The attacker tricks the victim into using this session ID (via URL parameter, cookie injection, etc.)
3. When the victim logs in with the attacker's session ID, the application authenticates the victim but continues using the same session ID
4. The attacker can now use their copy of the session ID to access the victim's authenticated session

### Implementation Details

In our lab, we implement this vulnerability in the following ways:

- The backend accepts session IDs provided via URL parameters
- When in "Session Fixation" mode, the server doesn't regenerate session IDs upon user login
- The frontend provides an input field where users can manually enter a session ID to demonstrate the attack

### Real-world Impact

Session fixation has been found in many applications, including banking websites, e-commerce platforms, and enterprise applications. Successful attacks can lead to:

- Complete account takeover
- Data theft
- Financial fraud
- Privacy violations

### Proper Mitigation

To prevent session fixation:

- Always generate a new session ID when a user authenticates
- Invalidate any existing session associated with the user before creating a new one
- Use secure random functions for generating session IDs
- Implement proper session timeout mechanisms

## 2. Session Hijacking

### Technical Details

Session hijacking occurs when an attacker steals or captures a user's valid session identifier and uses it to impersonate the user. In this lab, we focus on a specific variant: improper session invalidation after logout.

When sessions aren't properly invalidated after logout:

1. A user authenticates and receives a session ID
2. The user logs out
3. The server marks the session as "logged out" but doesn't actually destroy it
4. An attacker who has captured the session ID can still use it to access the user's data

### Implementation Details

In our lab, when "Session Hijacking" mode is enabled:

- The logout function only sets the `authenticated` flag to false
- The session data remains in memory and the session ID remains valid
- The server continues to recognize and process requests with that session ID

### Real-world Impact

Session hijacking vulnerabilities can lead to:

- Unauthorized access to sensitive information
- Continued access to user accounts even after logout
- Privacy violations
- Regulatory compliance issues

### Proper Mitigation

To prevent session hijacking:

- Properly destroy sessions server-side upon logout
- Implement proper session timeout mechanisms
- Use secure cookies with appropriate flags
- Consider implementing IP-based session validation (with caution)
- Use TLS/HTTPS to prevent session ID theft via network sniffing

## 3. Long Session Timeout

### Technical Details

Session timeout vulnerabilities occur when sessions remain valid for an excessive period of time. The risk increases with the session duration:

- Long-lived sessions provide attackers with extended windows of opportunity
- Forgotten sessions on shared computers become security risks
- Session IDs captured through various means can be exploited long after the user has stopped using the application

### Implementation Details

In our lab, when "Long Session Timeout" mode is enabled:

- Session timeout is set to 30 days
- No inactivity timeout is implemented
- Sessions remain valid even if unused for extended periods

### Real-world Impact

Excessive session timeouts have led to:

- Account compromises on shared computers
- Successful attacks using captured session IDs
- Compliance violations in regulated industries

### Proper Mitigation

To implement proper session timeout controls:

- Set reasonable absolute session timeouts (typically hours, not days/weeks)
- Implement idle/inactivity timeouts (typically 15-30 minutes for sensitive applications)
- Provide "remember me" functionality with appropriate security controls
- Re-authenticate users for sensitive operations regardless of session status

## Testing Methodology

### For Session Fixation

1. Enable "Session Fixation" vulnerability mode
2. Open two different browsers (e.g., Chrome and Firefox)
3. In Browser 1 (attacker):
   - Visit the login page, note the session ID or enter a custom one
4. In Browser 2 (victim):
   - Visit the login page with the attacker's session ID
   - Log in with valid credentials
5. Go back to Browser 1:
   - Refresh the page
   - You should now have access to the victim's authenticated session

### For Session Hijacking

1. Enable "Session Hijacking" vulnerability mode
2. Log in with valid credentials
3. Note your session ID
4. Log out
5. Open another browser or incognito window
6. Make a request to `/api/protected` with the previously noted session ID
7. Observe that you can still access protected resources

### For Long Session Timeout

1. Enable "Long Session Timeout" vulnerability mode
2. Log in with valid credentials
3. Note your session ID
4. Close the browser and reopen it days later
5. Use the same session ID to access protected resources
6. Observe that your session is still valid

## Resources for Further Learning

- OWASP Session Management Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
- OWASP Top 10: Broken Authentication: <https://owasp.org/www-project-top-ten/>
- OWASP Testing Guide: <https://owasp.org/www-project-web-security-testing-guide/>
