#!/bin/bash

# Flexible endpoint test runner for k6 performance tests
# Usage: ./run-endpoint-test.sh [endpoint] [test-suite]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_ENDPOINT="users-me"
DEFAULT_TEST_SUITE="load"

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
    echo "Usage: $0 [endpoint] [test-suite]"
    echo ""
    echo "Arguments:"
    echo "  endpoint    Endpoint key to test (default: $DEFAULT_ENDPOINT)"
    echo "  test-suite  Test suite to run (default: $DEFAULT_TEST_SUITE)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run default endpoint with default test suite"
    echo "  $0 users-me                           # Run users-me endpoint with default test suite"
    echo "  $0 users-me smoke                     # Run users-me endpoint with smoke test"
    echo "  $0 client-configs stress              # Run client-configs endpoint with stress test"
    echo "  $0 health-check endurance             # Run health-check endpoint with endurance test"
    echo ""
    echo "Available endpoints:"
    echo "  users-me         - Get Current User"
    echo "  client-configs   - Get Client Configurations"
    echo "  health-check     - Health Check"
    echo "  create-user      - Create User"
    echo "  update-user      - Update User"
    echo ""
    echo "Available test suites:"
    echo "  smoke      - Quick validation (1 user, 10s)"
    echo "  load       - Normal load (50 users, 2m)"
    echo "  stress     - Find breaking points (ramp up to 200 users)"
    echo "  spike      - Sudden load spikes"
    echo "  endurance  - Long duration (25 users, 30m)"
    echo "  soak       - Extended testing (10 users, 2h)"
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

# Function to list available endpoints
list_endpoints() {
    print_status "Available endpoints:"
    echo "  users-me         - Get Current User"
    echo "  client-configs   - Get Client Configurations"
    echo "  health-check     - Health Check"
    echo "  create-user      - Create User"
    echo "  update-user      - Update User"
    echo ""
}

# Function to list available test suites
list_test_suites() {
    print_status "Available test suites:"
    echo "  smoke      - Quick validation (1 user, 10s)"
    echo "  load       - Normal load (50 users, 2m)"
    echo "  stress     - Find breaking points (ramp up to 200 users)"
    echo "  spike      - Sudden load spikes"
    echo "  endurance  - Long duration (25 users, 30m)"
    echo "  soak       - Extended testing (10 users, 2h)"
    echo ""
}

# Function to validate endpoint
validate_endpoint() {
    local endpoint=$1
    case $endpoint in
        "users-me"|"client-configs"|"health-check"|"create-user"|"update-user")
            return 0
            ;;
        *)
            print_error "Invalid endpoint: $endpoint"
            list_endpoints
            exit 1
            ;;
    esac
}

# Function to validate test suite
validate_test_suite() {
    local test_suite=$1
    case $test_suite in
        "smoke"|"load"|"stress"|"spike"|"endurance"|"soak")
            return 0
            ;;
        *)
            print_error "Invalid test suite: $test_suite"
            list_test_suites
            exit 1
            ;;
    esac
}

# Function to check authentication requirements
check_auth_requirements() {
    local endpoint=$1
    
    case $endpoint in
        "users-me"|"create-user"|"update-user")
            if [ -z "$AUTH_TOKEN" ]; then
                print_warning "This endpoint requires authentication but AUTH_TOKEN is not set."
                echo "Set the AUTH_TOKEN environment variable before running the test:"
                echo "  export AUTH_TOKEN='your-jwt-token-here'"
                echo "  $0 $endpoint $test_suite"
                echo ""
                print_warning "Continuing without authentication (test may fail)..."
            else
                print_success "Authentication token found"
            fi
            ;;
        *)
            print_status "No authentication required for this endpoint"
            ;;
    esac
}

# Function to run the test
run_test() {
    local endpoint=$1
    local test_suite=$2
    
    print_status "Starting $test_suite test for endpoint: $endpoint"
    echo ""
    
    # Set environment variables for the test
    export ENDPOINT=$endpoint
    export TEST_SUITE=$test_suite
    
    # Run k6 with the endpoint test script
    k6 run \
        --env ENDPOINT=$endpoint \
        --env TEST_SUITE=$test_suite \
        scripts/endpoint-test.js
    
    print_success "Test completed successfully!"
}

# Main script logic
main() {
    # Check if k6 is installed
    check_k6
    
    # Parse command line arguments
    ENDPOINT=${1:-$DEFAULT_ENDPOINT}
    TEST_SUITE=${2:-$DEFAULT_TEST_SUITE}
    
    # Show help if requested
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi
    
    # Validate arguments
    validate_endpoint $ENDPOINT
    validate_test_suite $TEST_SUITE
    
    # Check authentication requirements
    check_auth_requirements $ENDPOINT
    
    # Display test configuration
    echo ""
    print_status "Test Configuration:"
    echo "  Endpoint:   $ENDPOINT"
    echo "  Test Suite: $TEST_SUITE"
    echo "  Script:     scripts/endpoint-test.js"
    echo ""
    
    # Confirm before running (for long-running tests)
    if [ "$TEST_SUITE" = "endurance" ] || [ "$TEST_SUITE" = "soak" ]; then
        echo -n "This test will run for a long time. Continue? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_status "Test cancelled by user"
            exit 0
        fi
    fi
    
    # Run the test
    run_test $ENDPOINT $TEST_SUITE
}

# Run main function with all arguments
main "$@"
