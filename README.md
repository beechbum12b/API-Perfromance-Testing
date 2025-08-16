# 🚀 Scalable API Performance Testing Framework

A powerful and scalable performance testing framework using k6 for API endpoints. This framework is designed to easily scale from testing a single endpoint to hundreds of endpoints without rewriting tests.

## 🎯 Key Features

- **🔧 Configuration-Driven**: Define endpoints once, test everywhere
- **📊 Multiple Test Suites**: Smoke, Load, Stress, Spike, Endurance, and Soak tests
- **🔄 Batch Testing**: Test multiple endpoints simultaneously
- **⚡ Easy Scaling**: Add new endpoints in minutes, not hours
- **🎭 Flexible Authentication**: Support for authenticated and public endpoints
- **📈 Comprehensive Reporting**: Built-in validation and performance metrics

## 🏗️ Architecture Overview

```
config/
├── endpoints.js          # Central endpoint definitions
└── test-suites.js       # Test suite configurations

scripts/
├── endpoint-test.js      # Generic endpoint tester
├── batch-test-runner.js  # Batch testing engine
├── add-endpoint.js       # Endpoint addition utility
└── run-*.sh             # Execution scripts
```

## 🚀 Quick Start

### Prerequisites
- **k6 installed** (see installation guide below)
- **Node.js** (for endpoint management utilities)
- **Basic terminal knowledge**

### Step 1: Install k6

#### macOS
```bash
brew install k6
```

#### Windows
```bash
choco install k6
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install k6
```

#### Manual Installation
Visit: https://k6.io/docs/getting-started/installation/

### Step 2: Verify Installation
```bash
k6 version
```

### Step 3: Run Your First Test
```bash
# Test a single endpoint
./scripts/run-endpoint-test.sh users-me smoke

# Test all endpoints with smoke test
./scripts/run-batch-test.sh smoke

# Test specific endpoints with custom configuration
BATCH_ENDPOINTS='users-me,health-check' BATCH_TEST_SUITE=load ./scripts/run-batch-test.sh custom
```

## 🔧 Adding New Endpoints

### Method 1: Interactive Mode (Recommended)
```bash
cd scripts
node add-endpoint.js
```

### Method 2: Command Line
```bash
node add-endpoint.js get-orders GET /api/v1/orders https://api.example.com
```

### Method 3: Manual Configuration
Edit `config/endpoints.js` and add your endpoint:

```javascript
'get-orders': {
  name: 'Get Orders',
  method: 'GET',
  path: '/api/v1/orders',
  baseUrl: 'https://api.example.com',
  requiresAuth: true,
  testConfig: {
    loadTest: {
      vus: 100,
      duration: '1m',
      thresholds: {
        'http_req_duration': ['p95<100'],
        'http_req_failed': ['rate<0.01']
      }
    }
  },
  validation: {
    expectedStatus: 200,
    responseTime: 500,
    requiredHeaders: ['Content-Type']
  }
}
```

## 🧪 Available Test Suites

| Test Suite | Purpose | Typical Load | Duration |
|------------|---------|--------------|----------|
| **Smoke** | Quick validation | 1 user | 10s |
| **Load** | Normal expected load | 50-100 users | 1-2m |
| **Stress** | Find breaking points | Ramp up to 200+ users | 20m+ |
| **Spike** | Sudden load increases | 10 → 200 → 10 users | 5m |
| **Endurance** | Long-term stability | 25 users | 30m |
| **Soak** | Extended low-load | 10 users | 2h+ |

## 📊 Running Tests

### Single Endpoint Testing
```bash
# Basic usage
./scripts/run-endpoint-test.sh [endpoint] [test-suite]

# Examples
./scripts/run-endpoint-test.sh users-me smoke
./scripts/run-endpoint-test.sh health-check load
./scripts/run-endpoint-test.sh create-user stress
```

### Batch Testing
```bash
# Test all endpoints with smoke test
./scripts/run-batch-test.sh smoke

# Test GET endpoints with load test
./scripts/run-batch-test.sh getEndpointsLoad

# Test POST endpoints with stress test
./scripts/run-batch-test.sh postEndpointsStress

# Custom batch configuration
BATCH_ENDPOINTS='users-me,health-check' BATCH_TEST_SUITE=load ./scripts/run-batch-test.sh custom
```

### Authentication
For endpoints requiring authentication, set the `AUTH_TOKEN` environment variable:

```bash
export AUTH_TOKEN='your-jwt-token-here'
./scripts/run-endpoint-test.sh users-me load
```

## 🔍 Understanding Test Results

### Key Metrics
- **`http_req_duration`**: Response time (P95 < 100ms is excellent)
- **`http_req_failed`**: Error rate (0.00% is perfect)
- **`http_reqs`**: Total requests made
- **`iterations`**: Total test iterations completed
- **`vus`**: Virtual Users (concurrent users simulated)

### Performance Targets
| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Response Time (P95) | < 100ms | < 200ms | < 500ms | > 1000ms |
| Error Rate | < 0.1% | < 1% | < 5% | > 10% |

## 🎛️ Advanced Configuration

### Custom Test Suites
Edit `config/test-suites.js` to add new test patterns:

```javascript
customLoad: {
  name: 'Custom Load Pattern',
  description: 'Custom load testing pattern',
  config: {
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 0 }
    ],
    thresholds: {
      'http_req_duration': ['p95<300'],
      'http_req_failed': ['rate<0.02']
    }
  }
}
```

### Environment-Specific Configurations
```bash
# Test against staging environment
BASE_URL=https://staging-api.example.com ./scripts/run-endpoint-test.sh users-me load

# Custom test duration
DURATION=5m ./scripts/run-endpoint-test.sh health-check endurance
```

## 📈 Scaling Your Tests

### Adding Multiple Endpoints
1. **Use the utility script**: `node add-endpoint.js`
2. **Copy existing endpoint**: Duplicate and modify in `config/endpoints.js`
3. **Batch import**: Create a script to import from API documentation

### Testing Different Environments
```bash
# Development
./scripts/run-batch-test.sh smoke

# Staging
STAGE=staging ./scripts/run-batch-test.sh load

# Production
STAGE=prod ./scripts/run-batch-test.sh smoke
```

### CI/CD Integration
```bash
# Run smoke tests in CI
./scripts/run-batch-test.sh smoke

# Run load tests in staging
./scripts/run-batch-test.sh getEndpointsLoad

# Run stress tests before deployment
./scripts/run-batch-test.sh postEndpointsStress
```

## 🚨 Troubleshooting

### Common Issues

#### "Endpoint not found"
- Check `config/endpoints.js` for correct endpoint key
- Use `./scripts/run-endpoint-test.sh --help` to see available endpoints

#### "Authentication required"
- Set `AUTH_TOKEN` environment variable
- Check if endpoint requires authentication in configuration

#### "Test runs but shows 0 requests"
- Verify API endpoint is accessible
- Check for rate limiting or blocking
- Review API logs for errors

#### "Permission denied on scripts"
```bash
chmod +x scripts/*.sh
```

### Getting Help
1. **Check this README** for common solutions
2. **Review k6 documentation**: https://k6.io/docs/
3. **Check endpoint configuration** in `config/endpoints.js`
4. **Verify API endpoints** are working manually first

## 🔮 Future Enhancements

- **GraphQL Support**: Native GraphQL endpoint testing
- **Database Validation**: Verify data integrity during tests
- **Advanced Reporting**: HTML reports with charts and graphs
- **Load Profile Import**: Import load patterns from monitoring tools
- **Distributed Testing**: Run tests across multiple machines

## 📚 Learning Resources

### k6 Documentation
- **Official Docs**: https://k6.io/docs/
- **Examples**: https://k6.io/docs/examples/
- **API Reference**: https://k6.io/docs/javascript-api/

### Performance Testing Concepts
- **Load Testing**: Testing normal expected load
- **Stress Testing**: Finding breaking points
- **Spike Testing**: Testing sudden load increases
- **Endurance Testing**: Testing over long periods

## 🎉 You're Ready!

You now have a **scalable performance testing framework** that can grow with your API:

1. **Start small**: Test one endpoint with smoke test
2. **Add endpoints**: Use the utility script to add new endpoints
3. **Scale up**: Run batch tests across multiple endpoints
4. **Customize**: Adjust test suites and configurations
5. **Automate**: Integrate with CI/CD pipelines

**Happy Testing! 🚀**

---

## 📋 Quick Reference

### Common Commands
```bash
# Test single endpoint
./scripts/run-endpoint-test.sh [endpoint] [test-suite]

# Test all endpoints
./scripts/run-batch-test.sh smoke

# Add new endpoint
node scripts/add-endpoint.js

# Help
./scripts/run-endpoint-test.sh --help
./scripts/run-batch-test.sh --help
```

### File Locations
- **Endpoint configs**: `config/endpoints.js`
- **Test suites**: `config/test-suites.js`
- **Test scripts**: `scripts/endpoint-test.js`
- **Batch runner**: `scripts/batch-test-runner.js`
- **Utility scripts**: `scripts/add-endpoint.js`
