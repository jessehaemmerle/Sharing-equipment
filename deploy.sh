#!/bin/bash

# Toala.at Deployment Script for Ubuntu VPS
# This script sets up and deploys the complete toala.at application

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

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root. Use a regular user with sudo privileges."
        exit 1
    fi
}

# Install Docker if not present
install_docker() {
    if ! command_exists docker; then
        print_status "Installing Docker..."
        
        # Update package index
        sudo apt-get update
        
        # Install required packages
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Update package index again
        sudo apt-get update
        
        # Install Docker Engine
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Add current user to docker group
        sudo usermod -aG docker $USER
        
        print_success "Docker installed successfully!"
        print_warning "Please log out and log back in for Docker group changes to take effect."
    else
        print_success "Docker is already installed."
    fi
}

# Install Docker Compose if not present
install_docker_compose() {
    if ! command_exists docker-compose; then
        print_status "Installing Docker Compose..."
        
        # Download Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        
        # Make it executable
        sudo chmod +x /usr/local/bin/docker-compose
        
        print_success "Docker Compose installed successfully!"
    else
        print_success "Docker Compose is already installed."
    fi
}

# Setup firewall
setup_firewall() {
    print_status "Configuring UFW firewall..."
    
    # Enable UFW if not already enabled
    sudo ufw --force enable
    
    # Allow SSH (important!)
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow Docker subnet (optional, for internal communication)
    sudo ufw allow from 172.16.0.0/12
    
    print_success "Firewall configured successfully!"
}

# Create production environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.production .env
        
        # Generate a secure JWT secret
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/your_super_secure_jwt_secret_here_change_this_in_production/$JWT_SECRET/" .env
        
        print_success "Environment file created with secure JWT secret."
        print_warning "Please edit .env file to update domain and other settings if needed."
    else
        print_success "Environment file already exists."
    fi
}

# Setup SSL with Let's Encrypt (optional)
setup_ssl() {
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name (e.g., toala.example.com): " domain
        read -p "Enter your email for SSL certificate: " email
        
        if [ ! -z "$domain" ] && [ ! -z "$email" ]; then
            print_status "Setting up SSL with Let's Encrypt..."
            
            # Install certbot
            sudo apt-get update
            sudo apt-get install -y certbot
            
            # Create SSL directory
            mkdir -p ./ssl
            
            # Create docker-compose override for SSL
            cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  frontend:
    volumes:
      - ./ssl:/etc/letsencrypt:ro
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
    environment:
      - DOMAIN=$domain
EOF
            
            # Create SSL nginx configuration
            cat > nginx-ssl.conf << EOF
server {
    listen 80;
    server_name $domain;
    
    # Redirect to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl http2;
    server_name $domain;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy to backend
    location /api {
        proxy_pass http://backend:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
            
            print_success "SSL configuration created. You'll need to obtain certificates after deployment."
            print_warning "After deployment, run: sudo certbot certonly --webroot -w /var/www/certbot -d $domain"
        fi
    fi
}

# Deploy the application
deploy_application() {
    print_status "Building and deploying Toala.at application..."
    
    # Pull latest images and build
    docker-compose build --no-cache
    
    # Start the application
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Application deployed successfully!"
        print_status "Checking service health..."
        
        # Show running containers
        docker-compose ps
        
        # Check if MongoDB is accessible
        if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            print_success "MongoDB is running and accessible."
        else
            print_warning "MongoDB might not be fully ready yet. This is normal for first startup."
        fi
        
        # Check if backend is accessible
        if curl -f http://localhost/api/docs > /dev/null 2>&1; then
            print_success "Backend API is accessible."
        else
            print_warning "Backend API might not be ready yet. Check logs with: docker-compose logs backend"
        fi
        
        # Check if frontend is accessible
        if curl -f http://localhost/ > /dev/null 2>&1; then
            print_success "Frontend is accessible."
        else
            print_warning "Frontend might not be ready yet. Check logs with: docker-compose logs frontend"
        fi
        
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Create management scripts
create_management_scripts() {
    print_status "Creating management scripts..."
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Toala.at application..."
docker-compose up -d
echo "Application started. Access it at http://localhost"
EOF
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Toala.at application..."
docker-compose down
echo "Application stopped."
EOF
    
    # Create restart script
    cat > restart.sh << 'EOF'
#!/bin/bash
echo "Restarting Toala.at application..."
docker-compose down
docker-compose up -d
echo "Application restarted."
EOF
    
    # Create logs script
    cat > logs.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Showing all logs..."
    docker-compose logs -f
else
    echo "Showing logs for service: $1"
    docker-compose logs -f $1
fi
EOF
    
    # Create backup script
    cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="toala_backup_$DATE.tar.gz"

echo "Creating backup..."
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T mongodb mongodump --archive | gzip > $BACKUP_DIR/mongodb_$DATE.gz

# Backup application files
tar -czf $BACKUP_DIR/$BACKUP_FILE --exclude='./backups' --exclude='./node_modules' --exclude='./.git' .

echo "Backup created: $BACKUP_DIR/$BACKUP_FILE"
echo "Database backup: $BACKUP_DIR/mongodb_$DATE.gz"
EOF
    
    # Create update script
    cat > update.sh << 'EOF'
#!/bin/bash
echo "Updating Toala.at application..."

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    git pull
fi

# Rebuild and restart
docker-compose build --no-cache
docker-compose down
docker-compose up -d

echo "Application updated and restarted."
EOF
    
    # Make scripts executable
    chmod +x start.sh stop.sh restart.sh logs.sh backup.sh update.sh
    
    print_success "Management scripts created!"
}

# Main deployment function
main() {
    print_status "Starting Toala.at deployment on Ubuntu VPS..."
    
    # Check prerequisites
    check_root
    
    # Install dependencies
    install_docker
    install_docker_compose
    
    # Setup system
    setup_firewall
    setup_environment
    
    # Optional SSL setup
    setup_ssl
    
    # Deploy application
    deploy_application
    
    # Create management scripts
    create_management_scripts
    
    # Final instructions
    echo
    print_success "🎉 Toala.at deployment completed successfully!"
    echo
    echo "📋 Quick Start Commands:"
    echo "  Start application:    ./start.sh"
    echo "  Stop application:     ./stop.sh"
    echo "  Restart application:  ./restart.sh"
    echo "  View logs:           ./logs.sh [service_name]"
    echo "  Create backup:       ./backup.sh"
    echo "  Update application:  ./update.sh"
    echo
    echo "🌐 Access your application:"
    echo "  Frontend: http://$(curl -s ifconfig.me || echo 'your-server-ip')"
    echo "  API Docs: http://$(curl -s ifconfig.me || echo 'your-server-ip')/api/docs"
    echo
    echo "📁 Important files:"
    echo "  Environment: .env"
    echo "  Logs: docker-compose logs"
    echo "  Data: MongoDB volume (persistent)"
    echo
    print_warning "Please update the .env file with your specific configuration!"
    
    if [ -f "docker-compose.override.yml" ]; then
        print_warning "SSL is configured but certificates need to be obtained. See instructions above."
    fi
}

# Run main function
main "$@"
