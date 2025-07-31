#!/bin/bash
# File: /home/com2u/src/OrganAIzer/scripts/clean.sh
# Purpose: Clean up Docker volumes and containers for OrganAIzer

set -e

echo "🧹 Cleaning up OrganAIzer Docker resources..."

# Stop all services first
echo "📋 Stopping services..."
docker-compose down

# Remove containers, networks, and volumes
echo "🗑️  Removing containers, networks, and volumes..."
docker-compose down --volumes --remove-orphans

# Remove images (optional - uncomment if needed)
# echo "🖼️  Removing images..."
# docker-compose down --rmi all

# Prune unused Docker resources
echo "🔄 Pruning unused Docker resources..."
docker system prune -f

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "⚠️  Note: All data in PostgreSQL has been removed."
echo "💡 To start fresh: ./scripts/start.sh"
