#!/usr/bin/env node

/**
 * Standalone Health Check Server
 * 
 * Runs the enhanced health check server independently
 * Tests Context7 and OpenAI API connectivity
 */

import HealthCheckServer from './health.js';

const port = parseInt(process.env.PORT || '3000');
const healthServer = new HealthCheckServer(port);

console.log('🏥 Starting enhanced health check server...');
console.log(`   Port: ${port}`);
console.log('   Testing: Context7 API, OpenAI API, Database, Cache');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down health server...');
  healthServer.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down health server...');
  healthServer.destroy();
  process.exit(0);
});
