#!/bin/bash
# File: /home/com2u/src/OrganAIzer/scripts/stop.sh
# Purpose: Stop all OrganAIzer services

set -e

echo "🛑 Stopping OrganAIzer services..."

# Stop all services
docker-compose down

# Remove orphaned containers
docker-compose down --remove-orphans

echo ""
echo "✅ All OrganAIzer services stopped successfully!"
echo ""
echo "💡 To start again: ./scripts/start.sh"
echo "🧹 To clean up volumes: ./scripts/clean.sh"
