# TaskMaster - Requirements Document

## Overview
TaskMaster is a backend system for task tracking and management that facilitates collaboration and organization within teams or projects.

## Functional Requirements

### FR-1: User Authentication & Management
- FR-1.1: Users can register with name, email, and password
- FR-1.2: Users can log in with email and password credentials
- FR-1.3: Passwords are securely hashed before storage
- FR-1.4: JWT tokens are issued for session management
- FR-1.5: Users can view and update their profile information
- FR-1.6: Users can change their password
- FR-1.7: Users can log out securely

### FR-2: Task Management
- FR-2.1: Users can create tasks with title, description, due date, priority, and status
- FR-2.2: Users can view a list of all tasks assigned to them
- FR-2.3: Users can update task details (title, description, status, priority, due date)
- FR-2.4: Users can mark tasks as completed
- FR-2.5: Users can delete tasks they created
- FR-2.6: Users can assign tasks to other team members
- FR-2.7: Tasks can be filtered by status (open, in_progress, completed) and priority
- FR-2.8: Tasks can be sorted by creation date, due date, or priority
- FR-2.9: Tasks can be searched by title or description (full-text search)
- FR-2.10: Task listing supports pagination

### FR-3: Team/Project Collaboration
- FR-3.1: Users can create teams with a name and description
- FR-3.2: Teams generate a unique invite code on creation
- FR-3.3: Users can join teams using an invite code
- FR-3.4: Team owners can update team details
- FR-3.5: Team owners can remove members
- FR-3.6: Team members can view team-scoped tasks
- FR-3.7: Team owners can delete teams
- FR-3.8: Users can view all teams they belong to

### FR-4: Comments
- FR-4.1: Users can add comments to tasks
- FR-4.2: Users can view all comments on a task (paginated)
- FR-4.3: Users can edit their own comments
- FR-4.4: Users can delete their own comments

### FR-5: Attachments
- FR-5.1: Users can upload file attachments to tasks (max 5MB)
- FR-5.2: Supported file types: images (JPEG, PNG, GIF), PDF, Word documents, text files, ZIP
- FR-5.3: Users can view all attachments on a task
- FR-5.4: Users can download attachments
- FR-5.5: Users can delete their own attachments

## Non-Functional Requirements

### NFR-1: Security
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT-based authentication with configurable expiration
- Input validation on all endpoints (express-validator)
- Password field excluded from query results by default
- Authorization checks on resource modification endpoints

### NFR-2: API Design
- RESTful endpoint naming conventions
- Consistent JSON response format
- Proper HTTP status codes (201 for creation, 404 for not found, etc.)
- Centralized error handling middleware
- CORS enabled for cross-origin requests

### NFR-3: Data Integrity
- MongoDB indexes on frequently queried fields
- Full-text index on task title and description for search
- Mongoose schema validation with constraints
- Referential integrity maintained via ObjectId references

### NFR-4: Performance
- Pagination on list endpoints (default limit: 20)
- Database indexes for status, assignee, team, and due date queries
- Parallel Promise execution for count + find queries
