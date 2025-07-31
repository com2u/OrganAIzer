#!/bin/bash
# File: /home/com2u/src/OrganAIzer/scripts/start.sh
# Purpose: Start all OrganAIzer services using Docker Compose

set -e

echo "🚀 Starting OrganAIzer services..."

# Stop any existing services
echo "📋 Stopping existing services..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "✅ OrganAIzer services started successfully!"
echo ""
echo "🌐 Access points:"
echo "   - Frontend:        http://localhost:3000"
echo "   - Backend API:     http://localhost:3001"
echo "   - Hasura Console:  http://localhost:8080"
echo "   - PostgreSQL:      localhost:5432"
echo ""
echo "🔑 Hasura Admin Secret: AAABBBCCCDDD000111222"
echo "🗄️  Database User: comu2"
echo ""
echo "📝 To view logs: docker-compose logs -f [service_name]"
echo "🛑 To stop: ./scripts/stop.sh"
