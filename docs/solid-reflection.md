# TaskMaster - SOLID Principles Reflection

## Single Responsibility Principle (SRP)

Each module has one clear responsibility:

- **Models** (User, Task, Team, Comment, Attachment): Define schema and data validation only. Business logic is not embedded in models.
- **Controllers** (authController, taskController, teamController, commentController, attachmentController): Handle request processing and response for one domain each.
- **Middleware** (auth, errorHandler, upload): Each handles exactly one cross-cutting concern — authentication, error formatting, and file upload configuration respectively.
- **Routes**: Define endpoint mappings and input validation rules, delegating all logic to controllers.

The separation means changing task filtering logic only touches `taskController.js`, not auth or team code.

## Open/Closed Principle (OCP)

- **Error handling**: The centralized `errorHandler` middleware handles new error types by adding conditions without modifying existing handler logic. Adding a new error type (e.g., rate limiting) means adding one `if` block.
- **Routes**: New feature routes (e.g., notifications) can be added as a new route file and mounted in `app.js` without modifying existing routes.
- **File upload**: The `fileFilter` in the upload middleware can accept new MIME types by extending the array, without changing the upload logic.

## Liskov Substitution Principle (LSP)

- All Mongoose models follow the same interface (`find`, `create`, `findById`, `save`, `delete`). Any model can be used wherever a Mongoose Document is expected.
- All route handlers follow the `(req, res, next)` Express signature consistently. Any handler can be swapped at a route definition without breaking the middleware chain.

## Interface Segregation Principle (ISP)

- **Task routes** are grouped with related sub-resources (comments, attachments) under `/api/tasks/:taskId/comments` and `/api/tasks/:taskId/attachments`, so clients interact only with the endpoints relevant to their needs.
- **User profile** endpoints are separate from team management endpoints, so a client managing user settings doesn't need to load team-related logic.
- The `auth` middleware is applied selectively — public routes (register, login) don't require it, while protected routes do.

## Dependency Inversion Principle (DIP)

- **Database configuration** is abstracted behind `config/db.js`. Switching from a local MongoDB to a cloud instance (MongoDB Atlas) requires changing only the `MONGODB_URI` environment variable.
- **Authentication** depends on the JWT standard (via `jsonwebtoken`), not a specific auth provider. The token generation and verification logic is isolated in `authController` and `auth` middleware.
- **File storage** is abstracted through `multer` configuration. Switching from local disk storage to cloud storage (S3) would require changing only the `storage` configuration in `upload.js`, not any controller logic.

## Summary

The architecture follows a layered pattern: Routes → Controllers → Models, with cross-cutting middleware for auth, validation, and error handling. Each layer depends on abstractions (Express middleware interface, Mongoose model interface) rather than concrete implementations, making the system maintainable and extensible.
