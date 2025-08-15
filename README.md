# API Performance Testing Framework

A simple and powerful performance testing framework using k6 for API endpoints.

## 🎯 What This Framework Tests

**Current Test**: `GET /users/me`  
**API Endpoint**: `https://dev-api.acexr.com/platform-services/v2/users/me`  
**Load**: 100 concurrent users over 1 minute  
**Validation**: Checks for successful HTTP 200 responses  

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **k6 installed** (see installation guide below)
- **Basic terminal knowledge**
- **Your API endpoint accessible**

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
You should see something like: `k6 v0.45.0 (go1.21.0, darwin/arm64)`

### Step 3: Run Your First Test
```bash
# Navigate to the project directory
cd /Users/ACox/api-performance-tests

# Make the script executable (first time only)
chmod +x scripts/run.sh

# Run the performance test
./scripts/run.sh
```

## 📊 Understanding Your Test Results

### What You'll See During Execution
```
🚀 Running k6 performance test...
          /\      |‾‾| /‾‾/   /‾‾/     
     /\  /  \     |  |/  /   /  /      
    /  \/    \    |     (   /   ‾‾\    
   /          \   |  |\  \ |  (‾)  |   
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: scripts/main.js
     output: -
     duration: 1m0s, iterations: -
     max VUs: 100, max iterations: -

  scenarios: (100.00%) 1 scenario, 100 max VUs
   * default: 100 iterations sharing 100 VUs
     (exec: default, gracefulStop: 30s, startTime: 0s, gracefulStop: 30s)

  data_received........: 1.2MB  20kB/s
  data_sent............: 45kB   750B/s
  http_req_blocked.....: avg=1.2ms   min=0s      med=0s      max=50ms    p(90)=0s      p(95)=0s      
  http_req_connecting..: avg=0s      min=0s      med=0s      max=0s      p(90)=0s      p(95)=0s      
  http_req_duration....: avg=45.2ms  min=12ms    med=42ms    max=120ms   p(90)=85ms    p(95)=98ms    
  http_req_failed......: 0.00%  ✓
  http_req_receiving...: avg=0.5ms   min=0s      med=0s      max=10ms    p(90)=0s      p(95)=0s      
  http_req_sending.....: avg=0.2ms   min=0s      med=0s      max=5ms     p(90)=0s      p(95)=0s      
  http_req_waiting.....: avg=44.5ms  min=12ms    med=42ms    max=120ms   p(90)=85ms    p(95)=98ms    
  http_reqs............: 1,320  22.0/s
  iteration_duration...: avg=1.05s   min=1s      med=1s      max=1.1s    p(90)=1.1s    p(95)=1.1s    
  iterations...........: 1,320  22.0/s
  vus.................: 100     min=100   max=100
  vus_max............. 100     min=100   max=100
```

### Key Metrics Explained

- **`http_req_duration`**: Response time (P95 < 100ms is good)
- **`http_req_failed`**: Error rate (0.00% is perfect)
- **`http_reqs`**: Total requests made
- **`iterations`**: Total test iterations completed
- **`vus`**: Virtual Users (concurrent users simulated)

## 🔧 Customizing Your Tests

### Change Load Parameters
Edit `scripts/main.js` and modify these lines:

```javascript
export const options = {
  vus: 50,           // Change from 100 to 50 users
  duration: "2m"      // Change from "1m" to "2m"
};
```

### Test Different Endpoints
Change the URL in `scripts/main.js`:

```javascript
// Change this line:
const response = http.get("https://dev-api.acexr.com/platform-services/v2/users/me");

// To test a different endpoint:
const response = http.get("https://dev-api.acexr.com/platform-services/v2/api/orders");
```

### Add More Validation Checks
Enhance the check function:

```javascript
check(response, { 
  "status is 200": (r) => r.status === 200,
  "response time < 500ms": (r) => r.timings.duration < 500,
  "has JSON response": (r) => r.headers['Content-Type'].includes('json')
});
```

## 🚨 Troubleshooting Common Issues

### "k6: command not found"
**Problem**: k6 is not installed or not in your PATH  
**Solution**: 
```bash
# Install k6 (see installation guide above)
# Or check if it's in a different location
which k6
```

### "Permission denied" on run.sh
**Problem**: Script is not executable  
**Solution**: 
```bash
chmod +x scripts/run.sh
```

### "Connection refused" or "timeout"
**Problem**: API endpoint is not accessible  
**Solutions**:
1. Check if the API is running
2. Verify the URL is correct
3. Check network connectivity
4. Ensure no firewall blocking

### "HTTP 401 Unauthorized"
**Problem**: API requires authentication  
**Solution**: You'll need to modify the script to include authentication headers

### "HTTP 404 Not Found"
**Problem**: Endpoint doesn't exist  
**Solution**: Verify the API endpoint path is correct

### Test runs but shows 0 requests
**Problem**: API might be blocking requests or returning errors  
**Solution**: 
1. Check the API logs
2. Verify the endpoint is working manually
3. Check for rate limiting

## 📈 Performance Targets & Best Practices

### Response Time Guidelines
- **Excellent**: P95 < 100ms
- **Good**: P95 < 200ms  
- **Acceptable**: P95 < 500ms
- **Poor**: P95 > 1000ms

### Error Rate Guidelines
- **Excellent**: < 0.1%
- **Good**: < 1%
- **Acceptable**: < 5%
- **Poor**: > 10%

### Load Testing Best Practices
1. **Start Small**: Begin with 10-20 users, then scale up
2. **Monitor Resources**: Watch CPU, memory, and network usage
3. **Test in Stages**: Ramp up gradually to find breaking points
4. **Use Realistic Data**: Test with data similar to production
5. **Run Multiple Times**: Performance can vary between runs

## 🔍 Advanced Usage

### Running with Custom Parameters
```bash
# Test with 50 users for 2 minutes
k6 run --vus 50 --duration 2m scripts/main.js

# Test with specific iterations
k6 run --iterations 1000 scripts/main.js

# Test with custom thresholds
k6 run --thresholds "http_req_duration:p95<100" scripts/main.js
```

### Output Options
```bash
# Save results to JSON file
k6 run --out json=results.json scripts/main.js

# Save results to CSV file  
k6 run --out csv=results.csv scripts/main.js

# Multiple outputs
k6 run --out json=results.json --out csv=results.csv scripts/main.js
```

### Environment Variables
```bash
# Set custom base URL
BASE_URL=https://staging-api.acexr.com k6 run scripts/main.js

# Set custom duration
DURATION=5m k6 run scripts/main.js
```

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

### Community & Support
- **k6 Community**: https://community.k6.io/
- **GitHub Issues**: https://github.com/grafana/k6/issues
- **Stack Overflow**: Tag questions with `k6`

## 🎯 Next Steps

1. **Run your first test** using the steps above
2. **Customize the endpoint** to test your specific API
3. **Add authentication** if your API requires it
4. **Experiment with different load patterns**
5. **Set up monitoring** for ongoing performance tracking

## 🆘 Getting Help

If you encounter issues:

1. **Check this README** for common solutions
2. **Review k6 documentation** for detailed explanations
3. **Check the k6 community** for similar issues
4. **Verify your API endpoint** is working manually first

---

## 🎉 You're Ready!

You now have a working performance testing framework. Start with the Quick Start guide above, and you'll be running your first API performance test in minutes!

**Happy Testing! 🚀**
