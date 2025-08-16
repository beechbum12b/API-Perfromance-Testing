import { check, sleep } from "k6";
import http from "k6/http";
import { endpoints, getAllEndpoints, getEndpointsByMethod } from "../config/endpoints.js";
import { testSuites, getAllTestSuiteNames } from "../config/test-suites.js";
import { generateTestData } from "./test-data.js";

// Batch test configuration
const batchConfig = {
  // Test all endpoints with smoke test
  smoke: {
    name: 'Smoke Test All Endpoints',
    description: 'Quick validation of all endpoints',
    endpoints: getAllEndpoints(),
    testSuite: 'smoke',
    parallel: false, // Run sequentially to avoid overwhelming the server
    delayBetweenEndpoints: 5 // seconds
  },
  
  // Test all GET endpoints with load test
  getEndpointsLoad: {
    name: 'Load Test All GET Endpoints',
    description: 'Load test all GET endpoints',
    endpoints: Object.keys(getEndpointsByMethod('GET')),
    testSuite: 'load',
    parallel: true,
    maxConcurrent: 3
  },
  
  // Test all POST endpoints with stress test
  postEndpointsStress: {
    name: 'Stress Test All POST Endpoints',
    description: 'Stress test all POST endpoints',
    endpoints: Object.keys(getEndpointsByMethod('POST')),
    testSuite: 'stress',
    parallel: false,
    delayBetweenEndpoints: 10
  },
  
  // Custom batch configuration
  custom: {
    name: 'Custom Batch Test',
    description: 'Custom endpoint and test suite combination',
    endpoints: __ENV.BATCH_ENDPOINTS ? __ENV.BATCH_ENDPOINTS.split(',') : ['users-me', 'health-check'],
    testSuite: __ENV.BATCH_TEST_SUITE || 'load',
    parallel: __ENV.BATCH_PARALLEL === 'true',
    maxConcurrent: parseInt(__ENV.BATCH_MAX_CONCURRENT || '2'),
    delayBetweenEndpoints: parseInt(__ENV.BATCH_DELAY || '5')
  }
};

// Get batch configuration from environment or use default
const batchKey = __ENV.BATCH_CONFIG || 'smoke';
const batch = batchConfig[batchKey];

if (!batch) {
  throw new Error(`Batch configuration '${batchKey}' not found. Available: ${Object.keys(batchConfig).join(', ')}`);
}

// Export batch metadata
export const metadata = {
  batchName: batch.name,
  batchDescription: batch.description,
  endpoints: batch.endpoints,
  testSuite: batch.testSuite,
  parallel: batch.parallel,
  maxConcurrent: batch.maxConcurrent || 1,
  delayBetweenEndpoints: batch.delayBetweenEndpoints || 0
};

// Dynamic options based on batch configuration
export const options = {
  // Use the test suite configuration
  ...testSuites[batch.testSuite].config,
  
  // Add batch-specific thresholds
  thresholds: {
    ...testSuites[batch.testSuite].config.thresholds,
    // Add batch-specific thresholds
    'http_req_duration': ['p95<1000'],
    'http_req_failed': ['rate<0.05']
  }
};

// Setup function - runs once before the test
export function setup() {
  console.log(`🚀 Starting batch test: ${batch.name}`);
  console.log(`📝 Description: ${batch.description}`);
  console.log(`🔗 Endpoints: ${batch.endpoints.join(', ')}`);
  console.log(`🧪 Test Suite: ${batch.testSuite}`);
  console.log(`⚡ Parallel: ${batch.parallel}`);
  console.log(`🔄 Max Concurrent: ${batch.maxConcurrent || 'N/A'}`);
  console.log(`⏱️  Delay Between Endpoints: ${batch.delayBetweenEndpoints}s`);
  console.log('');
  
  return {
    batch: batch,
    endpoints: batch.endpoints,
    testSuite: batch.testSuite
  };
}

// Main test function
export default function(data) {
  const { batch, endpoints, testSuite } = data;
  
  // Test each endpoint in the batch
  endpoints.forEach((endpointKey, index) => {
    const endpoint = endpoints[endpointKey];
    if (!endpoint) {
      console.warn(`⚠️  Endpoint '${endpointKey}' not found, skipping...`);
      return;
    }
    
    console.log(`🔗 Testing endpoint ${index + 1}/${endpoints.length}: ${endpoint.name}`);
    
    // Build the full URL
    const url = endpoint.baseUrl + endpoint.path;
    
    // Prepare request options
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'k6-batch-test'
      }
    };
    
    // Add authentication if required
    if (endpoint.requiresAuth) {
      const authToken = __ENV.AUTH_TOKEN;
      if (authToken) {
        requestOptions.headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        console.warn(`⚠️  Authentication required for ${endpointKey} but AUTH_TOKEN not provided`);
      }
    }
    
    let response;
    
    // Execute request based on HTTP method
    try {
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
          console.warn(`⚠️  Unsupported HTTP method: ${endpoint.method}`);
          return;
      }
      
      // Perform validations
      const checks = {
        [`${endpointKey} - status is ${endpoint.validation.expectedStatus}`]: 
          (r) => r.status === endpoint.validation.expectedStatus,
        
        [`${endpointKey} - response time < ${endpoint.validation.responseTime}ms`]: 
          (r) => r.timings.duration < endpoint.validation.responseTime,
        
        [`${endpointKey} - has required headers`]: 
          (r) => endpoint.validation.requiredHeaders.every(header => 
            r.headers[header] !== undefined
          )
      };
      
      // Execute all checks
      check(response, checks);
      
      console.log(`✅ ${endpointKey}: ${response.status} (${response.timings.duration}ms)`);
      
    } catch (error) {
      console.error(`❌ Error testing ${endpointKey}: ${error.message}`);
    }
    
    // Add delay between endpoints if not running in parallel
    if (!batch.parallel && index < endpoints.length - 1) {
      sleep(batch.delayBetweenEndpoints);
    }
  });
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('');
  console.log(`✅ Completed batch test: ${batch.name}`);
  console.log(`🔗 Tested ${batch.endpoints.length} endpoints`);
  console.log(`🧪 Test suite: ${batch.testSuite}`);
}
