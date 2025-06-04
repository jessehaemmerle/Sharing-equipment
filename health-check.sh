#!/bin/bash

# Health Check Script for Toala.at
# Run this after deployment to verify all services are working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
if [ -f .env ]; then
    source .env
else
    print_error ".env file not found"
    exit 1
fi

# Check if containers are running
print_status "Checking container status..."

CONTAINERS=("toala_mongodb" "toala_backend" "toala_frontend")
for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q "$container"; then
        print_success "$container is running"
    else
        print_error "$container is not running"
        echo "Container logs:"
        docker logs "$container" --tail 10
    fi
done

# Wait for services to be ready
print_status "Waiting for services to start up..."
sleep 15

# Check MongoDB
print_status "Checking MongoDB connection..."
if docker exec toala_mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    print_success "MongoDB is accessible"
else
    print_error "MongoDB connection failed"
    docker logs toala_mongodb --tail 10
fi

# Check Backend API
print_status "Checking Backend API..."
if docker exec toala_backend curl -f http://localhost:8001/docs >/dev/null 2>&1; then
    print_success "Backend API is responding"
else
    print_warning "Backend API check failed, trying alternative..."
    # Try without curl
    if docker exec toala_backend python -c "import requests; requests.get('http://localhost:8001/docs')" >/dev/null 2>&1; then
        print_success "Backend API is responding (alternative check)"
    else
        print_error "Backend API is not responding"
        docker logs toala_backend --tail 10
    fi
fi

# Check Frontend
print_status "Checking Frontend..."
if docker exec toala_frontend curl -f http://localhost/ >/dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_warning "Frontend check failed, checking nginx status..."
    if docker exec toala_frontend nginx -t >/dev/null 2>&1; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration error"
        docker logs toala_frontend --tail 10
    fi
fi

# Check external access if domain is set
if [ -n "$DOMAIN" ]; then
    print_status "Checking external access to https://$DOMAIN..."
    
    # Check if domain resolves
    if nslookup "$DOMAIN" >/dev/null 2>&1; then
        print_success "Domain $DOMAIN resolves correctly"
        
        # Try to access the site
        if curl -f -s -o /dev/null "https://$DOMAIN" --max-time 10; then
            print_success "Site is accessible at https://$DOMAIN"
        else
            print_warning "Site not accessible yet (SSL certificates may still be provisioning)"
            print_status "Try accessing http://$DOMAIN or wait a few minutes for SSL setup"
        fi
    else
        print_warning "Domain $DOMAIN does not resolve to this server"
        print_status "Make sure DNS is configured correctly"
    fi
fi

# Check reverse proxy integration
print_status "Checking reverse proxy integration..."
if docker network ls | grep -q "traefik\|nginx-proxy\|proxy"; then
    print_success "Proxy network detected"
    
    # Show network connections
    echo "Network connections:"
    docker network inspect $(docker network ls | grep -E 'traefik|nginx-proxy|proxy' | awk '{print $1}') --format '{{.Name}}: {{len .Containers}} containers' 2>/dev/null || true
else
    print_warning "No reverse proxy network found"
fi

# Summary
echo
echo "=========================="
echo "HEALTH CHECK SUMMARY"
echo "=========================="

# Count running containers
RUNNING_CONTAINERS=$(docker ps | grep -c "toala_")
echo "Running containers: $RUNNING_CONTAINERS/3"

if [ "$RUNNING_CONTAINERS" -eq 3 ]; then
    print_success "All containers are running!"
    echo
    echo "🌐 Access your application:"
    if [ -n "$DOMAIN" ]; then
        echo "   Frontend: https://$DOMAIN"
        echo "   API Docs: https://$DOMAIN/api/docs"
    else
        echo "   Frontend: http://$(curl -s ifconfig.me || echo 'your-server-ip')"
        echo "   API Docs: http://$(curl -s ifconfig.me || echo 'your-server-ip')/api/docs"
    fi
    echo
    echo "🎉 Toala.at is ready!"
else
    print_error "Some containers are not running properly"
    echo
    echo "🔧 Troubleshooting commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Restart:   docker-compose restart"
    echo "   Rebuild:   docker-compose up -d --build"
fi