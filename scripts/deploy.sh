#!/bin/bash

# RAG API Deployment Script
echo "🚀 RAG API Deployment Script"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to deploy locally
deploy_local() {
    echo "🐳 Deploying locally with Docker Compose..."
    
    # Build and start services
    docker-compose up --build -d
    
    echo "✅ Local deployment complete!"
    echo "🌐 API available at: http://localhost:3000"
    echo "📊 Health check: http://localhost:3000/api/health"
    echo "🤖 Ollama available at: http://localhost:11434"
    echo "🗄️ ChromaDB available at: http://localhost:8000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "❌ Railway CLI is not installed. Installing..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    railway login
    
    # Deploy
    railway up
    
    echo "✅ Railway deployment initiated!"
    echo "Check your Railway dashboard for deployment status."
}

# Function to deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo "Please follow these steps:"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Select 'Docker' as the environment"
    echo "4. Use the provided render.yaml configuration"
    echo "5. Deploy!"
}

# Function to deploy to Fly.io
deploy_fly() {
    echo "🪟 Deploying to Fly.io..."
    
    # Check if Fly CLI is installed
    if ! command -v fly &> /dev/null; then
        echo "❌ Fly CLI is not installed. Installing..."
        curl -L https://fly.io/install.sh | sh
    fi
    
    # Login to Fly
    fly auth login
    
    # Launch app
    fly launch
    
    # Deploy
    fly deploy
    
    echo "✅ Fly.io deployment complete!"
}

# Main menu
echo "Select deployment option:"
echo "1) Local (Docker Compose)"
echo "2) Railway"
echo "3) Render"
echo "4) Fly.io"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_local
        ;;
    2)
        deploy_railway
        ;;
    3)
        deploy_render
        ;;
    4)
        deploy_fly
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
