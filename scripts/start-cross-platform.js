#!/usr/bin/env node

/**
 * Cross-platform startup script for the application
 * Works on Windows, macOS, and Linux
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Set environment variables
process.env.NODE_ENV = 'development';

// Get platform-specific command
const isWindows = os.platform() === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

// Start the server
const serverProcess = spawn(
  command,
  ['tsx', 'server/index.ts'],
  { 
    stdio: 'inherit',
    env: process.env,
    shell: isWindows
  }
);

serverProcess.on('error', (error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});