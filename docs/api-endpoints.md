# TaskMaster - API Endpoints

Base URL: `http://localhost:3000/api`

## Health Check
| Method | Endpoint      | Auth | Description          |
|--------|---------------|------|----------------------|
| GET    | /health       | No   | Server health status |

## Authentication (`/api/auth`)
| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | /auth/register    | No   | Create new user account  |
| POST   | /auth/login       | No   | Login with credentials   |
| GET    | /auth/profile     | Yes  | Get current user profile |
| PUT    | /auth/profile     | Yes  | Update profile info      |
| PUT    | /auth/change-password | Yes | Change password       |
| POST   | /auth/logout      | Yes  | Log out                  |

### POST /auth/register
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /auth/login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### PUT /auth/profile
```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

### PUT /auth/change-password
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

## Tasks (`/api/tasks`)
| Method | Endpoint              | Auth | Description                |
|--------|-----------------------|------|----------------------------|
| POST   | /tasks                | Yes  | Create a new task          |
| GET    | /tasks                | Yes  | List tasks (with filters)  |
| GET    | /tasks/my-tasks       | Yes  | List tasks assigned to me  |
| GET    | /tasks/:id            | Yes  | Get task by ID             |
| PUT    | /tasks/:id            | Yes  | Update task                |
| DELETE | /tasks/:id            | Yes  | Delete task (creator only) |
| PUT    | /tasks/:id/assign     | Yes  | Assign task to a user      |

### Query Parameters for GET /tasks
| Parameter | Type   | Description                            |
|-----------|--------|----------------------------------------|
| status    | String | Filter: open, in_progress, completed   |
| priority  | String | Filter: low, medium, high              |
| assignee  | String | Filter by assignee user ID             |
| team      | String | Filter by team ID                      |
| search    | String | Full-text search in title/description  |
| sortBy    | String | Sort field (default: createdAt)        |
| order     | String | Sort order: asc or desc (default: desc)|
| page      | Number | Page number (default: 1)               |
| limit     | Number | Results per page (default: 20)         |

### POST /tasks
```json
{
  "title": "Implement login page",
  "description": "Create the login page with form validation",
  "status": "open",
  "priority": "high",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "assignee": "<user_id>",
  "team": "<team_id>",
  "tags": ["frontend", "auth"]
}
```

### PUT /tasks/:id/assign
```json
{
  "assigneeId": "<user_id>"
}
```

## Comments (`/api/tasks/:taskId/comments`)
| Method | Endpoint                           | Auth | Description        |
|--------|------------------------------------|------|--------------------|
| POST   | /tasks/:taskId/comments            | Yes  | Add a comment      |
| GET    | /tasks/:taskId/comments            | Yes  | List comments      |
| PUT    | /tasks/:taskId/comments/:commentId | Yes  | Edit own comment   |
| DELETE | /tasks/:taskId/comments/:commentId | Yes  | Delete own comment |

### POST /tasks/:taskId/comments
```json
{
  "content": "This task needs more details on the acceptance criteria."
}
```

## Attachments (`/api/tasks/:taskId/attachments`)
| Method | Endpoint                                        | Auth | Description           |
|--------|--------------------------------------------------|------|-----------------------|
| POST   | /tasks/:taskId/attachments                       | Yes  | Upload file           |
| GET    | /tasks/:taskId/attachments                       | Yes  | List attachments      |
| GET    | /tasks/:taskId/attachments/:attachmentId/download| Yes  | Download file         |
| DELETE | /tasks/:taskId/attachments/:attachmentId         | Yes  | Delete own attachment |

Upload uses `multipart/form-data` with field name `file`. Max size: 5MB.

## Teams (`/api/teams`)
| Method | Endpoint                   | Auth | Description             |
|--------|----------------------------|------|-------------------------|
| POST   | /teams                     | Yes  | Create a new team       |
| GET    | /teams                     | Yes  | List user's teams       |
| GET    | /teams/:id                 | Yes  | Get team details        |
| PUT    | /teams/:id                 | Yes  | Update team (owner)     |
| DELETE | /teams/:id                 | Yes  | Delete team (owner)     |
| POST   | /teams/join                | Yes  | Join team via invite     |
| DELETE | /teams/:id/members/:userId | Yes  | Remove member (owner)   |
| GET    | /teams/:id/tasks           | Yes  | Get team's tasks        |

### POST /teams
```json
{
  "name": "Backend Team",
  "description": "Backend development team"
}
```

### POST /teams/join
```json
{
  "inviteCode": "ABC12DEF"
}
```

## Authentication Header
All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

## Error Response Format
```json
{
  "error": "Description of the error"
}
```

## Validation Error Response
```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Valid email is required",
      "path": "email",
      "location": "body"
    }
  ]
}
```
