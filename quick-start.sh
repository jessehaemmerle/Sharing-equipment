#!/bin/bash

# Quick Start Script for Toala.at
# For when you just want to run the app locally with Docker

echo "🚀 Starting Toala.at locally with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating environment file..."
    cp .env.production .env
    
    # Generate JWT secret
    if command -v openssl > /dev/null 2>&1; then
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i.bak "s/your_super_secure_jwt_secret_here_change_this_in_production/$JWT_SECRET/" .env
        rm .env.bak 2>/dev/null || true
    fi
    echo "✅ Environment file created"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check service status
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    
    # Get the IP address
    IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    
    echo ""
    echo "🌐 Your Toala.at marketplace is ready!"
    echo "   Frontend: http://$IP"
    echo "   API Docs: http://$IP/api/docs"
    echo ""
    echo "🛠️  Management commands:"
    echo "   View logs:    docker-compose logs -f"
    echo "   Stop app:     docker-compose down"
    echo "   Restart:      docker-compose restart"
    echo ""
    echo "📖 For full deployment guide, see DEPLOYMENT.md"
else
    echo "❌ Some services failed to start. Checking logs..."
    docker-compose logs
    exit 1
fi