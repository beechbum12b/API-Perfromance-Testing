#!/bin/bash

# Script to run k6 tests with InfluxDB output for Docker containers
# Usage: ./run-with-influxdb.sh [endpoint] [test-suite] [influxdb-url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_ENDPOINT="health-check"
DEFAULT_TEST_SUITE="load"
DEFAULT_INFLUXDB_URL="http://localhost:8086/k6"

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
    echo "Usage: $0 [endpoint] [test-suite] [influxdb-url]"
    echo ""
    echo "Arguments:"
    echo "  endpoint      Endpoint key to test (default: $DEFAULT_ENDPOINT)"
    echo "  test-suite    Test suite to run (default: $DEFAULT_TEST_SUITE)"
    echo "  influxdb-url  InfluxDB URL (default: $DEFAULT_INFLUXDB_URL)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run health-check with load test + InfluxDB"
    echo "  $0 users-me                           # Run users-me with default test suite + InfluxDB"
    echo "  $0 health-check stress                # Run health-check with stress test + InfluxDB"
    echo "  $0 client-configs load http://localhost:8086/k6  # Custom InfluxDB URL"
    echo ""
    echo "Docker InfluxDB Setup:"
    echo "  # Start InfluxDB container"
    echo "  docker run -d --name influxdb -p 8086:8086 influxdb:1.8"
    echo ""
    echo "  # Create database"
    echo "  docker exec -it influxdb influx -execute 'CREATE DATABASE k6'"
    echo ""
    echo "  # View results"
    echo "  docker exec -it influxdb influx -database k6 -execute 'SHOW MEASUREMENTS'"
    echo "  docker exec -it influxdb influx -database k6 -execute 'SELECT * FROM http_req_duration LIMIT 10'"
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

# Function to check Docker and InfluxDB
check_docker_influxdb() {
    local influxdb_url=$1
    
    print_status "Checking Docker and InfluxDB setup..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if InfluxDB container is running
    if ! docker ps | grep -q influxdb; then
        print_warning "InfluxDB container not found. You may need to start it:"
        echo ""
        echo "  # Start InfluxDB container:"
        echo "  docker run -d --name influxdb -p 8086:8086 influxdb:1.8"
        echo ""
        echo "  # Create database:"
        echo "  docker exec -it influxdb influx -execute 'CREATE DATABASE k6'"
        echo ""
        echo "  # Then run this script again"
        echo ""
        read -p "Continue anyway? (y/N): " -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_status "Exiting. Please start InfluxDB container first."
            exit 0
        fi
    else
        print_success "InfluxDB container found"
        
        # Check if we can connect to InfluxDB
        if curl -s "$influxdb_url/ping" &> /dev/null; then
            print_success "InfluxDB is accessible at $influxdb_url"
        else
            print_warning "Cannot ping InfluxDB at $influxdb_url"
            print_warning "Make sure the container is running and port 8086 is accessible"
        fi
    fi
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
            echo ""
            echo "Available endpoints:"
            echo "  health-check   - Health Check"
            echo "  users-me       - Get Current User"
            echo "  client-configs - Get Client Configurations"
            echo "  create-user    - Create User"
            echo "  update-user    - Update User"
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
            echo ""
            echo "Available test suites:"
            echo "  smoke      - Quick validation"
            echo "  load       - Normal load"
            echo "  stress     - Find breaking points"
            echo "  spike      - Sudden load spikes"
            echo "  endurance  - Long duration"
            echo "  soak       - Extended testing"
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

# Function to show InfluxDB query examples
show_influxdb_queries() {
    echo ""
    print_status "📊 InfluxDB Query Examples:"
    echo ""
    echo "  # Connect to InfluxDB container:"
    echo "  docker exec -it influxdb influx"
    echo ""
    echo "  # Use k6 database:"
    echo "  USE k6"
    echo ""
    echo "  # Show available measurements:"
    echo "  SHOW MEASUREMENTS"
    echo ""
    echo "  # Query response times:"
    echo "  SELECT * FROM http_req_duration WHERE time > now() - 10m"
    echo ""
    echo "  # Query error rates:"
    echo "  SELECT * FROM http_req_failed WHERE time > now() - 10m"
    echo ""
    echo "  # Query virtual users:"
    echo "  SELECT * FROM vus WHERE time > now() - 10m"
    echo ""
    echo "  # Query request rates:"
    echo "  SELECT * FROM http_reqs WHERE time > now() - 10m"
    echo ""
    echo "  # Query iteration duration:"
    echo "  SELECT * FROM iteration_duration WHERE time > now() - 10m"
}

# Function to run the test with InfluxDB
run_test_with_influxdb() {
    local endpoint=$1
    local test_suite=$2
    local influxdb_url=$3
    
    print_status "Starting $test_suite test for endpoint: $endpoint with InfluxDB output"
    echo ""
    print_status "📊 InfluxDB Output: $influxdb_url"
    print_status "🔗 Endpoint: $endpoint"
    print_status "🧪 Test Suite: $test_suite"
    echo ""
    print_status "Press Ctrl+C to stop the test"
    echo ""
    
    # Set environment variables for the test
    export ENDPOINT=$endpoint
    export TEST_SUITE=$test_suite
    
    # Run k6 with InfluxDB output
    k6 run \
        --out influxdb=$influxdb_url \
        --env ENDPOINT=$endpoint \
        --env TEST_SUITE=$test_suite \
        scripts/endpoint-test.js
    
    print_success "Test completed successfully!"
    echo ""
    show_influxdb_queries
}

# Main script logic
main() {
    # Check if k6 is installed
    check_k6
    
    # Parse command line arguments
    ENDPOINT=${1:-$DEFAULT_ENDPOINT}
    TEST_SUITE=${2:-$DEFAULT_TEST_SUITE}
    INFLUXDB_URL=${3:-$DEFAULT_INFLUXDB_URL}
    
    # Show help if requested
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi
    
    # Validate arguments
    validate_endpoint $ENDPOINT
    validate_test_suite $TEST_SUITE
    
    # Check Docker and InfluxDB setup
    check_docker_influxdb $INFLUXDB_URL
    
    # Check authentication requirements
    check_auth_requirements $ENDPOINT
    
    # Display test configuration
    echo ""
    print_status "Test Configuration:"
    echo "  Endpoint:     $ENDPOINT"
    echo "  Test Suite:   $TEST_SUITE"
    echo "  Script:       scripts/endpoint-test.js"
    echo "  InfluxDB:     $INFLUXDB_URL"
    echo ""
    
    # Confirm before running
    echo -n "Start test with InfluxDB output? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "Test cancelled by user"
        exit 0
    fi
    
    # Run the test with InfluxDB
    run_test_with_influxdb $ENDPOINT $TEST_SUITE $INFLUXDB_URL
}

# Run main function with all arguments
main "$@"
