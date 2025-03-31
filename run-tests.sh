#!/bin/bash

# Run the session attack test script
echo "Installing dependencies..."
npm install axios readline

echo "Running session management vulnerability tests..."
node test-session-attacks.js