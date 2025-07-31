// File: /home/com2u/src/OrganAIzer/backend/healthcheck.js
// Purpose: Enhanced health check script for Docker container
// Tests both /health and /api/health endpoints with detailed logging

const http = require('http');

// Enhanced logging function
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

// Test multiple endpoints to ensure comprehensive health check
async function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'Docker-HealthCheck/1.0'
      }
    };

    log('info', `Testing ${description}`, { endpoint: path });

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('success', `${description} passed`, { 
            statusCode: res.statusCode,
            endpoint: path,
            responseLength: data.length
          });
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          log('error', `${description} failed`, { 
            statusCode: res.statusCode,
            endpoint: path,
            response: data.substring(0, 200)
          });
          resolve({ success: false, statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => {
      log('error', `${description} connection failed`, { 
        endpoint: path,
        error: err.message,
        code: err.code
      });
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      log('error', `${description} timed out`, { endpoint: path });
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

// Main health check function
async function performHealthCheck() {
  log('info', 'Starting Docker health check', { 
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid
  });

  try {
    // Test primary health endpoint
    const healthResult = await testEndpoint('/health', 'Primary health endpoint');
    
    // Test API health endpoint as backup
    const apiHealthResult = await testEndpoint('/api/health', 'API health endpoint');

    // Determine overall health status
    const isHealthy = healthResult.success || apiHealthResult.success;

    if (isHealthy) {
      log('success', 'Health check passed', {
        primaryEndpoint: healthResult.success,
        apiEndpoint: apiHealthResult.success
      });
      process.exit(0);
    } else {
      log('error', 'All health check endpoints failed', {
        primaryEndpoint: healthResult,
        apiEndpoint: apiHealthResult
      });
      process.exit(1);
    }

  } catch (error) {
    log('error', 'Health check exception', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGTERM', () => {
  log('info', 'Health check received SIGTERM');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('info', 'Health check received SIGINT');
  process.exit(1);
});

// Start health check
performHealthCheck();
