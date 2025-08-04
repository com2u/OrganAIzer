# OrganAIzer - Docker Compose Deployment

A comprehensive meeting and task management platform with PostgreSQL, Node.js backend, Hasura GraphQL, and React frontend.

## 🎯 What is OrganAIzer?

OrganAIzer is a collaborative platform designed to structure, organize, and execute meetings with AI-powered insights. It provides a complete solution for managing entries, assemblies, types, statuses, labels, and relations through a modern web interface.

## 🚀 Features

- **Entra ID Authentication**: Secure Microsoft Azure AD integration
- **GraphQL API**: Powered by Hasura for efficient data queries
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Theme switching support
- **Assembly Management**: Filtered views for different contexts
- **Entry Management**: Create, update, delete, and organize entries
- **Metadata Management**: Types, statuses, labels, and relations

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- Microsoft Entra ID (Azure AD) application registration

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd OrganAIzer
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Database Configuration
POSTGRES_USER=your-postgres-username
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=organaizer

# Hasura Configuration
HASURA_GRAPHQL_ADMIN_SECRET=your-hasura-admin-secret
HASURA_GRAPHQL_JWT_SECRET=your-jwt-secret-here

# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_REDIRECT_URI=http://localhost:3001/auth/openid/return
AZURE_SCOPE=openid profile email offline_access

# Application URLs
REACT_APP_API_URL=http://localhost:3001
REACT_APP_HASURA_ENDPOINT=http://localhost:8080/v1/graphql
```

### 3. Start Services

```bash
# Start all services
./scripts/start.sh

# Or use Docker Compose directly
docker-compose up -d
```

### 4. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Hasura Console**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## 🏗️ Architecture

```
OrganAIzer/
├── backend/                 # Node.js Express API
│   ├── server.js           # Main server file
│   ├── routes/             # API routes
│   ├── config/             # Configuration files
│   └── package.json        # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.js          # Main app component
│   └── package.json        # Frontend dependencies
├── hasura/                 # Hasura configuration
│   ├── metadata/           # Database metadata
│   └── migrations/         # Database migrations
├── init-db/                # Database initialization
│   ├── 01-init.sql        # Initial database setup
│   └── SQL DDL.sql        # Database schema
├── scripts/               # Utility scripts
└── docker-compose.yml     # Service orchestration
```

## 🔧 Services

### PostgreSQL
- **Port**: 5432
- **Database**: organaizer
- **User**: your-postgres-username
- **Password**: your-postgres-password

### Hasura GraphQL Engine
- **Port**: 8080
- **Admin Secret**: your-hasura-admin-secret
- **Console**: Enabled for development

### Node.js Backend
- **Port**: 3001
- **Features**: REST API, Entra ID auth, Hasura integration
- **Logging**: Winston with rotation

### React Frontend
- **Port**: 3000
- **Features**: Responsive design, theme switching, authentication

## 🚦 Management Commands

```bash
# Start services
./scripts/start.sh

# Stop services
./scripts/stop.sh

# Clean up (removes volumes)
./scripts/clean.sh

# View logs
docker-compose logs -f [service-name]

# Access Hasura console
docker-compose exec hasura hasura console --endpoint http://localhost:8080 --admin-secret your-hasura-admin-secret
```

## 🔐 Authentication Setup

### Microsoft Entra ID Configuration

1. **Register Application**:
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Click "New registration"
   - Name: "OrganAIzer"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `http://localhost:3001/auth/openid/return`

2. **Configure Application**:
   - Copy Application (client) ID to `AZURE_CLIENT_ID`
   - Copy Directory (tenant) ID to `AZURE_TENANT_ID`
   - Create client secret and copy to `AZURE_CLIENT_SECRET`

3. **API Permissions**:
   - Add Microsoft Graph permissions:
     - `openid`
     - `profile`
     - `email`
     - `offline_access`

## 📊 Database Schema

### Core Tables
- **entry**: Main entries with title, content, type, status
- **type**: Entry types (Info, ToDo, Note, Option)
- **status**: Entry statuses (Open, Done, Active, Suspend)
- **labels**: Custom labels for categorization
- **entrylabels**: Many-to-many relationship between entries and labels
- **relations**: Entry relationships and dependencies

### Metadata Tables
- **assembly**: Filtered views and contexts
- **assemblyentries**: Assembly membership
- **relations**: Entry relationships

## 🧪 Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Database Development
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U your-postgres-username -d organaizer

# Run migrations
docker-compose exec hasura hasura migrate apply
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check running services
   docker-compose ps
   # Stop conflicting services
   docker-compose down
   ```

2. **Database Connection**:
   ```bash
   # Check database status
   docker-compose logs postgres
   # Reset database
   ./scripts/clean.sh && ./scripts/start.sh
   ```

3. **NPM Build Issues**:
   ```bash
   # If you get "npm ci can only install with existing package-lock.json" error:
   # This usually means package-lock.json files are missing or ignored by git
   
   # Check if files exist
   ls -la backend/package-lock.json frontend/package-lock.json
   
   # If missing, generate them
   cd backend && npm install && cd ../frontend && npm install && cd ..
   
   # Clean and rebuild Docker images
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Missing Frontend Public Folder**:
   ```bash
   # If frontend fails to build due to missing public folder:
   # Ensure frontend/public/ directory is tracked in git
   git status frontend/public/
   
   # If not tracked, check .gitignore for overly broad 'public' rules
   # The frontend/public/ folder contains essential React static assets
   ```

5. **Authentication Issues**:
   - Verify Azure AD configuration
   - Check redirect URI matches
   - Ensure client secret is valid

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Hasura health
curl http://localhost:8080/healthz

# Frontend health
curl http://localhost:3000
```

## 📈 Monitoring

### Logs Location
- **Backend**: `backend/logs/`
- **PostgreSQL**: `docker-compose logs postgres`
- **Hasura**: `docker-compose logs hasura`

### Performance Monitoring
- **Hasura Metrics**: http://localhost:8080/metrics
- **Backend Metrics**: http://localhost:3001/metrics (when enabled)

## 🚀 Deployment

### Production Deployment
1. Update environment variables for production
2. Configure SSL certificates
3. Set up reverse proxy (nginx)
4. Configure monitoring and logging

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/com2u/OrganAIzer/issues)
- **Documentation**: [Wiki](https://github.com/com2u/OrganAIzer/wiki)
- **Contact**: support@organaizer.app

---

Built with ❤️ by the OrganAIzer team
