# WASSL Backend - Docker Setup

This document explains how to run the WASSL backend application with PostgreSQL and Redis using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### 1. Environment Configuration

Create a `.env` file in this directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration. For Docker, use these database settings:

```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://wassl:wassl123@localhost:5433/wassl"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:8080"
```

### 2. Build and Run

Start all services (PostgreSQL, Redis, and Backend):

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port `5433`
- **Redis** on port `6380`
- **Backend API** on port `3001`

### 3. Run Database Migrations

After the first start, run Prisma migrations:

```bash
docker-compose exec backend npx prisma migrate deploy
```

Optionally, seed the database with initial data:

```bash
docker-compose exec backend npm run db:seed
```

### 4. Verify Services

Check that all services are healthy:

```bash
docker-compose ps
```

Test the API:
```bash
curl http://localhost:3001/api/health
```

### 5. View Logs

View logs for all services:
```bash
docker-compose logs -f
```

View logs for a specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 6. Stop Services

```bash
docker-compose down
```

To remove volumes (⚠️ this will delete all data):
```bash
docker-compose down -v
```

## Services Overview

### PostgreSQL Database
- **Port**: 5433 (mapped from container's 5432)
- **User**: wassl
- **Password**: wassl123
- **Database**: wassl
- **Volume**: `postgres_data` (persistent storage)

### Redis Cache
- **Port**: 6380 (mapped from container's 6379)
- **Volume**: `redis_data` (persistent storage)

### Backend API
- **Port**: 3001
- **Dependencies**: PostgreSQL, Redis
- **Volume**: `uploads_data` (for file uploads)

## Common Tasks

### Access Database

Connect to PostgreSQL using any client:
```bash
psql -h localhost -p 5433 -U wassl -d wassl
```

Or use Prisma Studio:
```bash
docker-compose exec backend npx prisma studio
```

### Access Redis CLI

```bash
docker-compose exec redis redis-cli
```

### Run Backend Commands

Execute any command inside the backend container:

```bash
# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run db:seed

# Access container shell
docker-compose exec backend sh
```

### Rebuild After Code Changes

If you've made changes to the backend code:

```bash
docker-compose build backend
docker-compose up -d
```

## Environment Variables

Key environment variables (set in `.env` or `docker-compose.yml`):

| Variable | Description | Default/Example |
|----------|-------------|-----------------|
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection string | See docker-compose.yml |
| `REDIS_URL` | Redis connection string | See docker-compose.yml |
| `JWT_SECRET` | Secret key for JWT tokens | Change in production! |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `http://localhost:8080` |
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |

## Data Persistence

Docker volumes ensure data persists across container restarts:

- **postgres_data**: Database files
- **redis_data**: Cache data
- **uploads_data**: Uploaded files

View volumes:
```bash
docker volume ls
```

Backup database:
```bash
docker-compose exec postgres pg_dump -U wassl wassl > backup.sql
```

Restore database:
```bash
docker-compose exec -T postgres psql -U wassl wassl < backup.sql
```

## Development vs Production

### Development Mode

For local development with hot-reload:

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis only
docker-compose up -d postgres redis

# Run backend in dev mode (outside Docker)
npm run dev
```

### Production Mode (Docker)

For production or testing production builds:

```bash
# Build and run all services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

## Troubleshooting

### Backend won't connect to database

1. Check if PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Verify DATABASE_URL in backend environment:
   ```bash
   docker-compose exec backend env | grep DATABASE_URL
   ```

3. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

### Port conflicts

If ports 3001, 5433, or 6380 are already in use, edit `docker-compose.yml` to use different ports:

```yaml
ports:
  - "YOUR_PORT:5432"  # For PostgreSQL
```

### Database migrations fail

Run migrations manually:
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Reset everything

⚠️ This will delete all data:
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
```

## File Structure

```
wassl-backend/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Service orchestration
├── .dockerignore          # Files excluded from Docker build
├── .env.example           # Environment variable template
├── prisma/                # Database schema and migrations
└── README-DOCKER.md       # This file
```

## Security Notes

⚠️ **Important for Production**:

1. Change `JWT_SECRET` to a strong random value
2. Use strong database passwords (not the default `wassl123`)
3. Configure SMTP settings for email functionality
4. Review and update CORS settings in the backend code
5. Use environment variables for sensitive data (never commit `.env`)
6. Consider using Docker secrets for production deployments
