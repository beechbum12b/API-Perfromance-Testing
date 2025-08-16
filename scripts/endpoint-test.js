import { check, sleep } from "k6";
import http from "k6/http";
import { getEndpoint, buildUrl } from "../config/endpoints.js";
import { mergeConfigs } from "../config/test-suites.js";
import { generateTestData } from "./test-data.js";

// Get endpoint and test suite from environment variables or command line arguments
const endpointKey = __ENV.ENDPOINT || 'users-me';
const testSuite = __ENV.TEST_SUITE || 'load';

// Get endpoint configuration
const endpoint = getEndpoint(endpointKey);
if (!endpoint) {
  throw new Error(`Endpoint '${endpointKey}' not found. Available endpoints: ${Object.keys(endpoints).join(', ')}`);
}

// Merge endpoint and test suite configurations
export const options = mergeConfigs(endpoint, testSuite);

// Add test metadata
export const metadata = {
  endpoint: endpointKey,
  endpointName: endpoint.name,
  method: endpoint.method,
  path: endpoint.path,
  baseUrl: endpoint.baseUrl,
  testSuite: testSuite,
  requiresAuth: endpoint.requiresAuth
};

// Setup function runs once before the test
export function setup() {
  console.log(`🚀 Starting ${testSuite} test for endpoint: ${endpoint.name}`);
  console.log(`📍 URL: ${endpoint.baseUrl}${endpoint.path}`);
  console.log(`🔧 Method: ${endpoint.method}`);
  console.log(`🔐 Requires Auth: ${endpoint.requiresAuth}`);
  
  // If endpoint requires auth, you could set up authentication here
  if (endpoint.requiresAuth) {
    console.log('⚠️  This endpoint requires authentication. Make sure to set AUTH_TOKEN environment variable.');
  }
  
  return {
    endpoint: endpoint,
    testSuite: testSuite
  };
}

// Main test function
export default function(data) {
  const { endpoint } = data;
  
  // Build the full URL (replace path parameters if any)
  const url = buildUrl(endpointKey, {
    // Add path parameters here if needed
    // id: '123'
  });
  
  // Prepare request options
  const requestOptions = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-performance-test'
    }
  };
  
  // Add authentication if required
  if (endpoint.requiresAuth) {
    const authToken = __ENV.AUTH_TOKEN;
    if (authToken) {
      requestOptions.headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      console.warn('⚠️  Authentication required but AUTH_TOKEN not provided');
    }
  }
  
  let response;
  
  // Execute request based on HTTP method
  switch (endpoint.method) {
    case 'GET':
      response = http.get(url, requestOptions);
      break;
      
    case 'POST':
      const postData = generateTestData(endpoint);
      response = http.post(url, JSON.stringify(postData), requestOptions);
      break;
      
    case 'PUT':
      const putData = generateTestData(endpoint);
      response = http.put(url, JSON.stringify(putData), requestOptions);
      break;
      
    case 'PATCH':
      const patchData = generateTestData(endpoint);
      response = http.patch(url, JSON.stringify(patchData), requestOptions);
      break;
      
    case 'DELETE':
      response = http.del(url, null, requestOptions);
      break;
      
    default:
      throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
  }
  
  // Perform validations
  const checks = {
    [`${endpoint.method} ${endpoint.path} - status is ${endpoint.validation.expectedStatus}`]: 
      (r) => r.status === endpoint.validation.expectedStatus,
    
    [`${endpoint.method} ${endpoint.path} - response time < ${endpoint.validation.responseTime}ms`]: 
      (r) => r.timings.duration < endpoint.validation.responseTime,
    
    [`${endpoint.method} ${endpoint.path} - has required headers`]: 
      (r) => endpoint.validation.requiredHeaders.every(header => 
        r.headers[header] !== undefined
      )
  };
  
  // Add method-specific validations
  if (endpoint.method === 'POST' && endpoint.validation.expectedStatus === 201) {
    checks[`${endpoint.method} ${endpoint.path} - has Location header`] = 
      (r) => r.headers['Location'] !== undefined;
  }
  
  // Execute all checks
  check(response, checks);
  
  // Add sleep between requests to avoid overwhelming the server
  sleep(1);
}

// Teardown function runs once after the test
export function teardown(data) {
  console.log(`✅ Completed ${testSuite} test for endpoint: ${endpoint.name}`);
}
