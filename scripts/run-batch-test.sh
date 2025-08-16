#!/bin/bash

# Batch test runner for multiple endpoints
# Usage: ./run-batch-test.sh [batch-config]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default batch configuration
DEFAULT_BATCH="smoke"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [batch-config]"
    echo ""
    echo "Arguments:"
    echo "  batch-config  Batch configuration to run (default: $DEFAULT_BATCH)"
    echo ""
    echo "Available batch configurations:"
    echo "  smoke              - Smoke test all endpoints (sequential, 5s delay)"
    echo "  getEndpointsLoad   - Load test all GET endpoints (parallel, max 3 concurrent)"
    echo "  postEndpointsStress - Stress test all POST endpoints (sequential, 10s delay)"
    echo "  custom             - Custom configuration via environment variables"
    echo ""
    echo "Custom batch configuration environment variables:"
    echo "  BATCH_ENDPOINTS       - Comma-separated list of endpoints"
    echo "  BATCH_TEST_SUITE      - Test suite to use (smoke, load, stress, etc.)"
    echo "  BATCH_PARALLEL        - true/false for parallel execution"
    echo "  BATCH_MAX_CONCURRENT  - Maximum concurrent tests (for parallel)"
    echo "  BATCH_DELAY           - Delay between endpoints in seconds"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run default smoke test"
    echo "  $0 smoke                              # Run smoke test on all endpoints"
    echo "  $0 getEndpointsLoad                   # Run load test on GET endpoints"
    echo "  $0 postEndpointsStress                # Run stress test on POST endpoints"
    echo "  $0 custom                             # Run custom configuration"
    echo ""
    echo "Custom configuration examples:"
    echo "  BATCH_ENDPOINTS='users-me,health-check' BATCH_TEST_SUITE=load $0 custom"
    echo "  BATCH_ENDPOINTS='create-user,update-user' BATCH_TEST_SUITE=stress $0 custom"
}

# Function to check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first."
        echo ""
        echo "Installation options:"
        echo "  macOS:   brew install k6"
        echo "  Windows: choco install k6"
        echo "  Linux:   sudo apt-get install k6"
        echo "  Manual:  https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    K6_VERSION=$(k6 version | head -n1)
    print_success "Found k6: $K6_VERSION"
}

# Function to validate batch configuration
validate_batch_config() {
    local batch_config=$1
    case $batch_config in
        "smoke"|"getEndpointsLoad"|"postEndpointsStress"|"custom")
            return 0
            ;;
        *)
            print_error "Invalid batch configuration: $batch_config"
            echo ""
            echo "Available batch configurations:"
            echo "  smoke              - Smoke test all endpoints"
            echo "  getEndpointsLoad   - Load test all GET endpoints"
            echo "  postEndpointsStress - Stress test all POST endpoints"
            echo "  custom             - Custom configuration"
            exit 1
            ;;
    esac
}

# Function to show batch configuration details
show_batch_details() {
    local batch_config=$1
    
    case $batch_config in
        "smoke")
            echo "Smoke Test All Endpoints:"
            echo "  - Tests all configured endpoints"
            echo "  - Uses smoke test suite (1 user, 10s)"
            echo "  - Sequential execution with 5s delays"
            echo "  - Quick validation of all endpoints"
            ;;
        "getEndpointsLoad")
            echo "Load Test All GET Endpoints:"
            echo "  - Tests only GET endpoints"
            echo "  - Uses load test suite (50 users, 2m)"
            echo "  - Parallel execution (max 3 concurrent)"
            echo "  - Normal expected load testing"
            ;;
        "postEndpointsStress")
            echo "Stress Test All POST Endpoints:"
            echo "  - Tests only POST endpoints"
            echo "  - Uses stress test suite (ramp up to 200 users)"
            echo "  - Sequential execution with 10s delays"
            echo "  - Find breaking points"
            ;;
        "custom")
            echo "Custom Batch Configuration:"
            echo "  - Uses environment variables for configuration"
            echo "  - Flexible endpoint and test suite selection"
            echo "  - Configurable parallel/sequential execution"
            echo "  - Custom delays and concurrency limits"
            ;;
    esac
}

# Function to check custom configuration
check_custom_config() {
    if [ "$1" = "custom" ]; then
        print_status "Custom batch configuration detected. Checking environment variables..."
        
        if [ -z "$BATCH_ENDPOINTS" ]; then
            print_warning "BATCH_ENDPOINTS not set, using defaults: users-me, health-check"
        else
            print_success "BATCH_ENDPOINTS: $BATCH_ENDPOINTS"
        fi
        
        if [ -z "$BATCH_TEST_SUITE" ]; then
            print_warning "BATCH_TEST_SUITE not set, using default: load"
        else
            print_success "BATCH_TEST_SUITE: $BATCH_TEST_SUITE"
        fi
        
        if [ -z "$BATCH_PARALLEL" ]; then
            print_warning "BATCH_PARALLEL not set, using default: false"
        else
            print_success "BATCH_PARALLEL: $BATCH_PARALLEL"
        fi
        
        echo ""
    fi
}

# Function to run the batch test
run_batch_test() {
    local batch_config=$1
    
    print_status "Starting batch test with configuration: $batch_config"
    echo ""
    
    # Set environment variables for the test
    export BATCH_CONFIG=$batch_config
    
    # Run k6 with the batch test script
    k6 run \
        --env BATCH_CONFIG=$batch_config \
        scripts/batch-test-runner.js
    
    print_success "Batch test completed successfully!"
}

# Main script logic
main() {
    # Check if k6 is installed
    check_k6
    
    # Parse command line arguments
    BATCH_CONFIG=${1:-$DEFAULT_BATCH}
    
    # Show help if requested
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi
    
    # Validate batch configuration
    validate_batch_config $BATCH_CONFIG
    
    # Show batch configuration details
    echo ""
    show_batch_details $BATCH_CONFIG
    echo ""
    
    # Check custom configuration if applicable
    check_custom_config $BATCH_CONFIG
    
    # Display test configuration
    print_status "Test Configuration:"
    echo "  Batch Config: $BATCH_CONFIG"
    echo "  Script:      scripts/batch-test-runner.js"
    echo ""
    
    # Confirm before running
    echo -n "Start batch test? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "Batch test cancelled by user"
        exit 0
    fi
    
    # Run the batch test
    run_batch_test $BATCH_CONFIG
}

# Run main function with all arguments
main "$@"
