#!/bin/bash

# Production Setup Script for RAG API
echo "🚀 Setting up RAG API for production deployment..."

# Create necessary directories
mkdir -p uploads data logs

# Set permissions
chmod 755 uploads data logs

# Create production environment file
cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Ollama Configuration
OLLAMA_BASE_URL=http://ollama:11434
EMBEDDING_MODEL=nomic-embed-text
CHAT_MODEL=llama3.2:3b

# ChromaDB Configuration
CHROMA_URL=http://chromadb:8000
COLLECTION_NAME=specialist-agent

# Conversation Context Configuration
CONTEXT_WINDOW_LENGTH=10
CONTEXT_MAX_TOKENS=4000

# Security Configuration
ALLOWED_ORIGINS=*
CORS_ENABLED=true

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
EOF

echo "✅ Production environment file created"

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t rag-api:latest .

echo "✅ Production setup complete!"
echo ""
echo "To start the services:"
echo "  docker-compose up -d"
echo ""
echo "To check logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
