# API Service Documentation

This directory contains the centralized API service for the Expert Vakeel application.

## Files

- `api.tsx` - Main API service with all endpoints and TypeScript types
- `api-examples.ts` - Usage examples for all API endpoints
- `README.md` - This documentation file

## Base Configuration

The API service is configured to connect to:
- **Development**: `http://localhost:4000`
- **Production**: Update the `baseURL` in the axios instance

## Available API Modules

### 1. Client API (`clientAPI`)
Handles client registration, authentication, and profile management.

```typescript
import { clientAPI } from '../services/api';

// Register a new client
await clientAPI.register({
  email: "user@example.com",
  password: "password123",
  name: "John Doe"
});

// Login
await clientAPI.login({
  email: "user@example.com",
  password: "password123"
});
```

### 2. User API (`userAPI`)
Manages lawyer and law firm profiles.

```typescript
import { userAPI } from '../services/api';

// Get all users (lawyers/firms)
const response = await userAPI.getAll();

// Create a new user
await userAPI.create({
  fullName: "Jane Smith",
  email: "jane@lawfirm.com",
  userType: "individual"
});
```

### 3. Query API (`queryAPI`)
Manages legal queries and client inquiries.

```typescript
import { queryAPI } from '../services/api';

// Submit a legal query
await queryAPI.create({
  title: "Property Dispute",
  description: "Query description...",
  category: "Civil",
  userId: "user-id"
});

// Get queries by user
const userQueries = await queryAPI.getByUser(userId);
```

## Authentication

The API service automatically handles authentication by:
1. Reading the token from `localStorage`
2. Adding it to request headers as `Authorization: Bearer <token>`
3. Redirecting to `/login` on 401 errors

## Error Handling

The service includes automatic error handling:
- 401 errors trigger logout and redirect to login
- All errors are properly typed with TypeScript
- Network errors are caught and can be handled by components

## TypeScript Support

All API endpoints are fully typed with TypeScript interfaces:
- Request payloads (`ClientInput`, `UserInput`, etc.)
- Response types (`AuthResponse`, `ListResponse<T>`, etc.)
- Error responses (`ErrorResponse`)

## Usage in Components

```typescript
import React, { useEffect, useState } from 'react';
import { userAPI, type User } from '../services/api';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAll();
        setUsers(response.data.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.fullName}</div>
      ))}
    </div>
  );
};
```

## Available Endpoints

### Clients
- `POST /api/clients` - Register client
- `GET /api/clients` - Get all clients
- `DELETE /api/clients` - Delete all clients
- `POST /api/clients/login` - Login client
- `POST /api/clients/logout` - Logout client
- `GET /api/clients/me` - Get current client profile
- `GET /api/clients/{id}` - Get client by ID
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `DELETE /api/users` - Delete all users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user


### Queries
- `POST /api/queries` - Submit query
- `GET /api/queries` - Get all queries
- `DELETE /api/queries` - Delete all queries
- `GET /api/queries/user/{userId}` - Get queries by user
- `GET /api/queries/{id}` - Get query by ID
- `PUT /api/queries/{id}` - Update query
- `DELETE /api/queries/{id}` - Delete query
