// Test suite configurations for different testing scenarios
// These can be applied to any endpoint defined in endpoints.js

export const testSuites = {
  // Smoke Test - Quick validation that endpoints are working
  smoke: {
    name: 'Smoke Test',
    description: 'Quick validation with minimal load',
    config: {
      vus: 1,
      duration: '10s',
      thresholds: {
        'http_req_failed': ['rate<0.01']
      }
    }
  },

  // Load Test - Normal expected load
  load: {
    name: 'Load Test',
    description: 'Test under normal expected load',
    config: {
      vus: 50,
      duration: '2m',
      thresholds: {
        'http_req_duration': ['p(95)<500'],
        'http_req_failed': ['rate<0.01']
      }
    }
  },

  // Stress Test - Find breaking points
  stress: {
    name: 'Stress Test',
    description: 'Find the breaking point of the system',
    config: {
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Ramp up to 200 users
        { duration: '5m', target: 200 },  // Stay at 200 users
        { duration: '2m', target: 0 }     // Ramp down to 0 users
      ],
      thresholds: {
        'http_req_duration': ['p(95)<1000'],
        'http_req_failed': ['rate<0.05']
      }
    }
  },

  // Spike Test - Sudden load increase
  spike: {
    name: 'Spike Test',
    description: 'Test system behavior under sudden load spikes',
    config: {
      stages: [
        { duration: '1m', target: 10 },   // Normal load
        { duration: '1m', target: 100 },  // Sudden spike
        { duration: '1m', target: 10 },   // Back to normal
        { duration: '1m', target: 200 },  // Another spike
        { duration: '1m', target: 10 }    // Back to normal
      ],
      thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed': ['rate<0.10']
      }
    }
  },

  // Endurance Test - Long duration testing
  endurance: {
    name: 'Endurance Test',
    description: 'Test system stability over long periods',
    config: {
      vus: 25,
      duration: '30m',
      thresholds: {
        'http_req_duration': ['p(95)<500'],
        'http_req_failed': ['rate<0.01']
      }
    }
  },

  // Soak Test - Extended low-load testing
  soak: {
    name: 'Soak Test',
    description: 'Extended testing under sustained load',
    config: {
      vus: 10,
      duration: '2h',
      thresholds: {
        'http_req_duration': ['p(95)<300'],
        'http_req_failed': ['rate<0.005']
      }
    }
  }
};

// Helper function to get test suite by name
export function getTestSuite(name) {
  return testSuites[name];
}

// Helper function to get all test suite names
export function getAllTestSuiteNames() {
  return Object.keys(testSuites);
}

// Helper function to merge endpoint config with test suite config
export function mergeConfigs(endpoint, testSuiteName) {
  const testSuite = testSuites[testSuiteName];
  if (!testSuite) {
    throw new Error(`Test suite '${testSuiteName}' not found`);
  }

  // Use endpoint-specific config if available, otherwise use test suite default
  const endpointConfig = endpoint.testConfig?.[testSuiteName] || {};
  
  return {
    ...testSuite.config,
    ...endpointConfig,
    // Merge thresholds, with endpoint taking precedence
    thresholds: {
      ...testSuite.config.thresholds,
      ...endpointConfig.thresholds
    }
  };
}
