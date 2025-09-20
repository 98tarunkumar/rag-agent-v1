# RAG API Deployment Guide

A comprehensive guide to deploy your RAG-based specialist agent API on free hosting platforms with Ollama integration.

## 🚀 Free Hosting Options

### 1. Railway (Recommended)
- **Free Tier**: $5 credit monthly (enough for small projects)
- **Pros**: Easy deployment, built-in databases, good for Node.js
- **Cons**: Limited free credits

### 2. Render
- **Free Tier**: 750 hours/month, sleeps after 15min inactivity
- **Pros**: Good for development, easy setup
- **Cons**: Cold starts, limited resources

### 3. Fly.io
- **Free Tier**: 3 shared-cpu-1x VMs, 256MB RAM each
- **Pros**: Good performance, global deployment
- **Cons**: Complex setup, limited resources

### 4. Heroku (Alternative)
- **Free Tier**: Discontinued, but paid plans available
- **Pros**: Easy deployment, add-ons
- **Cons**: No longer free

## 📋 Prerequisites

- GitHub account
- Docker installed locally
- Ollama models downloaded
- Basic knowledge of Docker and deployment

---

## 🐳 Docker Setup

### 1. Create Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install system dependencies for Ollama and ChromaDB
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    wget \
    git \
    build-base

# Install ChromaDB
RUN pip3 install chromadb

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start script
CMD ["npm", "start"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  rag-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OLLAMA_BASE_URL=http://ollama:11434
      - EMBEDDING_MODEL=nomic-embed-text
      - CHAT_MODEL=llama3.2:3b
      - CHROMA_URL=http://chromadb:8000
      - COLLECTION_NAME=specialist-agent
      - CONTEXT_WINDOW_LENGTH=10
      - CONTEXT_MAX_TOKENS=4000
    depends_on:
      - ollama
      - chromadb
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    restart: unless-stopped

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chromadb_data:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000
    restart: unless-stopped

volumes:
  ollama_data:
  chromadb_data:
```

### 3. Create .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## 🚀 Railway Deployment

### 1. Prepare for Railway

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Set Environment Variables**:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set OLLAMA_BASE_URL=http://ollama:11434
   railway variables set EMBEDDING_MODEL=nomic-embed-text
   railway variables set CHAT_MODEL=llama3.2:3b
   railway variables set CHROMA_URL=http://chromadb:8000
   railway variables set COLLECTION_NAME=specialist-agent
   railway variables set CONTEXT_WINDOW_LENGTH=10
   railway variables set CONTEXT_MAX_TOKENS=4000
   ```

---

## 🌐 Render Deployment

### 1. Create render.yaml

```yaml
services:
  - type: web
    name: rag-api
    env: docker
    dockerfilePath: ./Dockerfile
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: OLLAMA_BASE_URL
        value: http://ollama:11434
      - key: EMBEDDING_MODEL
        value: nomic-embed-text
      - key: CHAT_MODEL
        value: llama3.2:3b
      - key: CHROMA_URL
        value: http://chromadb:8000
      - key: COLLECTION_NAME
        value: specialist-agent
      - key: CONTEXT_WINDOW_LENGTH
        value: 10
      - key: CONTEXT_MAX_TOKENS
        value: 4000
```

### 2. Deploy to Render

1. **Connect GitHub Repository**
2. **Select Docker deployment**
3. **Configure environment variables**
4. **Deploy**

---

## 🪟 Fly.io Deployment

### 1. Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux/Windows
curl -L https://fly.io/install.sh | sh
```

### 2. Create fly.toml

```toml
app = "rag-api"
primary_region = "sjc"

[build]

[env]
  NODE_ENV = "production"
  PORT = "3000"
  OLLAMA_BASE_URL = "http://ollama:11434"
  EMBEDDING_MODEL = "nomic-embed-text"
  CHAT_MODEL = "llama3.2:3b"
  CHROMA_URL = "http://chromadb:8000"
  COLLECTION_NAME = "specialist-agent"
  CONTEXT_WINDOW_LENGTH = "10"
  CONTEXT_MAX_TOKENS = "4000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1
```

### 3. Deploy to Fly.io

```bash
# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

---

## 🔧 Ollama Setup on Server

### 1. Install Ollama on Server

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve
```

### 2. Download Required Models

```bash
# Download embedding model
ollama pull nomic-embed-text

# Download chat model
ollama pull llama3.2:3b

# Verify models
ollama list
```

### 3. Configure Ollama for Production

Create `/etc/systemd/system/ollama.service`:

```ini
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"

[Install]
WantedBy=default.target
```

Enable and start:
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

---

## 🗄️ Database Setup

### Option 1: ChromaDB (Recommended)

```bash
# Install ChromaDB
pip3 install chromadb

# Start ChromaDB server
chroma run --host 0.0.0.0 --port 8000
```

### Option 2: PostgreSQL + pgvector

```bash
# Install PostgreSQL with pgvector
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rag_db \
  -p 5432:5432 \
  -d pgvector/pgvector:pg15
```

---

## 🔒 Security Considerations

### 1. Environment Variables

Never commit sensitive data to version control:

```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. API Rate Limiting

Add rate limiting to your API:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

---

## 📊 Monitoring and Logging

### 1. Health Checks

Your API already includes health checks at `/api/health`.

### 2. Logging

Add structured logging:

```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Ollama models downloaded
- [ ] Database configured
- [ ] Security measures implemented
- [ ] Monitoring set up
- [ ] Health checks working
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] SSL/HTTPS enabled
- [ ] Domain configured
- [ ] Backup strategy in place

---

## 🔧 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Check if Ollama is running
   - Verify OLLAMA_BASE_URL
   - Check firewall settings

2. **ChromaDB Connection Failed**
   - Verify CHROMA_URL
   - Check if ChromaDB is running
   - Verify network connectivity

3. **Memory Issues**
   - Increase server memory
   - Optimize chunk sizes
   - Implement pagination

4. **Model Loading Issues**
   - Check available disk space
   - Verify model names
   - Check Ollama logs

### Debug Commands

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check ChromaDB status
curl http://localhost:8000/api/v1/heartbeat

# Check API health
curl http://localhost:3000/api/health

# View logs
docker logs <container_name>
```

---

## 📈 Performance Optimization

### 1. Model Optimization

```bash
# Use quantized models for better performance
ollama pull llama3.2:3b-q4_K_M
ollama pull nomic-embed-text:latest
```

### 2. Caching

Implement Redis caching for frequently accessed data:

```bash
npm install redis
```

### 3. Load Balancing

Use multiple Ollama instances for better performance:

```yaml
# docker-compose.yml
services:
  ollama1:
    image: ollama/ollama:latest
    # ... configuration
  
  ollama2:
    image: ollama/ollama:latest
    # ... configuration
```

---

## 🎯 Next Steps

1. **Choose a hosting platform** based on your needs
2. **Set up Docker** configuration
3. **Deploy your application**
4. **Configure Ollama** and download models
5. **Set up monitoring** and logging
6. **Test thoroughly** before going live
7. **Implement security** measures
8. **Monitor performance** and optimize

---

*This guide provides a comprehensive approach to deploying your RAG API with Ollama integration. Choose the platform that best fits your needs and budget.*
