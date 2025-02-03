# Microservice POC

A proof of concept for a microservice architecture that demonstrates:
- Local SQLite database for improved performance
- Asynchronous Oracle database synchronization
- REST API endpoints for user management
- Template structure for future Node.js microservices

## Project Structure

```
src/
├── database/           # SQLite database implementation
├── sync/              # Oracle synchronization service
├── users/             # User management module
│   └── dto/           # Data Transfer Objects
└── types/             # TypeScript interfaces
```

## API Endpoints

### Users API

- `POST /users` - Create a new user
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com"
  }
  ```

- `GET /users/:id` - Get user by ID

- `PUT /users/:id` - Update user
  ```json
  {
    "username": "john_updated",
    "email": "john.updated@example.com"
  }
  ```

- `GET /users` - Get all unsynced users

## Database Synchronization

The service maintains a local SQLite database for fast operations and periodically synchronizes changes to Oracle:

1. All create/update operations are marked with `needs_sync = 1`
2. The sync service polls for unsynced records every 5 seconds
3. Records are synchronized to Oracle using MERGE operations
4. Successfully synced records are marked with `needs_sync = 0`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Oracle connection in `src/app.module.ts`:
   ```typescript
   this.syncService.initializeSync({
     host: 'your-oracle-host',
     port: 1521,
     username: 'your-username',
     password: 'your-password',
     database: 'your-database'
   });
   ```

3. Start the service:
   ```bash
   npm run start:dev
   ```

## Testing the API

Create a new user:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "email": "test@example.com"}'
```

Get a user:
```bash
curl http://localhost:3000/users/1
```

Update a user:
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username": "updated_user"}'
```

Get unsynced users:
```bash
curl http://localhost:3000/users
```

## Production Considerations

1. Replace hardcoded Oracle credentials with environment variables
2. Add proper error handling and retries for Oracle synchronization
3. Implement logging and monitoring
4. Add authentication and authorization
5. Configure appropriate CORS settings
6. Add database migrations
7. Implement proper connection pooling for Oracle
