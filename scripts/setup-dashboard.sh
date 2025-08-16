#!/bin/bash

# Script to set up InfluxDB + Grafana dashboard for k6
# Usage: ./setup-dashboard.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to create docker-compose file
create_docker_compose() {
    print_status "Creating docker-compose.yml for InfluxDB + Grafana..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  influxdb:
    image: influxdb:1.8
    container_name: influxdb
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6
    volumes:
      - influxdb_data:/var/lib/influxdb
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-dashboard.json:/etc/grafana/provisioning/dashboards/k6-dashboard.json
    depends_on:
      - influxdb
    restart: unless-stopped

volumes:
  influxdb_data:
  grafana_data:
EOF

    print_success "docker-compose.yml created"
}

# Function to start services
start_services() {
    print_status "Starting InfluxDB and Grafana services..."
    
    # Stop existing containers if running
    docker-compose down 2>/dev/null || true
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for InfluxDB
    print_status "Waiting for InfluxDB..."
    until curl -s http://localhost:8086/ping &> /dev/null; do
        sleep 2
    done
    print_success "InfluxDB is ready"
    
    # Wait for Grafana
    print_status "Waiting for Grafana..."
    until curl -s http://localhost:3000/api/health &> /dev/null; do
        sleep 2
    done
    print_success "Grafana is ready"
}

# Function to setup InfluxDB database
setup_influxdb() {
    print_status "Setting up InfluxDB database..."
    
    # Create k6 database
    docker exec influxdb influx -execute 'CREATE DATABASE k6' 2>/dev/null || true
    
    print_success "InfluxDB database 'k6' created"
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_success "🎉 Dashboard setup complete!"
    echo ""
    echo "📊 Access your dashboards:"
    echo "  Grafana:     http://localhost:3000 (admin/admin)"
    echo "  InfluxDB:    http://localhost:8086"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Open Grafana: http://localhost:3000"
    echo "  2. Login with: admin / admin"
    echo "  3. Add InfluxDB data source:"
    echo "     - Type: InfluxDB"
    echo "     - URL: http://influxdb:8086"
    echo "     - Database: k6"
    echo "  4. Import dashboard from: grafana-dashboard.json"
    echo ""
    echo "🧪 Run a test with InfluxDB output:"
    echo "  ./scripts/run-with-influxdb.sh health-check load"
    echo ""
    echo "📋 Useful commands:"
    echo "  # View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "  # Stop services:"
    echo "  docker-compose down"
    echo ""
    echo "  # Restart services:"
    echo "  docker-compose restart"
}

# Function to show current status
show_status() {
    echo ""
    print_status "Current service status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "  InfluxDB: http://localhost:8086"
    echo "  Grafana:  http://localhost:3000"
}

# Function to show logs
show_logs() {
    echo ""
    print_status "Recent logs:"
    docker-compose logs --tail=20
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Set up InfluxDB + Grafana (default)"
    echo "  status    - Show current service status"
    echo "  logs      - Show recent logs"
    echo "  stop      - Stop all services"
    echo "  start     - Start all services"
    echo "  restart   - Restart all services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Set up and start services"
    echo "  $0 status       # Show service status"
    echo "  $0 logs         # Show recent logs"
    echo "  $0 stop         # Stop all services"
}

# Main function
main() {
    case "${1:-setup}" in
        "setup")
            check_docker
            create_docker_compose
            start_services
            wait_for_services
            setup_influxdb
            show_next_steps
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "stop")
            print_status "Stopping services..."
            docker-compose down
            print_success "Services stopped"
            ;;
        "start")
            print_status "Starting services..."
            docker-compose up -d
            print_success "Services started"
            ;;
        "restart")
            print_status "Restarting services..."
            docker-compose restart
            print_success "Services restarted"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
