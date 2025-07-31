#!/bin/bash
# File: /home/com2u/src/OrganAIzer/scripts/test-logo-in-docker.sh
# Purpose: Test script to verify organaizer.png is available in Docker container

echo "Testing OrganAIzer logo availability in Docker container..."

# Build the frontend Docker image
echo "Building frontend Docker image..."
cd frontend
docker build -t organaizer-frontend-test .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

# Test if organaizer.png exists in the container
echo "Testing if organaizer.png exists in container..."
docker run --rm organaizer-frontend-test ls -la /app/public/organaizer.png

if [ $? -eq 0 ]; then
    echo "✅ organaizer.png is available in Docker container"
else
    echo "❌ organaizer.png is NOT available in Docker container"
    exit 1
fi

# Test if the file is readable
echo "Testing file permissions..."
docker run --rm organaizer-frontend-test cat /app/public/organaizer.png > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ organaizer.png is readable in Docker container"
else
    echo "❌ organaizer.png is NOT readable in Docker container"
    exit 1
fi

# Clean up test image
docker rmi organaizer-frontend-test

echo "✅ All tests passed! OrganAIzer logo is properly available in Docker container."
