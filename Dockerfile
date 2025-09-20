# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install system dependencies for Ollama and ChromaDB
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    wget \
    git \
    build-base \
    bash

# Install ChromaDB
RUN pip3 install chromadb

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads data

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start script
CMD ["npm", "start"]
