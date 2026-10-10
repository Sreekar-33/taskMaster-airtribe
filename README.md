# TaskMaster

A backend system for task tracking and management that facilitates collaboration and organization within teams or projects. Built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication** — Secure registration, login, profile management, and JWT-based session handling with bcrypt password hashing
- **Task Management** — Create, read, update, and delete tasks with filtering, sorting, searching (full-text), and pagination
- **Team Collaboration** — Create teams, invite members via invite codes, assign tasks within teams
- **Comments & Attachments** — Add comments and upload file attachments to tasks for collaboration
- **Authorization** — Role-based access control ensuring users can only access resources they own, are assigned to, or belong to via team membership

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **File Uploads:** multer

## Project Structure

```
src/
├── app.js                     # Express app entry point
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # User schema
│   ├── Task.js                # Task schema with text indexes
│   ├── Team.js                # Team schema with invite codes
│   ├── Comment.js             # Comment schema
│   └── Attachment.js          # Attachment schema
├── controllers/
│   ├── authController.js      # Auth logic
│   ├── taskController.js      # Task CRUD + filtering/search
│   ├── teamController.js      # Team management
│   ├── commentController.js   # Comment operations
│   └── attachmentController.js# File upload/download
├── middleware/
│   ├── auth.js                # JWT authentication
│   ├── errorHandler.js        # Centralized error handling
│   └── upload.js              # Multer configuration
├── routes/
│   ├── authRoutes.js          # /api/auth/*
│   ├── taskRoutes.js          # /api/tasks/*
│   └── teamRoutes.js          # /api/teams/*
└── utils/
    └── taskAccess.js          # Shared authorization helper
```

## Getting Started

### Prerequisites

- Node.js (v18+) or Bun
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
git clone <repository-url>
cd taskMaster-airtribe
npm install
```

### Configuration

Create a `.env` file in the root directory:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taskmaster
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

### Running the Server

```bash
npm start
```

The server starts at `http://localhost:3000`.

### Running Tests

```bash
bun test
```

Tests use an in-memory MongoDB instance — no external database needed.

## API Endpoints

### Authentication

| Method | Endpoint                | Auth | Description            |
|--------|-------------------------|------|------------------------|
| POST   | `/api/auth/register`    | No   | Register a new user    |
| POST   | `/api/auth/login`       | No   | Login with credentials |
| GET    | `/api/auth/profile`     | Yes  | Get user profile       |
| PUT    | `/api/auth/profile`     | Yes  | Update profile         |
| PUT    | `/api/auth/change-password` | Yes | Change password    |
| POST   | `/api/auth/logout`      | Yes  | Log out                |

### Tasks

| Method | Endpoint                | Auth | Description                     |
|--------|-------------------------|------|---------------------------------|
| POST   | `/api/tasks`            | Yes  | Create a task                   |
| GET    | `/api/tasks`            | Yes  | List tasks (filter/sort/search) |
| GET    | `/api/tasks/my-tasks`   | Yes  | Tasks assigned to me            |
| GET    | `/api/tasks/:id`        | Yes  | Get task by ID                  |
| PUT    | `/api/tasks/:id`        | Yes  | Update task                     |
| DELETE | `/api/tasks/:id`        | Yes  | Delete task                     |
| PUT    | `/api/tasks/:id/assign` | Yes  | Assign task to a user           |

**Query parameters for `GET /api/tasks`:** `status`, `priority`, `assignee`, `team`, `search`, `sortBy`, `order`, `page`, `limit`

### Comments

| Method | Endpoint                                    | Auth | Description        |
|--------|---------------------------------------------|------|--------------------|
| POST   | `/api/tasks/:taskId/comments`               | Yes  | Add comment        |
| GET    | `/api/tasks/:taskId/comments`               | Yes  | List comments      |
| PUT    | `/api/tasks/:taskId/comments/:commentId`    | Yes  | Edit own comment   |
| DELETE | `/api/tasks/:taskId/comments/:commentId`    | Yes  | Delete own comment |

### Attachments

| Method | Endpoint                                                  | Auth | Description     |
|--------|-----------------------------------------------------------|------|-----------------|
| POST   | `/api/tasks/:taskId/attachments`                          | Yes  | Upload file     |
| GET    | `/api/tasks/:taskId/attachments`                          | Yes  | List files      |
| GET    | `/api/tasks/:taskId/attachments/:attachmentId/download`   | Yes  | Download file   |
| DELETE | `/api/tasks/:taskId/attachments/:attachmentId`            | Yes  | Delete file     |

### Teams

| Method | Endpoint                          | Auth | Description           |
|--------|-----------------------------------|------|-----------------------|
| POST   | `/api/teams`                      | Yes  | Create a team         |
| GET    | `/api/teams`                      | Yes  | List my teams         |
| GET    | `/api/teams/:id`                  | Yes  | Get team details      |
| PUT    | `/api/teams/:id`                  | Yes  | Update team (owner)   |
| DELETE | `/api/teams/:id`                  | Yes  | Delete team (owner)   |
| POST   | `/api/teams/join`                 | Yes  | Join via invite code  |
| DELETE | `/api/teams/:id/members/:userId`  | Yes  | Remove member (owner) |
| GET    | `/api/teams/:id/tasks`            | Yes  | Get team tasks        |

### Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

## Example Usage

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

### Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Build login page", "description": "Create login with validation", "priority": "high", "dueDate": "2025-12-31"}'
```

### Search Tasks
```bash
curl "http://localhost:3000/api/tasks?search=login&status=open&sortBy=dueDate&order=asc" \
  -H "Authorization: Bearer <token>"
```

## Design Documents

Detailed design documentation is available in the [`docs/`](docs/) directory:

- [Requirements](docs/requirements.md) — Functional and non-functional requirements
- [Class Model](docs/class-model.md) — Entity relationships and database indexes
- [SOLID Reflection](docs/solid-reflection.md) — How SOLID principles are applied
- [API Endpoints](docs/api-endpoints.md) — Complete API reference with request/response examples
