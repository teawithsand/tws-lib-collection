# Mintay Backend

A simple proof-of-concept backend server for the Mintay application, built with Express.js and TypeScript.

## Features

- **User Management**: Register and login users with username/password
- **JWT Authentication**: Secure API endpoints with JSON Web Tokens
- **Collection Storage**: Store and retrieve JSON collections with file-based persistence
- **CORS Support**: Cross-origin requests enabled for frontend integration
- **File-based Storage**: Simple JSON file storage for users and collections

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Both endpoints return:
```json
{
  "message": "Success message",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "createdAt": "2025-06-19T..."
  }
}
```

### Collections

#### List All Collections
```
GET /api/collections
```

Returns:
```json
{
  "collections": [
    {
      "id": "collection-id",
      "savedAt": "2025-06-19T...",
      "savedBy": "username"
    }
  ],
  "total": 1
}
```

#### Get Collection
```
GET /api/collections/:id
```

#### Save Collection (Protected)
```
PUT /api/collections/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "any": "json data",
  "can": "be stored",
  "as": "collection"
}
```

### Health Check
```
GET /health
```

## Setup

### Prerequisites
- Node.js and npm installed
- This project uses Rush for monorepo management

### Installation
```bash
# Install dependencies (from monorepo root)
rush update && rush install

# Or in package directory
npm install
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT tokens (default: "your-secret-key-change-this-in-production")

### Development
```bash
# Start development server with hot reload
npm run dev

# Build the project
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint and format code
npm run fix
```

## Data Storage

The backend stores data in JSON files in the `data/` directory:
- `data/users.json`: User accounts
- `data/collections/`: Individual collection files

The `data/` directory is automatically created and is gitignored.

## Security Notes

⚠️ **This is a proof-of-concept implementation**:
- Password hashing uses a simple base64 encoding (not secure for production)
- JWT secret should be changed and stored securely
- No rate limiting or advanced security measures implemented
- For production use, implement proper password hashing (bcrypt), HTTPS, rate limiting, etc.

## API Usage Examples

### Register and Login
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'
```

### Save and Retrieve Collections
```bash
# List all collections
curl http://localhost:3000/api/collections

# Save a collection (requires authentication)
curl -X PUT http://localhost:3000/api/collections/my-collection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Collection", "items": [{"id": 1, "name": "Item 1"}]}'

# Get a collection (no authentication required)
curl http://localhost:3000/api/collections/my-collection
```

## Architecture

- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **JWT**: Authentication tokens
- **File-based storage**: Simple JSON persistence
- **CORS**: Cross-origin request support

The codebase follows SOLID principles with clear separation of concerns:
- `AuthService`: Authentication logic
- `CollectionService`: Collection management
- `FileUserRepository`: User data persistence
- `App`: Main application setup and routing
