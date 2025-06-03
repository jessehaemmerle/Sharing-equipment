# 🛠️ Toala.at - Equipment Lending Marketplace

> **A modern peer-to-peer equipment sharing platform for Austria**

Toala.at is a full-stack web application that enables people to lend and borrow equipment like welding machines, lawn mowers, chainsaws, and other tools from their local community. Built with modern technologies and designed for the Austrian market.

![Toala.at Screenshot](https://via.placeholder.com/800x400/2563eb/ffffff?text=Toala.at+Equipment+Marketplace)

## 🌟 Features

### ✅ **Currently Implemented**
- **User Authentication** - Secure registration/login with JWT tokens
- **Equipment Browsing** - Search and filter equipment by category, location, price
- **Professional UI** - Responsive design with Austrian marketplace branding
- **Location-based Search** - Find equipment in your area
- **Equipment Categories** - Power tools, lawn equipment, welding, construction, automotive, household
- **Image Support** - Equipment photos with base64 storage
- **RESTful API** - Complete backend API with comprehensive endpoints

### 🚧 **Planned Features**
- **Equipment Listing** - Add your own equipment for rent
- **Rental Requests** - Send and manage rental requests
- **Real-time Chat** - Communicate with equipment owners
- **Calendar Integration** - Availability management
- **Payment Integration** - Optional Stripe integration
- **Rating System** - User and equipment reviews

## 🏗️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT Authentication** - Secure token-based auth
- **BCrypt** - Password hashing
- **Pydantic** - Data validation and serialization

### Frontend
- **React 19** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Context** - State management

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **CORS** - Cross-origin resource sharing
- **Supervisor** - Process management

## 📋 Prerequisites

Before hosting toala.at, ensure you have:

- **Python 3.11+** installed
- **Node.js 18+** and **Yarn** package manager
- **MongoDB** (local installation or cloud service)
- **Git** for version control
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### Option 1: One-Command VPS Deployment (Ubuntu)

Deploy to your Ubuntu VPS in minutes:

```bash
# Upload project files to your VPS
scp -r toala-at/ user@your-vps-ip:~/

# SSH to your VPS
ssh user@your-vps-ip

# Run deployment script
cd toala-at
chmod +x deploy.sh
./deploy.sh
```

The script automatically installs Docker, configures firewall, and deploys the complete application!

### Option 2: Local Development with Docker

```bash
# Clone repository
git clone <your-repo-url>
cd toala-at

# Quick start (builds and runs everything)
chmod +x quick-start.sh
./quick-start.sh

# Manual approach
docker-compose up --build -d
```

### Option 3: Manual Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd frontend
yarn install
yarn start
```

**Database:**
```bash
# Install and start MongoDB locally
sudo systemctl start mongodb
```

## ⚙️ Environment Configuration

### Backend Environment (.env)

```bash
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=toala_database

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24

# Server Configuration
PORT=8001
HOST=0.0.0.0

# Development/Production
DEBUG=true
ENVIRONMENT=development
```

### Frontend Environment (.env)

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# Application Configuration
REACT_APP_NAME=Toala.at
REACT_APP_VERSION=1.0.0

# Development Configuration
GENERATE_SOURCEMAP=false
```

## 🏃‍♂️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

### Production Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

**Frontend:**
```bash
cd frontend
yarn build
# Serve build folder with your preferred web server (nginx, apache, etc.)
```

## 🐳 Docker Deployment

### Production Deployment (Recommended)

For Ubuntu VPS with automatic setup:

```bash
# One-command deployment
./deploy.sh
```

### Manual Docker Deployment

```bash
# Create environment file
cp .env.production .env
# Edit .env with your configuration

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Development with Docker

```bash
# Use development configuration
docker-compose -f docker-compose.dev.yml up -d --build

# This provides:
# - Hot reload for both frontend and backend
# - Development database
# - Debug mode enabled
```

### Docker Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service_name]

# Update and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up
docker system prune -a
```

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    MongoDB      │
│   (React)       │    │   (FastAPI)     │    │   (Database)    │
│   Port: 80      │────│   Port: 8001    │────│   Port: 27017   │
│   Nginx         │    │   Python        │    │   NoSQL         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🌐 Production Deployment

### Option 1: Traditional VPS/Server

1. **Server Setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install required packages
   sudo apt install nginx python3.11 python3.11-venv nodejs npm mongodb
   
   # Install yarn
   npm install -g yarn
   ```

2. **Application Deployment:**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/toala-at.git
   cd toala-at
   
   # Setup backend
   cd backend
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Setup frontend
   cd ../frontend
   yarn install
   yarn build
   ```

3. **Nginx Configuration:**
   ```nginx
   # /etc/nginx/sites-available/toala-at
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       # Frontend
       location / {
           root /path/to/toala-at/frontend/build;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://127.0.0.1:8001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Process Management:**
   ```bash
   # Install supervisor
   sudo apt install supervisor
   
   # Create supervisor config for backend
   sudo nano /etc/supervisor/conf.d/toala-backend.conf
   ```

   ```ini
   [program:toala-backend]
   command=/path/to/toala-at/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
   directory=/path/to/toala-at/backend
   user=www-data
   autostart=true
   autorestart=true
   redirect_stderr=true
   stdout_logfile=/var/log/toala-backend.log
   ```

### Option 2: Cloud Platforms

**Heroku:**
```bash
# Install Heroku CLI
# Create Procfile in root:
echo "web: cd backend && uvicorn server:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create your-app-name
heroku addons:create mongolab:sandbox
heroku config:set MONGO_URL=your-mongodb-uri
git push heroku main
```

**DigitalOcean App Platform:**
```yaml
# .do/app.yaml
name: toala-at
services:
- name: backend
  source_dir: /backend
  github:
    repo: yourusername/toala-at
    branch: main
  run_command: uvicorn server:app --host 0.0.0.0 --port 8080
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  
- name: frontend
  source_dir: /frontend
  github:
    repo: yourusername/toala-at
    branch: main
  build_command: yarn build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: toala-db
  engine: MONGODB
  version: "5"
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user info |

### Equipment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/equipment` | Create equipment listing |
| GET | `/api/equipment` | Get all equipment (with filters) |
| GET | `/api/equipment/{id}` | Get equipment by ID |
| GET | `/api/my-equipment` | Get user's equipment |

### Request Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create rental request |
| GET | `/api/requests/received` | Get received requests |
| GET | `/api/requests/sent` | Get sent requests |
| PUT | `/api/requests/{id}/status` | Update request status |

### Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/{request_id}` | Get messages for request |

## 🗄️ Database Schema

### Users Collection
```javascript
{
  id: "uuid",
  email: "user@example.com",
  name: "John Doe",
  password_hash: "hashed_password",
  phone: "+43 123 456 789",
  location: "Vienna",
  latitude: 48.2082,
  longitude: 16.3738,
  created_at: "2024-01-01T00:00:00Z",
  avatar: "base64_image_string"
}
```

### Equipment Collection
```javascript
{
  id: "uuid",
  owner_id: "user_uuid",
  title: "Professional Welding Machine",
  description: "High-quality welding equipment for professional use",
  category: "welding_equipment",
  price_per_day: 25.00,
  location: "Vienna",
  latitude: 48.2082,
  longitude: 16.3738,
  images: ["base64_image_1", "base64_image_2"],
  availability_calendar: {"2024-01-01": true, "2024-01-02": false},
  min_rental_days: 1,
  max_rental_days: 30,
  created_at: "2024-01-01T00:00:00Z",
  is_available: true
}
```

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check Python version
python --version  # Should be 3.11+

# Check MongoDB connection
mongo  # Should connect successfully

# Check environment variables
cat backend/.env

# Check logs
tail -f /var/log/toala-backend.log
```

**Frontend build fails:**
```bash
# Clear cache
yarn cache clean

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
yarn install

# Check Node.js version
node --version  # Should be 18+
```

**Database connection issues:**
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/toala_database

# Check MongoDB service status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb
```

**CORS errors:**
- Ensure `REACT_APP_BACKEND_URL` in frontend/.env matches your backend URL
- Check CORS configuration in backend/server.py
- Verify API routes use `/api` prefix

## 🔐 Security Considerations

1. **Environment Variables:** Never commit `.env` files to version control
2. **JWT Secret:** Use a strong, random JWT secret in production
3. **HTTPS:** Always use HTTPS in production
4. **Database Security:** Configure MongoDB authentication in production
5. **Input Validation:** Backend includes comprehensive input validation
6. **Rate Limiting:** Consider implementing rate limiting for production

## 📖 Development Guide

### Adding New Features

1. **Backend API:**
   ```bash
   # Add new endpoint to server.py
   @api_router.post("/new-endpoint")
   async def new_endpoint():
       # Implementation
   ```

2. **Frontend Component:**
   ```jsx
   // Add new component to App.js
   const NewComponent = () => {
       // Implementation
   };
   ```

3. **Database Model:**
   ```python
   # Add new Pydantic model
   class NewModel(BaseModel):
       # Fields
   ```

### Testing

```bash
# Backend testing
cd backend
python -m pytest

# Frontend testing
cd frontend
yarn test

# Run the comprehensive test script
python backend_test.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and commit: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions and support:

- **Email:** support@toala.at
- **Issues:** [GitHub Issues](https://github.com/yourusername/toala-at/issues)
- **Documentation:** [Wiki](https://github.com/yourusername/toala-at/wiki)

## 🎯 Roadmap

- [ ] Equipment listing creation form
- [ ] Rental request management system
- [ ] Real-time chat with WebSocket
- [ ] Calendar availability management
- [ ] Payment integration (Stripe)
- [ ] Mobile app (React Native)
- [ ] Advanced search with geolocation
- [ ] Rating and review system
- [ ] Email notifications
- [ ] Multi-language support (German, English)

---

**Built with ❤️ for the Austrian equipment sharing community**

*Toala.at - Lend, Borrow, Build Community*
