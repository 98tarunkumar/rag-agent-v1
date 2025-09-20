# 🚀 Quick Deployment Guide

This guide will help you deploy your RAG API with Ollama integration to various free hosting platforms.

## 📋 Prerequisites

- GitHub account
- Docker installed locally
- Basic knowledge of command line

## 🎯 Quick Start

### Option 1: Automated Deployment

```bash
# Run the deployment script
./scripts/deploy.sh
```

### Option 2: Manual Deployment

Choose your preferred platform below and follow the steps.

---

## 🐳 Local Development

### Start with Docker Compose

```bash
# Clone the repository
git clone <your-repo-url>
cd rag

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access Points:**
- API: http://localhost:3000
- Ollama: http://localhost:11434
- ChromaDB: http://localhost:8000

---

## 🚂 Railway Deployment (Recommended)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy
```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 3: Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set OLLAMA_BASE_URL=http://ollama:11434
railway variables set EMBEDDING_MODEL=nomic-embed-text
railway variables set CHAT_MODEL=llama3.2:3b
railway variables set CHROMA_URL=http://chromadb:8000
railway variables set COLLECTION_NAME=specialist-agent
```

**Benefits:**
- ✅ Easy deployment
- ✅ Built-in database support
- ✅ Automatic HTTPS
- ✅ $5 monthly credit

---

## 🎨 Render Deployment

### Step 1: Connect Repository
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select "Docker" as environment

### Step 2: Configure
- Use the provided `render.yaml` configuration
- Set environment variables in the dashboard

### Step 3: Deploy
- Click "Deploy" and wait for completion

**Benefits:**
- ✅ Free tier available
- ✅ Easy GitHub integration
- ✅ Automatic deployments

**Limitations:**
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Cold starts

---

## 🪟 Fly.io Deployment

### Step 1: Install Fly CLI
```bash
# macOS
brew install flyctl

# Linux/Windows
curl -L https://fly.io/install.sh | sh
```

### Step 2: Deploy
```bash
# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

**Benefits:**
- ✅ Good performance
- ✅ Global deployment
- ✅ 3 free VMs

---

## 🔧 Ollama Setup on Server

### Download Required Models

```bash
# Download embedding model
ollama pull nomic-embed-text

# Download chat model
ollama pull llama3.2:3b

# Verify models
ollama list
```

### Start Ollama Service

```bash
# Start Ollama
ollama serve

# Or run in background
nohup ollama serve > ollama.log 2>&1 &
```

---

## 🗄️ Database Setup

### ChromaDB (Recommended)

```bash
# Install ChromaDB
pip3 install chromadb

# Start server
chroma run --host 0.0.0.0 --port 8000
```

### Alternative: PostgreSQL + pgvector

```bash
# Using Docker
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rag_db \
  -p 5432:5432 \
  -d pgvector/pgvector:pg15
```

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl http://your-domain.com/api/health
```

### 2. Test Query
```bash
curl -X POST http://your-domain.com/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

### 3. Test File Upload
```bash
curl -X POST http://your-domain.com/api/ingest \
  -F "file=@test-document.pdf"
```

### 4. Test Conversation Context
```bash
# Create session
SESSION_ID=$(curl -s -X POST http://your-domain.com/api/conversation/start | jq -r '.sessionId')

# Query with context
curl -X POST http://your-domain.com/api/query \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Hello!\", \"sessionId\": \"$SESSION_ID\"}"
```

---

## 🔒 Security Checklist

- [ ] Environment variables set
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] HTTPS enabled
- [ ] File upload limits set
- [ ] Input validation enabled
- [ ] Error handling implemented

---

## 📊 Monitoring

### Health Endpoints
- `/api/health` - Basic health check
- `/api/conversation/config` - Context configuration

### Logs
```bash
# Docker Compose
docker-compose logs -f

# Railway
railway logs

# Fly.io
fly logs
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # Restart Ollama
   ollama serve
   ```

2. **ChromaDB Connection Failed**
   ```bash
   # Check ChromaDB status
   curl http://localhost:8000/api/v1/heartbeat
   
   # Restart ChromaDB
   chroma run --host 0.0.0.0 --port 8000
   ```

3. **Memory Issues**
   - Increase server memory
   - Optimize chunk sizes
   - Use smaller models

4. **Model Loading Issues**
   ```bash
   # Check available models
   ollama list
   
   # Pull missing models
   ollama pull nomic-embed-text
   ollama pull llama3.2:3b
   ```

### Debug Commands

```bash
# Check API health
curl http://localhost:3000/api/health

# Check Ollama status
curl http://localhost:11434/api/tags

# Check ChromaDB status
curl http://localhost:8000/api/v1/heartbeat

# View container logs
docker logs <container_name>

# Check resource usage
docker stats
```

---

## 📈 Performance Optimization

### 1. Model Optimization
```bash
# Use quantized models for better performance
ollama pull llama3.2:3b-q4_K_M
ollama pull nomic-embed-text:latest
```

### 2. Memory Optimization
- Reduce chunk sizes in `textSplitter.js`
- Implement pagination for large datasets
- Use smaller embedding models

### 3. Caching
- Implement Redis caching
- Cache frequently accessed documents
- Use CDN for static assets

---

## 🎯 Next Steps

1. **Choose a platform** based on your needs
2. **Deploy your application**
3. **Set up monitoring** and logging
4. **Configure security** measures
5. **Test thoroughly** before going live
6. **Monitor performance** and optimize

---

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the logs
3. Check the health endpoints
4. Verify all services are running
5. Check environment variables

---

*Happy deploying! 🚀*
