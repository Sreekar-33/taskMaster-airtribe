# TaskMaster - Class Model

## Entity Relationship Diagram (Text)

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │      Team        │
├──────────────────┤       ├──────────────────┤
│ _id: ObjectId    │       │ _id: ObjectId    │
│ name: String     │◄──────│ owner: ObjectId  │
│ email: String    │       │ name: String     │
│ password: String │       │ description: Str │
│ role: String     │       │ inviteCode: Str  │
│ avatar: String   │       │ members: [{      │
│ createdAt: Date  │  ┌───►│   user: ObjectId │
│ updatedAt: Date  │──┘    │   role: String   │
└──────┬───────────┘       │   joinedAt: Date │
       │                   │ }]               │
       │                   └────────┬─────────┘
       │                            │
       │   ┌────────────────────────┘
       │   │
       ▼   ▼
┌──────────────────┐
│      Task        │
├──────────────────┤
│ _id: ObjectId    │
│ title: String    │
│ description: Str │
│ status: String   │
│ priority: String │
│ dueDate: Date    │
│ creator: ObjId   │──► User
│ assignee: ObjId  │──► User
│ team: ObjectId   │──► Team
│ tags: [String]   │
│ createdAt: Date  │
│ updatedAt: Date  │
└──────┬───────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐    ┌──────────────────┐
│    Comment       │    │   Attachment     │
├──────────────────┤    ├──────────────────┤
│ _id: ObjectId    │    │ _id: ObjectId    │
│ content: String  │    │ filename: String │
│ task: ObjectId   │──► │ originalName: Str│
│ author: ObjectId │──► │ mimeType: String │
│ createdAt: Date  │    │ size: Number     │
│ updatedAt: Date  │    │ path: String     │
└──────────────────┘    │ task: ObjectId   │──► Task
                        │ uploadedBy: ObjId│──► User
                        │ createdAt: Date  │
                        └──────────────────┘
```

## Relationships

| Relationship             | Type  | Description                          |
|--------------------------|-------|--------------------------------------|
| User → Task (creator)    | 1:N   | A user creates many tasks            |
| User → Task (assignee)   | 1:N   | A user can be assigned many tasks    |
| Team → Task              | 1:N   | A team contains many tasks           |
| User → Team (owner)      | 1:N   | A user can own many teams            |
| User ↔ Team (members)    | M:N   | Users can belong to many teams       |
| Task → Comment           | 1:N   | A task has many comments             |
| User → Comment (author)  | 1:N   | A user authors many comments         |
| Task → Attachment        | 1:N   | A task has many attachments          |
| User → Attachment        | 1:N   | A user uploads many attachments      |

## Key Indexes

| Collection  | Index                          | Purpose                    |
|-------------|--------------------------------|----------------------------|
| Task        | {title: 'text', desc: 'text'}  | Full-text search           |
| Task        | {status: 1}                    | Filter by status           |
| Task        | {assignee: 1}                  | Query user's tasks         |
| Task        | {team: 1}                      | Query team tasks           |
| Task        | {dueDate: 1}                   | Sort by due date           |
| Comment     | {task: 1, createdAt: -1}       | Get comments for a task    |
| Attachment  | {task: 1}                      | Get attachments for a task |
