#!/bin/bash

# File: /home/com2u/src/OrganAIzer/scripts/docker-aware-healthcheck.sh
# Purpose: Docker-aware health check script that handles both host and container networking
# Automatically detects environment and uses appropriate connection methods

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

LOG_FILE="docker-aware-health-check.log"

# Initialize log file
echo "=== Docker-Aware Health Check - $(date) ===" > "$LOG_FILE"
echo "" >> "$LOG_FILE"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "[SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $1" >> "$LOG_FILE"
}

log_section() {
    echo -e "${CYAN}=== $1 ===${NC}"
    echo "=== $1 ===" >> "$LOG_FILE"
}

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    log_error ".env file not found!"
    exit 1
fi

# Detect environment
detect_environment() {
    log_section "ENVIRONMENT DETECTION"
    
    # Check if we're inside a Docker container
    if [ -f /.dockerenv ]; then
        ENVIRONMENT="docker_container"
        log_info "Running inside Docker container"
    elif command -v docker &> /dev/null && docker ps &> /dev/null 2>&1; then
        ENVIRONMENT="docker_host"
        log_info "Running on Docker host with Docker available"
    else
        ENVIRONMENT="native_host"
        log_info "Running on native host (no Docker)"
    fi
    
    echo "Environment: $ENVIRONMENT" >> "$LOG_FILE"
}

# Check Docker container status
check_docker_containers() {
    log_section "DOCKER CONTAINER STATUS"
    
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null 2>&1; then
            log_info "Docker containers status:"
            
            # Get container status
            containers=$(docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|hasura|organaizer)" || echo "")
            
            if [ -n "$containers" ]; then
                echo "$containers"
                echo "$containers" >> "$LOG_FILE"
                
                # Check individual container health
                for container in organaizer_postgres organaizer_hasura organaizer_backend organaizer_frontend; do
                    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
                        status=$(docker ps --format "{{.Names}}\t{{.Status}}" | grep "^${container}" | cut -f2)
                        if echo "$status" | grep -q "healthy"; then
                            log_success "$container is healthy"
                        elif echo "$status" | grep -q "unhealthy"; then
                            log_error "$container is unhealthy"
                        elif echo "$status" | grep -q "starting"; then
                            log_warning "$container is starting"
                        else
                            log_info "$container status: $status"
                        fi
                    else
                        log_warning "$container not found"
                    fi
                done
            else
                log_warning "No OrganAIzer containers found"
            fi
        else
            log_error "Cannot access Docker daemon"
        fi
    else
        log_warning "Docker not available"
    fi
}

# Test network connectivity with multiple approaches
test_network_connectivity() {
    local service=$1
    local docker_hostname=$2
    local host_port=$3
    local path=${4:-""}
    
    log_info "Testing $service connectivity..."
    
    local success=false
    
    # Method 1: Test Docker internal hostname (if in Docker environment)
    if [ "$ENVIRONMENT" = "docker_container" ]; then
        log_info "  Testing Docker internal: $docker_hostname:$host_port$path"
        if timeout 5s bash -c "</dev/tcp/$docker_hostname/$host_port" 2>/dev/null; then
            log_success "  Docker internal connection successful"
            success=true
        else
            log_warning "  Docker internal connection failed"
        fi
    fi
    
    # Method 2: Test localhost (host networking)
    log_info "  Testing localhost: localhost:$host_port$path"
    if timeout 5s bash -c "</dev/tcp/localhost/$host_port" 2>/dev/null; then
        log_success "  Localhost connection successful"
        success=true
    else
        log_warning "  Localhost connection failed"
    fi
    
    # Method 3: Test 127.0.0.1
    log_info "  Testing 127.0.0.1: 127.0.0.1:$host_port$path"
    if timeout 5s bash -c "</dev/tcp/127.0.0.1/$host_port" 2>/dev/null; then
        log_success "  127.0.0.1 connection successful"
        success=true
    else
        log_warning "  127.0.0.1 connection failed"
    fi
    
    # Method 4: Check if port is bound (using lsof if available)
    if command -v lsof &> /dev/null; then
        if lsof -i ":$host_port" &> /dev/null; then
            log_info "  Port $host_port is bound by a process"
            success=true
        else
            log_warning "  Port $host_port is not bound"
        fi
    fi
    
    if [ "$success" = true ]; then
        log_success "$service is accessible"
        return 0
    else
        log_error "$service is not accessible"
        return 1
    fi
}

# Test HTTP endpoint with multiple URLs
test_http_endpoint_multi() {
    local service=$1
    local docker_hostname=$2
    local host_port=$3
    local path=$4
    local expected_status=${5:-200}
    
    log_info "Testing $service HTTP endpoint..."
    
    local urls=(
        "http://localhost:$host_port$path"
        "http://127.0.0.1:$host_port$path"
    )
    
    # Add Docker internal URL if in container
    if [ "$ENVIRONMENT" = "docker_container" ]; then
        urls=("http://$docker_hostname:$host_port$path" "${urls[@]}")
    fi
    
    for url in "${urls[@]}"; do
        log_info "  Testing: $url"
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" 2>/dev/null || echo "HTTPSTATUS:000")
        http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        
        if [ "$http_status" = "$expected_status" ]; then
            log_success "  $service HTTP endpoint successful (HTTP $http_status)"
            echo "  Response from $url: HTTP $http_status" >> "$LOG_FILE"
            return 0
        else
            log_warning "  $service HTTP endpoint failed (HTTP $http_status) for $url"
            echo "  Failed response from $url: HTTP $http_status" >> "$LOG_FILE"
        fi
    done
    
    log_error "$service HTTP endpoint failed on all URLs"
    return 1
}

# Main health check execution
main() {
    log_section "DOCKER-AWARE HEALTH CHECK"
    echo ""
    
    # Detect environment
    detect_environment
    echo ""
    
    # Check Docker containers
    check_docker_containers
    echo ""
    
    # Test PostgreSQL
    log_section "POSTGRESQL CONNECTIVITY"
    test_network_connectivity "PostgreSQL" "postgres" "5432"
    
    # Test PostgreSQL connection if possible
    if command -v psql &> /dev/null; then
        log_info "Testing PostgreSQL database connection..."
        
        # Try different hostnames based on environment
        postgres_hosts=("localhost")
        if [ "$ENVIRONMENT" = "docker_container" ]; then
            postgres_hosts=("postgres" "localhost")
        fi
        
        for host in "${postgres_hosts[@]}"; do
            log_info "  Testing PostgreSQL connection to $host..."
            if PGPASSWORD="$POSTGRES_PASSWORD" timeout 10s psql -h "$host" -p "5432" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" &> /dev/null; then
                log_success "  PostgreSQL connection successful to $host"
                break
            else
                log_warning "  PostgreSQL connection failed to $host"
            fi
        done
    else
        log_warning "psql not available - skipping database connection test"
    fi
    echo ""
    
    # Test Hasura
    log_section "HASURA CONNECTIVITY"
    test_network_connectivity "Hasura" "hasura" "8080"
    test_http_endpoint_multi "Hasura" "hasura" "8080" "/healthz"
    test_http_endpoint_multi "Hasura Console" "hasura" "8080" "/console" "200"
    echo ""
    
    # Test Backend
    log_section "BACKEND CONNECTIVITY"
    test_network_connectivity "Backend" "backend" "3001"
    test_http_endpoint_multi "Backend Health" "backend" "3001" "/health"
    test_http_endpoint_multi "Backend API Health" "backend" "3001" "/api/health"
    echo ""
    
    # Test Frontend
    log_section "FRONTEND CONNECTIVITY"
    test_network_connectivity "Frontend" "frontend" "3000"
    test_http_endpoint_multi "Frontend" "frontend" "3000" "/"
    
    # Also check port 3003 as mentioned in logs
    if test_network_connectivity "Frontend (alt port)" "frontend" "3003"; then
        test_http_endpoint_multi "Frontend (alt port)" "frontend" "3003" "/"
    fi
    echo ""
    
    # Summary
    log_section "HEALTH CHECK SUMMARY"
    
    success_count=$(grep -c "\[SUCCESS\]" "$LOG_FILE" || echo "0")
    error_count=$(grep -c "\[ERROR\]" "$LOG_FILE" || echo "0")
    warning_count=$(grep -c "\[WARNING\]" "$LOG_FILE" || echo "0")
    
    log_info "Results: $success_count successes, $warning_count warnings, $error_count errors"
    log_info "Environment: $ENVIRONMENT"
    
    if [ "$error_count" -eq 0 ]; then
        log_success "All services are accessible!"
        exit 0
    elif [ "$error_count" -le 3 ]; then
        log_warning "Some services have connectivity issues"
        exit 1
    else
        log_error "Multiple critical connectivity issues detected"
        exit 2
    fi
}

# Run main function
main "$@"
