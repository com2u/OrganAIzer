# File: /home/com2u/src/OrganAIzer/frontend/Dockerfile
# Purpose: Docker configuration for React frontend service

# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application code
COPY . .
RUN chown -R nodejs:nodejs /app \
    && chmod -R 755 /app/public \
    && chmod 644 /app/public/*
USER nodejs
RUN chmod -R 755 /app/public

# Expose port
EXPOSE 3000

# Health check using wget (available in Alpine) - use 0.0.0.0 since React dev server binds to all interfaces
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:3000 || exit 1

# Start the development server
CMD ["npm", "start"]
