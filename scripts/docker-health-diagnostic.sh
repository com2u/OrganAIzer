#!/bin/bash

# File: /home/com2u/src/OrganAIzer/scripts/docker-health-diagnostic.sh
# Purpose: Comprehensive diagnostic for Docker health check failures
# Analyzes the exact failure sequence and root causes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

LOG_FILE="docker-health-diagnostic.log"

# Initialize log file
echo "=== Docker Health Check Diagnostic - $(date) ===" > "$LOG_FILE"
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

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    echo "[CRITICAL] $1" >> "$LOG_FILE"
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

log_section "DOCKER HEALTH CHECK DIAGNOSTIC"
echo ""

# 1. Analyze Docker Compose Configuration
log_section "1. DOCKER COMPOSE HEALTH CHECK ANALYSIS"
log_info "Examining docker-compose.yml health check configuration..."

# Extract health check from docker-compose.yml
backend_healthcheck=$(grep -A 5 "backend:" docker-compose.yml | grep -A 3 "healthcheck:" | grep "test:" | sed 's/.*test: \[//' | sed 's/\].*//')
log_info "Docker Compose health check command: $backend_healthcheck"

if echo "$backend_healthcheck" | grep -q "/health"; then
    log_critical "MISMATCH DETECTED: Docker Compose uses '/health' endpoint"
else
    log_success "Docker Compose health check endpoint looks correct"
fi

# 2. Analyze Dockerfile Configuration  
log_section "2. DOCKERFILE HEALTH CHECK ANALYSIS"
log_info "Examining backend/Dockerfile health check configuration..."

dockerfile_healthcheck=$(grep "HEALTHCHECK" backend/Dockerfile | sed 's/.*CMD //')
log_info "Dockerfile health check command: $dockerfile_healthcheck"

if echo "$dockerfile_healthcheck" | grep -q "healthcheck.js"; then
    log_success "Dockerfile uses healthcheck.js script"
else
    log_warning "Dockerfile health check configuration unclear"
fi

# 3. Test Health Check Script Outside Docker
log_section "3. TESTING HEALTH CHECK SCRIPT (STANDALONE)"
log_info "Testing backend/healthcheck.js outside of Docker..."

if [ -f "backend/healthcheck.js" ]; then
    log_info "Health check script exists"
    
    # Check if backend is running
    if lsof -i :3001 &> /dev/null; then
        log_info "Backend is running on port 3001, testing health check script..."
        
        cd backend
        if timeout 10s node healthcheck.js; then
            log_success "Health check script works outside Docker"
        else
            log_error "Health check script fails outside Docker"
        fi
        cd ..
    else
        log_warning "Backend not running on port 3001, cannot test health check script"
    fi
else
    log_error "Health check script backend/healthcheck.js not found"
fi

# 4. Test Docker Compose Health Check Command
log_section "4. TESTING DOCKER COMPOSE HEALTH CHECK COMMAND"
log_info "Testing the exact command used by Docker Compose..."

if lsof -i :3001 &> /dev/null; then
    log_info "Testing: curl -f http://localhost:3001/health"
    
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_success "Docker Compose health check command works"
    else
        log_error "Docker Compose health check command FAILS"
        log_info "Testing alternative: curl -f http://localhost:3001/api/health"
        
        if curl -f http://localhost:3001/api/health &> /dev/null; then
            log_critical "CONFIRMED: Backend serves /api/health, not /health"
            log_critical "Docker Compose configuration is INCORRECT"
        else
            log_error "Both /health and /api/health endpoints fail"
        fi
    fi
else
    log_warning "Backend not running, cannot test health check endpoints"
fi

# 5. Analyze Backend Server Routes
log_section "5. BACKEND SERVER ROUTE ANALYSIS"
log_info "Analyzing backend server.js for health check routes..."

if [ -f "backend/server.js" ]; then
    if grep -q "/health" backend/server.js; then
        health_routes=$(grep -n "/health" backend/server.js)
        log_info "Health routes found in server.js:"
        echo "$health_routes" | while read line; do
            log_info "  $line"
            echo "  $line" >> "$LOG_FILE"
        done
    else
        log_warning "No /health routes found in backend/server.js"
    fi
    
    if grep -q "/api/health" backend/server.js; then
        api_health_routes=$(grep -n "/api/health" backend/server.js)
        log_info "API health routes found in server.js:"
        echo "$api_health_routes" | while read line; do
            log_info "  $line"
            echo "  $line" >> "$LOG_FILE"
        done
    else
        log_warning "No /api/health routes found in backend/server.js"
    fi
else
    log_error "backend/server.js not found"
fi

# 6. Check Docker Container Logs
log_section "6. DOCKER CONTAINER LOG ANALYSIS"
log_info "Checking for existing Docker containers and their logs..."

if command -v docker &> /dev/null; then
    if docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -q "organaizer_backend"; then
        log_info "Found organaizer_backend container, checking logs..."
        
        # Get last 20 lines of container logs
        backend_logs=$(docker logs --tail 20 organaizer_backend 2>&1 || echo "Failed to get logs")
        log_info "Recent backend container logs:"
        echo "$backend_logs" | while read line; do
            echo "  $line" >> "$LOG_FILE"
        done
        
        # Check for health check failures
        if echo "$backend_logs" | grep -q "health"; then
            log_info "Health check related logs found in container"
        else
            log_warning "No health check related logs found in container"
        fi
    else
        log_info "No organaizer_backend container found"
    fi
else
    log_warning "Docker not available for log analysis"
fi

# 7. Environment Variable Analysis
log_section "7. ENVIRONMENT VARIABLE ANALYSIS"
log_info "Checking environment variables that affect health checks..."

log_info "PORT: ${PORT:-'not set'}"
log_info "NODE_ENV: ${NODE_ENV:-'not set'}"
log_info "REACT_APP_BACKEND_URL: ${REACT_APP_BACKEND_URL:-'not set'}"

# 8. Network Analysis
log_section "8. NETWORK CONNECTIVITY ANALYSIS"
log_info "Testing network connectivity for health checks..."

if lsof -i :3001 &> /dev/null; then
    log_info "Port 3001 is open"
    
    # Test different localhost variations
    for host in "localhost" "127.0.0.1" "0.0.0.0"; do
        log_info "Testing connectivity to $host:3001..."
        if timeout 3s bash -c "</dev/tcp/$host/3001" &> /dev/null; then
            log_success "Can connect to $host:3001"
        else
            log_warning "Cannot connect to $host:3001"
        fi
    done
else
    log_error "Port 3001 is not open"
fi

# 9. Summary and Recommendations
log_section "9. DIAGNOSTIC SUMMARY AND RECOMMENDATIONS"

echo ""
log_info "=== ROOT CAUSE ANALYSIS ==="

# Count critical issues
critical_count=$(grep -c "\[CRITICAL\]" "$LOG_FILE" || echo "0")
error_count=$(grep -c "\[ERROR\]" "$LOG_FILE" || echo "0")

if [ "$critical_count" -gt 0 ]; then
    log_critical "CRITICAL ISSUES DETECTED ($critical_count)"
    log_info "Most likely cause: Configuration mismatch between Docker Compose and actual backend endpoints"
fi

if [ "$error_count" -gt 0 ]; then
    log_error "ERRORS DETECTED ($error_count)"
fi

log_info "=== RECOMMENDED ACTIONS ==="
log_info "1. Fix Docker Compose health check endpoint mismatch"
log_info "2. Ensure backend serves the correct health check endpoint"
log_info "3. Test health check outside Docker before containerizing"
log_info "4. Add comprehensive logging to health check script"

echo ""
log_info "Detailed diagnostic results saved to: $LOG_FILE"
echo ""

# Exit with appropriate code
if [ "$critical_count" -gt 0 ]; then
    exit 2
elif [ "$error_count" -gt 0 ]; then
    exit 1
else
    exit 0
fi
