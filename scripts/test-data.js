export function generateTestData(endpoint) {
  // Generate appropriate test data based on endpoint method and path
  switch (endpoint.method) {
    case 'POST':
      return generatePostData(endpoint.path);
    case 'PATCH':
      return generatePatchData(endpoint.path);
    case 'PUT':
      return generatePutData(endpoint.path);
    default:
      return {};
  }
}

function generatePostData(path) {
  if (path.includes('users')) {
    return {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      phone: '+15551234567',
      organization: `test-org-${Date.now()}`,
      role: 'user',
      status: 'active'
    };
  }
  
  if (path.includes('orders')) {
    return {
      orderNumber: `ORD-${Date.now()}`,
      customerId: `cust-${Date.now()}`,
      items: [
        {
          productId: `prod-${Date.now()}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: (Math.random() * 100).toFixed(2)
        }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      }
    };
  }
  
  // Default generic data
  return {
    id: `test-${Date.now()}`,
    name: `Test Item ${Date.now()}`,
    description: 'Generated test data for performance testing',
    timestamp: new Date().toISOString(),
    metadata: {
      testRun: Date.now(),
      environment: 'performance-testing'
    }
  };
}

function generatePatchData(path) {
  if (path.includes('users')) {
    return {
      firstName: 'Updated',
      lastName: 'User',
      email: `updated_${Date.now()}@example.com`,
      lastModified: new Date().toISOString()
    };
  }
  
  if (path.includes('orders')) {
    return {
      status: 'shipped',
      trackingNumber: `TRK-${Date.now()}`,
      shippedAt: new Date().toISOString()
    };
  }
  
  // Default patch data
  return {
    updatedAt: new Date().toISOString(),
    version: Math.floor(Math.random() * 10) + 1
  };
}

function generatePutData(path) {
  // PUT requests typically replace entire resources
  return generatePostData(path);
}

// Helper function to generate random data
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate random email
export function generateRandomEmail() {
  const domains = ['example.com', 'test.org', 'demo.net', 'perf-test.io'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `user_${Date.now()}_${generateRandomString(4)}@${domain}`;
}

// Helper function to generate random phone number
export function generateRandomPhone() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${prefix}${lineNumber}`;
}
