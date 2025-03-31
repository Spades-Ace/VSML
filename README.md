<div align="center">
	<a href="https://github.com/Spades-Ace/VSML">
    <img src="https://raw.githubusercontent.com/Spades-Ace/VSML/main/logo.png" height="150px" alt="VSML Logo"/>
	<br>
    <h1>Vulnerable Session Management Lab</h1>
	<br>
	</a>
    An educational lab environment demonstrating common session management vulnerabilities
    <br>
	<br>
    <p align="center">
	<a href="https://github.com/Spades-Ace/VSML/stargazers">
		<img alt="Stargazers" src="https://custom-icon-badges.herokuapp.com/github/stars/Spades-Ace/VSML?style=for-the-badge&logo=star&color=f6c177&logoColor=eb6f92&labelColor=191724"></a>
	<a href="https://github.com/Spades-Ace/VSML/wiki">
		<img alt="Wiki" src="https://custom-icon-badges.herokuapp.com/badge/read_the-docs-ebbcba?style=for-the-badge&logo=repo&logoColor=eb6f92&labelColor=191724"></a>
 	<a href="https://github.com/Spades-Ace/VSML/releases/latest">
		<img alt="Releases" src="https://img.shields.io/github/release/Spades-Ace/VSML?style=for-the-badge&logo=github&color=31748f&logoColor=eb6f92&labelColor=191724"/></a>
	<a href="https://github.com/Spades-Ace/VSML/blob/main/LICENSE">
		<img alt="License" src="https://custom-icon-badges.herokuapp.com/github/license/Spades-Ace/VSML?style=for-the-badge&logo=law&color=c4a7e7&logoColor=eb6f92&labelColor=191724"></a>
	<a href="https://github.com/Spades-Ace/VSML/issues">
		<img alt="Issues" src="https://custom-icon-badges.herokuapp.com/github/issues/Spades-Ace/VSML?style=for-the-badge&logo=issue-opened&color=9ccfd8&logoColor=eb6f92&labelColor=191724"></a>
</p>
    <br>
</div>

# About This Lab

This is an educational lab environment designed to demonstrate common session management vulnerabilities in web applications. This lab is intended for security education purposes only.

# Vulnerabilities Demonstrated

The lab demonstrates the following session management vulnerabilities:

## 1. Session Fixation

**Description**: The attacker sets (fixes) a session ID before the victim logs in. When the victim logs in, they inherit the attacker-controlled session ID. The attacker can then use the same session ID to hijack the victim's session.

**How to test**:

1. Enable "Session Fixation" mode using the selector
2. Enter a custom session ID in the login form
3. Log in with valid credentials
4. Note that your session uses the ID you specified
5. In a different browser or incognito window, you can use the same session ID to access the victim's session

## 2. Session Hijacking

**Description**: Even after a user logs out, their session remains active and can be reused by an attacker who has captured the session ID.

**How to test**:

1. Enable "Session Hijacking" mode using the selector
2. Log in with valid credentials and note your session ID
3. Log out
4. You can still use the same session ID to access protected resources as the server doesn't properly invalidate sessions during logout

## 3. Long Session Timeout

**Description**: When a session timeout is too long or indefinite, an attacker can reuse the session even long after the user has stopped using the application.

**How to test**:

1. Enable "Long Session Timeout" mode using the selector
2. Log in with valid credentials
3. Note that your session will remain active for 30 days
4. This gives attackers a large window of opportunity to use a captured session ID

# Test Credentials

The following accounts are available for testing:

- Username: `admin`, Password: `admin123`
- Username: `user1`, Password: `password123`
- Username: `victim`, Password: `victim123`

# Running the Lab

## Prerequisites

- Docker and Docker Compose installed on your system

## Setup and Start

1. Clone this repository
   ```bash
   git clone https://github.com/Spades-Ace/VSML.git
   ```
2. Navigate to the project directory
   ```bash
   cd VSML
   ```
3. Start the lab environment using Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Access the lab in your browser:
   - Frontend: <http://localhost:3000>
   - Backend API: <http://localhost:3001>

## Stopping the Lab

To stop the lab environment:

```bash
docker-compose down
```

# Technologies Used

## Frontend:

<img src="https://skillicons.dev/icons?i=react,ts,css" height=40/>

## Backend:

<img src="https://skillicons.dev/icons?i=nodejs,express,sqlite" height=40/>

## Infrastructure:

<img src="https://skillicons.dev/icons?i=docker" height=40/>

# Architecture

- **Frontend**: React with TypeScript
- **Backend**: Express.js
- **Database**: SQLite (file-based)

# Educational Purpose Only

This lab demonstrates vulnerabilities for educational purposes. Do not use these approaches in production applications. Always follow security best practices in real-world applications:

- Generate new session IDs upon login
- Invalidate sessions properly upon logout
- Set reasonable session timeout periods
- Use secure and HTTPOnly flags for cookies
- Implement proper CSRF protections

# Secure Solution Examples

For each vulnerability, here's how you would properly secure a real application:

## Session Fixation Mitigation

- Always generate a new session ID when a user authenticates
- Invalidate the previous session ID

## Session Hijacking Mitigation

- Properly destroy sessions on logout
- Implement proper session expiration
- Consider IP-based checks (with caution)

## Session Timeout Mitigation

- Set reasonable timeout periods (e.g., 15-30 minutes for sensitive applications)
- Implement idle timeouts
- Provide options for "remember me" functionality with proper security controls

# Contributing

Please feel free to contribute to this educational lab by submitting issues or pull requests.

# License

This project is licensed under the MIT License - see the LICENSE file for details.
