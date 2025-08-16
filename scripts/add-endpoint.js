#!/usr/bin/env node

/**
 * Utility script to add new endpoints to the configuration
 * Usage: node add-endpoint.js [endpoint-key] [method] [path] [base-url]
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showUsage() {
  log('Usage: node add-endpoint.js [endpoint-key] [method] [path] [base-url]', 'cyan');
  log('');
  log('Arguments:', 'bright');
  log('  endpoint-key  Unique identifier for the endpoint (e.g., "get-orders")', 'reset');
  log('  method        HTTP method (GET, POST, PUT, PATCH, DELETE)', 'reset');
  log('  path          API path (e.g., "/api/v1/orders")', 'reset');
  log('  base-url      Base URL (e.g., "https://api.example.com")', 'reset');
  log('');
  log('Examples:', 'cyan');
  log('  node add-endpoint.js get-orders GET /api/v1/orders https://api.example.com', 'reset');
  log('  node add-endpoint.js create-order POST /api/v1/orders https://api.example.com', 'reset');
  log('  node add-endpoint.js update-order PATCH /api/v1/orders/123 https://api.example.com', 'reset');
  log('');
  log('Interactive mode:', 'cyan');
  log('  node add-endpoint.js', 'reset');
  log('');
}

function prompt(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function generateEndpointConfig(endpointKey, method, path, baseUrl) {
  const methodUpper = method.toUpperCase();
  
  // Default test configurations based on method
  const defaultTestConfig = {
    loadTest: {
      vus: methodUpper === 'GET' ? 100 : 50,
      duration: '1m',
      thresholds: {
        'http_req_duration': [`p95<${methodUpper === 'GET' ? 100 : 300}`],
        'http_req_failed': ['rate<0.01']
      }
    },
    smokeTest: {
      vus: 1,
      duration: '10s'
    }
  };

  // Default validation based on method
  const defaultValidation = {
    expectedStatus: methodUpper === 'POST' ? 201 : 200,
    responseTime: methodUpper === 'GET' ? 500 : 1000,
    requiredHeaders: ['Content-Type']
  };

  // Add method-specific headers
  if (methodUpper === 'POST' && defaultValidation.expectedStatus === 201) {
    defaultValidation.requiredHeaders.push('Location');
  }

  return {
    name: `${methodUpper} ${path.split('/').pop() || 'Resource'}`,
    method: methodUpper,
    path: path,
    baseUrl: baseUrl,
    requiresAuth: methodUpper !== 'GET' || path.includes('users') || path.includes('profile'),
    testConfig: defaultTestConfig,
    validation: defaultValidation
  };
}

function updateEndpointsFile(endpointKey, endpointConfig) {
  const endpointsPath = path.join(__dirname, '..', 'config', 'endpoints.js');
  
  if (!fs.existsSync(endpointsPath)) {
    log(`Error: Endpoints file not found at ${endpointsPath}`, 'red');
    return false;
  }

  let content = fs.readFileSync(endpointsPath, 'utf8');
  
  // Find the position to insert the new endpoint
  const insertPattern = /export const endpoints = {/;
  const match = content.match(insertPattern);
  
  if (!match) {
    log('Error: Could not find endpoints export in file', 'red');
    return false;
  }

  // Create the new endpoint entry
  const newEndpoint = `  '${endpointKey}': ${JSON.stringify(endpointConfig, null, 2).replace(/\n/g, '\n  ')}`;

  // Insert the new endpoint after the opening brace
  const insertIndex = match.index + match[0].length;
  const before = content.substring(0, insertIndex);
  const after = content.substring(insertIndex);
  
  // Add comma if there are existing endpoints
  const comma = after.trim().startsWith('}') ? '' : ',';
  
  const newContent = before + '\n' + newEndpoint + comma + after;
  
  try {
    fs.writeFileSync(endpointsPath, newContent, 'utf8');
    log(`✅ Successfully added endpoint '${endpointKey}' to ${endpointsPath}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error writing to file: ${error.message}`, 'red');
    return false;
  }
}

function validateInput(endpointKey, method, path, baseUrl) {
  const errors = [];

  if (!endpointKey || endpointKey.trim() === '') {
    errors.push('Endpoint key is required');
  } else if (!/^[a-z0-9-]+$/.test(endpointKey)) {
    errors.push('Endpoint key should contain only lowercase letters, numbers, and hyphens');
  }

  if (!method || method.trim() === '') {
    errors.push('HTTP method is required');
  } else if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    errors.push('HTTP method must be one of: GET, POST, PUT, PATCH, DELETE');
  }

  if (!path || path.trim() === '') {
    errors.push('API path is required');
  } else if (!path.startsWith('/')) {
    errors.push('API path must start with /');
  }

  if (!baseUrl || baseUrl.trim() === '') {
    errors.push('Base URL is required');
  } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    errors.push('Base URL must start with http:// or https://');
  }

  return errors;
}

async function interactiveMode() {
  log('🔧 Interactive Endpoint Addition', 'cyan');
  log('===============================', 'cyan');
  log('');

  const endpointKey = await prompt('Enter endpoint key (e.g., "get-orders"): ');
  const method = await prompt('Enter HTTP method (GET, POST, PUT, PATCH, DELETE): ');
  const path = await prompt('Enter API path (e.g., "/api/v1/orders"): ');
  const baseUrl = await prompt('Enter base URL (e.g., "https://api.example.com"): ');

  log('');
  return { endpointKey, method, path, baseUrl };
}

async function main() {
  let endpointKey, method, path, baseUrl;

  if (process.argv.length === 5) {
    // Command line arguments provided
    [, , endpointKey, method, path, baseUrl] = process.argv;
  } else if (process.argv.length === 2) {
    // Interactive mode
    const inputs = await interactiveMode();
    endpointKey = inputs.endpointKey;
    method = inputs.method;
    path = inputs.path;
    baseUrl = inputs.baseUrl;
  } else {
    showUsage();
    process.exit(1);
  }

  // Validate inputs
  const errors = validateInput(endpointKey, method, path, baseUrl);
  if (errors.length > 0) {
    log('❌ Validation errors:', 'red');
    errors.forEach(error => log(`  - ${error}`, 'red'));
    log('');
    showUsage();
    process.exit(1);
  }

  // Generate endpoint configuration
  log('📝 Generating endpoint configuration...', 'blue');
  const endpointConfig = generateEndpointConfig(endpointKey, method, path, baseUrl);

  // Display the configuration
  log('📋 Generated endpoint configuration:', 'cyan');
  log(JSON.stringify(endpointConfig, null, 2), 'reset');
  log('');

  // Confirm before adding
  const confirm = await prompt('Add this endpoint to the configuration? (y/N): ');
  if (!confirm.toLowerCase().startsWith('y')) {
    log('❌ Endpoint addition cancelled', 'yellow');
    process.exit(0);
  }

  // Update the endpoints file
  log('💾 Updating endpoints configuration file...', 'blue');
  const success = updateEndpointsFile(endpointKey, endpointConfig);

  if (success) {
    log('');
    log('🎉 Endpoint added successfully!', 'green');
    log('');
    log('Next steps:', 'cyan');
    log('1. Review the generated configuration in config/endpoints.js', 'reset');
    log('2. Adjust test parameters if needed (VUs, duration, thresholds)', 'reset');
    log('3. Run a test: ./scripts/run-endpoint-test.sh ' + endpointKey, 'reset');
    log('4. Run batch tests: ./scripts/run-batch-test.sh smoke', 'reset');
  } else {
    log('❌ Failed to add endpoint', 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { generateEndpointConfig, updateEndpointsFile };
