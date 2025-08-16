// Centralized endpoint configuration for API performance testing
// Add new endpoints here and they'll automatically be available to all test suites

export const endpoints = {
  // User Management Endpoints
  'users-me': {
    name: 'Get Current User',
    method: 'GET',
    path: '/platform-services/v2/users/me',
    baseUrl: 'https://dev-api.acexr.com',
    requiresAuth: true,
    testConfig: {
      loadTest: {
        vus: 100,
        duration: '1m',
        thresholds: {
          'http_req_duration': ['p(95)<100'],
          'http_req_failed': ['rate<0.01']
        }
      },
      smokeTest: {
        vus: 1,
        duration: '10s'
      }
    },
    validation: {
      expectedStatus: 200,
      responseTime: 500,
      requiredHeaders: ['Content-Type']
    }
  },

  'client-configs': {
    name: 'Get Client Configurations',
    method: 'GET',
    path: '/platform-services/v2/client-configs',
    baseUrl: 'https://dev-api.acexr.com',
    requiresAuth: false,
    testConfig: {
      loadTest: {
        vus: 50,
        duration: '2m',
        thresholds: {
          'http_req_duration': ['p(95)<200'],
          'http_req_failed': ['rate<0.01']
        }
      },
      smokeTest: {
        vus: 1,
        duration: '10s'
      }
    },
    validation: {
      expectedStatus: 200,
      responseTime: 1000,
      requiredHeaders: ['Content-Type']
    }
  },

  //Alternate with HEAD Method
  'health-check': {
    name: 'Health Check',
    method: 'GET',
    path: '/platform-services/v2/health',
    baseUrl: 'https://dev-api.acexr.com',
    requiresAuth: false,
    testConfig: {
      loadTest: {
        vus: 200,
        duration: '5m',
        thresholds: {
          'http_req_duration': ['p(95)<50'],
          'http_req_failed': ['rate<0.001']
        }
      },
      smokeTest: {
        vus: 1,
        duration: '10s'
      }
    },
    validation: {
      expectedStatus: 200,
      responseTime: 100,
      requiredHeaders: ['Content-Type']
    }
  },

  // Example endpoints for different HTTP methods
  'create-user': {
    name: 'Create User',
    method: 'POST',
    path: '/platform-services/v2/users',
    baseUrl: 'https://dev-api.acexr.com',
    requiresAuth: true,
    testConfig: {
      loadTest: {
        vus: 30,
        duration: '1m',
        thresholds: {
          'http_req_duration': ['p(95)<300'],
          'http_req_failed': ['rate<0.05']
        }
      },
      smokeTest: {
        vus: 1,
        duration: '10s'
      }
    },
    validation: {
      expectedStatus: 201,
      responseTime: 1000,
      requiredHeaders: ['Content-Type', 'Location']
    }
  },

  'update-user': {
    name: 'Update User',
    method: 'PATCH',
    path: '/platform-services/v2/users/{id}',
    baseUrl: 'https://dev-api.acexr.com',
    requiresAuth: true,
    testConfig: {
      loadTest: {
        vus: 20,
        duration: '1m',
        thresholds: {
          'http_req_duration': ['p(95)<250'],
          'http_req_failed': ['rate<0.03']
        }
      },
      smokeTest: {
        vus: 1,
        duration: '10s'
      }
    },
    validation: {
      expectedStatus: 200,
      responseTime: 800,
      requiredHeaders: ['Content-Type']
    }
  },

'auth/signin': {
  name: 'Sign In',
  method: 'POST',
  path: '/platform-services/v2/auth/signin',
  baseUrl: 'https://dev-api.acexr.com',
  requiresAuth: true,
  testConfig: {
    loadTest: {
      vus: 20,
      duration: '1m',
      thresholds: {
        'http_req_duration': ['p95<250'],
        'http_req_failed': ['rate<0.03']
      }
    },
    smokeTest: {
      vus: 1,
      duration: '10s'
    }
  },
  validation: {
    expectedStatus: 200,
    responseTime: 800,
    requiredHeaders: ['Content-Type']
  }
}
};

// Helper function to get endpoint by key
export function getEndpoint(key) {
  return endpoints[key];
}

// Helper function to get all endpoints
export function getAllEndpoints() {
  return Object.keys(endpoints);
}

// Helper function to get endpoints by method
export function getEndpointsByMethod(method) {
  return Object.entries(endpoints)
    .filter(([key, endpoint]) => endpoint.method === method.toUpperCase())
    .reduce((acc, [key, endpoint]) => {
      acc[key] = endpoint;
      return acc;
    }, {});
}

// Helper function to get endpoints that require authentication
export function getAuthenticatedEndpoints() {
  return Object.entries(endpoints)
    .filter(([key, endpoint]) => endpoint.requiresAuth)
    .reduce((acc, [key, endpoint]) => {
      acc[key] = endpoint;
      return acc;
    }, {});
}

// Helper function to build full URL for an endpoint
export function buildUrl(endpointKey, params = {}) {
  const endpoint = endpoints[endpointKey];
  if (!endpoint) {
    throw new Error(`Endpoint '${endpointKey}' not found`);
  }

  let url = endpoint.baseUrl + endpoint.path;
  
  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });
  
  return url;
}
