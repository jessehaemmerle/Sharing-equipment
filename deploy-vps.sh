#!/bin/bash

# Toala.at VPS Deployment Script for Existing Reverse Proxy Setup
# This script deploys toala.at alongside other containers with different domains

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if ! docker network ls | grep -q "traefik\|nginx-proxy\|proxy"; then
        print_warning "No reverse proxy network found. Available networks:"
        docker network ls
        echo
        read -p "Enter the name of your reverse proxy network: " NETWORK_NAME
        if [ -z "$NETWORK_NAME" ]; then
            print_error "Network name is required."
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed!"
}

# Detect reverse proxy type
detect_proxy_type() {
    print_status "Detecting reverse proxy setup..."
    
    if docker ps | grep -q traefik; then
        PROXY_TYPE="traefik"
        PROXY_NETWORK="traefik"
        print_success "Detected Traefik reverse proxy"
    elif docker ps | grep -q nginx-proxy; then
        PROXY_TYPE="nginx-proxy"
        PROXY_NETWORK="nginx-proxy"
        print_success "Detected nginx-proxy reverse proxy"
    else
        print_warning "Could not auto-detect reverse proxy type."
        echo "Available options:"
        echo "1) Traefik"
        echo "2) nginx-proxy"
        echo "3) Custom/Manual"
        read -p "Select your reverse proxy type (1-3): " choice
        
        case $choice in
            1)
                PROXY_TYPE="traefik"
                PROXY_NETWORK="traefik"
                ;;
            2)
                PROXY_TYPE="nginx-proxy"
                PROXY_NETWORK="nginx-proxy"
                ;;
            3)
                PROXY_TYPE="manual"
                read -p "Enter your proxy network name: " PROXY_NETWORK
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    fi
    
    # Verify network exists
    if ! docker network ls | grep -q "$PROXY_NETWORK"; then
        print_error "Network '$PROXY_NETWORK' does not exist."
        print_status "Creating network '$PROXY_NETWORK'..."
        docker network create "$PROXY_NETWORK"
    fi
}

# Setup environment configuration
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.vps .env
        
        # Get domain from user
        read -p "Enter your domain for toala.at (e.g., toala.yourdomain.com): " domain
        if [ -z "$domain" ]; then
            print_error "Domain is required."
            exit 1
        fi
        
        # Get email for SSL
        read -p "Enter your email for SSL certificates: " email
        if [ -z "$email" ]; then
            print_error "Email is required for SSL certificates."
            exit 1
        fi
        
        # Generate JWT secret
        if command_exists openssl; then
            JWT_SECRET=$(openssl rand -hex 32)
        else
            JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
        fi
        
        # Update .env file
        sed -i.bak "s/DOMAIN=toala.yourdomain.com/DOMAIN=$domain/" .env
        sed -i.bak "s/SSL_EMAIL=admin@yourdomain.com/SSL_EMAIL=$email/" .env
        sed -i.bak "s/your_super_secure_jwt_secret_here_change_this_in_production/$JWT_SECRET/" .env
        sed -i.bak "s/PROXY_TYPE=traefik/PROXY_TYPE=$PROXY_TYPE/" .env
        sed -i.bak "s/PROXY_NETWORK=traefik/PROXY_NETWORK=$PROXY_NETWORK/" .env
        
        rm .env.bak 2>/dev/null || true
        
        print_success "Environment file created with domain: $domain"
    else
        print_success "Environment file already exists."
        source .env
        domain=$DOMAIN
    fi
}

# Select and prepare docker-compose file
prepare_compose_file() {
    print_status "Preparing Docker Compose configuration..."
    
    case $PROXY_TYPE in
        "traefik")
            COMPOSE_FILE="docker-compose.traefik.yml"
            ;;
        "nginx-proxy")
            COMPOSE_FILE="docker-compose.nginx-proxy.yml"
            ;;
        *)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
    esac
    
    # Check if user wants to disable health checks for faster deployment
    read -p "Disable health checks for faster deployment? (recommended) [Y/n]: " disable_health
    if [[ $disable_health =~ ^[Nn]$ ]]; then
        print_status "Using health checks (slower startup)"
    else
        print_status "Disabling health checks for faster deployment"
        COMPOSE_FILE="docker-compose.no-healthcheck.yml"
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file $COMPOSE_FILE not found!"
        exit 1
    fi
    
    # Update network name in compose file if needed
    if [ "$COMPOSE_FILE" != "docker-compose.no-healthcheck.yml" ] && [ "$PROXY_NETWORK" != "traefik" ] && [ "$PROXY_NETWORK" != "nginx-proxy" ]; then
        sed "s/traefik/$PROXY_NETWORK/g; s/nginx-proxy/$PROXY_NETWORK/g" "$COMPOSE_FILE" > docker-compose.custom.yml
        COMPOSE_FILE="docker-compose.custom.yml"
    fi
    
    print_success "Using compose file: $COMPOSE_FILE"
}

# Deploy the application
deploy_application() {
    print_status "Deploying Toala.at application..."
    
    # Build and deploy
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 20
    
    # Run health check
    print_status "Running health checks..."
    if [ -f "./health-check.sh" ]; then
        ./health-check.sh
    else
        # Basic checks without the script
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
            print_success "Application deployed successfully!"
            
            echo
            echo "🎉 Toala.at is now deployed!"
            echo "📍 Domain: https://$domain"
            echo "🔧 API Docs: https://$domain/api/docs"
            echo
            
            # Show running containers
            docker-compose -f "$COMPOSE_FILE" ps
            
        else
            print_error "Some services failed to start. Check logs:"
            docker-compose -f "$COMPOSE_FILE" logs --tail 20
            exit 1
        fi
    fi
}

# Create management scripts
create_management_scripts() {
    print_status "Creating management scripts..."
    
    # Create start script
    cat > start-vps.sh << EOF
#!/bin/bash
echo "Starting Toala.at application..."
docker-compose -f $COMPOSE_FILE up -d
echo "Application started. Access it at https://$domain"
EOF
    
    # Create stop script
    cat > stop-vps.sh << EOF
#!/bin/bash
echo "Stopping Toala.at application..."
docker-compose -f $COMPOSE_FILE down
echo "Application stopped."
EOF
    
    # Create restart script
    cat > restart-vps.sh << EOF
#!/bin/bash
echo "Restarting Toala.at application..."
docker-compose -f $COMPOSE_FILE down
docker-compose -f $COMPOSE_FILE up -d
echo "Application restarted."
EOF
    
    # Create logs script
    cat > logs-vps.sh << EOF
#!/bin/bash
if [ -z "\$1" ]; then
    echo "Showing all logs..."
    docker-compose -f $COMPOSE_FILE logs -f
else
    echo "Showing logs for service: \$1"
    docker-compose -f $COMPOSE_FILE logs -f \$1
fi
EOF
    
    # Create update script
    cat > update-vps.sh << EOF
#!/bin/bash
echo "Updating Toala.at application..."

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    git pull
fi

# Rebuild and restart
docker-compose -f $COMPOSE_FILE build --no-cache
docker-compose -f $COMPOSE_FILE down
docker-compose -f $COMPOSE_FILE up -d

echo "Application updated and restarted."
EOF
    
    # Make scripts executable
    chmod +x start-vps.sh stop-vps.sh restart-vps.sh logs-vps.sh update-vps.sh
    
    # Copy health check script
    chmod +x health-check.sh
    
    print_success "Management scripts created!"
    echo "  Health check:     ./health-check.sh"
}

# Main deployment function
main() {
    print_status "Starting Toala.at VPS deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Detect reverse proxy
    detect_proxy_type
    
    # Setup environment
    setup_environment
    
    # Prepare compose file
    prepare_compose_file
    
    # Deploy application
    deploy_application
    
    # Create management scripts
    create_management_scripts
    
    # Final instructions
    echo
    print_success "🎉 Toala.at VPS deployment completed successfully!"
    echo
    echo "📋 VPS Management Commands:"
    echo "  Start application:    ./start-vps.sh"
    echo "  Stop application:     ./stop-vps.sh"
    echo "  Restart application:  ./restart-vps.sh"
    echo "  View logs:           ./logs-vps.sh [service_name]"
    echo "  Update application:  ./update-vps.sh"
    echo
    echo "🌐 Access your application:"
    echo "  Frontend: https://$domain"
    echo "  API Docs: https://$domain/api/docs"
    echo
    echo "📁 Important files:"
    echo "  Environment: .env"
    echo "  Compose file: $COMPOSE_FILE"
    echo "  Logs: docker-compose -f $COMPOSE_FILE logs"
    echo
    print_warning "SSL certificates will be automatically obtained by your reverse proxy."
}

# Run main function
main "$@"
