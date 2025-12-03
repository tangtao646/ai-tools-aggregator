# AI Tools Aggregator - Go Service

Go/Gin implementation of the AI Tools backend API.

## Features

- ✅ RESTful API with Gin framework
- ✅ PostgreSQL database with sqlx
- ✅ JWT authentication
- ✅ CORS support
- ✅ Tool listing, filtering, and detail endpoints
- ✅ Multi-language translation support
- ✅ Docker support

## Project Structure

```
go_service/
├── cmd/
│   └── server/
│       └── main.go           # Application entry point
├── internal/
│   ├── auth/
│   │   └── auth.go           # JWT & password hashing
│   ├── config/
│   │   └── config.go         # Configuration management
│   ├── db/
│   │   └── db.go             # Database connection
│   ├── handlers/
│   │   ├── auth.go           # Auth endpoints
│   │   └── tools.go          # Tool endpoints
│   ├── middleware/
│   │   └── middleware.go     # Auth & admin middleware
│   └── models/
│       └── models.go         # Data models
├── Dockerfile
├── go.mod
└── README.md
```

## Setup

### Prerequisites

- Go 1.21+
- PostgreSQL database (already set up from Python backend)

### Local Development

1. Copy environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your database credentials

3. Install dependencies:
```bash
go mod download
```

4. Run the server:
```bash
go run cmd/server/main.go
```

The server will start on http://localhost:8000

### Build

```bash
go build -o bin/server ./cmd/server
./bin/server
```

### Docker

```bash
docker build -t ai-tools-go .
docker run -p 8000:8000 --env-file .env ai-tools-go
```

## API Endpoints

### Tools

- `GET /api/v1/tools/compact` - List tools (compact view with pagination)
  - Query params: `offset`, `limit`, `search`, `category`, `pricing_model`, `min_rating`
- `GET /api/v1/tools` - List tools (full view)
- `GET /api/v1/tools/:id` - Get tool details
  - Query params: `lang` (default: `en`)

### Auth

- `GET /api/v1/auth/ping` - Health check
- `POST /api/v1/auth/verify-token` - Verify JWT token
  - Body: `{"token": "your-jwt-token"}`

### Health

- `GET /health` - Service health check

## Database Schema

Uses the same PostgreSQL schema as the Python backend:
- `tools` - Core tool information
- `tool_translations` - Multi-language content
- `tool_faqs` - FAQ entries
- `users` - User accounts
- `admins` - Admin accounts
- `categories` - Tool categories

## Authentication

JWT tokens with HS256 signing. Set `JWT_SECRET` in environment.

Password hashing uses SHA256 (matching Python backend).

## TODO

- [ ] Implement POST/PUT/DELETE endpoints for tools
- [ ] Add OAuth2 flows (Google, GitHub)
- [ ] Add admin endpoints
- [ ] Add workflow template endpoints
- [ ] Add SEO endpoints
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add tests
- [ ] Add API documentation (Swagger)

## Migration from Python

This Go service is designed to be compatible with the existing Python/FastAPI backend:
- Same database schema
- Same JWT secret and hashing algorithm
- Same API response format
- Same CORS configuration

You can run both services side-by-side during migration.
