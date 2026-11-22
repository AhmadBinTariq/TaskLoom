# TaskLoom – Backend

REST API for TaskLoom, built with **Node.js + Express + MongoDB (Mongoose)**, following
the course slides (Lectures 15–19). CommonJS, MVC folders, JWT auth, bcrypt passwords.

## Requirements

- Node.js
- MongoDB running locally at `mongodb://localhost:27017` (or set `MONGO_URI` to an Atlas URI)

## Run it

```bash
npm install
npm run seed      # load the demo users/workspaces/projects/tasks
npm run dev       # start the API with nodemon (http://localhost:5000)
npm start         # start the API with node
```

`.env` settings:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | secret used to sign login tokens |
| `PORT` | no (5000) | port the API listens on |
| `CLIENT_URL` | no (`http://localhost:5173,http://127.0.0.1:5173`) | comma-separated origins the browser may call the API from (CORS) |

The server refuses to start if a required variable is missing.

Demo accounts (created by `npm run seed`) all use the password **`password123`**:
`azib@taskloom.dev` (owner), `ahmad@taskloom.dev` (admin), `hamza@taskloom.dev` (member),
`sara@taskloom.dev` (viewer), `bilal@taskloom.dev` (other workspace).

## Folder structure

```
index.js                 express app, middleware, routes, DB connection
config/db.js             mongoose connection
models/                  Mongoose schemas (User, Workspace, Membership, Invitation,
                         Label, Project, Column, Task, Comment, Activity)
controllers/             request/response logic, one file per resource
routes/                  express routers, mounted under /api/...
middleware/auth.js       verifies the JWT and sets req.user
middleware/rbac.js       role-based access control: access(resource, ...permissions)
middleware/errorHandler.js  404 for unknown routes + one place that turns errors into { message }
utils/permissions.js     the permission matrix (single source of truth for roles)
utils/validate.js        input checks (ids, text lengths, emails, dates, enums)
utils/ApiError.js        errors with an HTTP status (badRequest, forbidden, notFound, …)
utils/asyncHandler.js    forwards errors from async handlers to the error handler
seed/seed.js             inserts the demo data
```

## Role-based access control

Every workspace member has one role. Each protected route declares the permission it needs:

```js
router.patch('/:id', access('project', 'project:manage'), updateProject)
```

`access()` loads the resource in the URL (workspace, project, column or task), finds the
workspace it belongs to, loads the caller's membership there and checks the role
against the matrix in `utils/permissions.js`. Non-members get **403**, and so do members
whose role lacks the permission. The loaded documents are placed on `req`, so controllers
contain no permission checks of their own.

| Permission | Owner | Admin | Member | Viewer |
|------------|:-----:|:-----:|:------:|:------:|
| read workspace, projects, board, tasks, comments, labels, members, activity, search | ✓ | ✓ | ✓ | ✓ |
| `task:write` – create, edit, move tasks | ✓ | ✓ | ✓ | |
| `task:delete-own` – delete tasks you created | ✓ | ✓ | ✓ | |
| `task:delete-any` – delete anyone's task | ✓ | ✓ | | |
| `comment:create` | ✓ | ✓ | ✓ | |
| `project:manage`, `column:manage`, `label:manage` | ✓ | ✓ | | |
| `member:manage`, `invitation:manage` | ✓ | ✓ | | |
| `workspace:rename` | ✓ | ✓ | | |
| `workspace:delete` | ✓ | | | |
| `workspace:leave` | | ✓ | ✓ | ✓ |

The role hierarchy also applies when managing people. Owners manage everyone except other
owners; Admins manage only Members and Viewers, and can invite or assign only those roles.
Nobody can change their own role.

`GET /api/workspaces` and `GET /api/workspaces/:id` return `myRole` and a `permissions`
list for the caller, so a client can show or hide actions using the server's rules.

Data is also scoped to the workspace: assignees must be members, labels must belong to
the workspace, comment mentions of non-members are dropped, and label/invitation deletes
only work on records in that workspace.

## Errors

Every error response is `{ "message": "..." }` with a matching status: 400 (invalid input
or id), 401 (not signed in), 403 (role not allowed), 404 (not found), 409 (conflict, e.g.
a duplicate label or the board changed during a move). Unexpected errors return 500 with a
generic message and are logged on the server.

## API

Auth is a JWT sent as `Authorization: Bearer <token>`. All routes need it except
`register`, `login`, and invitation preview.

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/profile

GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id
PATCH  /api/workspaces/:id
DELETE /api/workspaces/:id
POST   /api/workspaces/:id/leave
GET    /api/workspaces/:id/members
PATCH  /api/workspaces/:id/members/:userId
DELETE /api/workspaces/:id/members/:userId
GET    /api/workspaces/:id/invitations
POST   /api/workspaces/:id/invitations
DELETE /api/workspaces/:id/invitations/:invId
GET    /api/workspaces/:id/labels
POST   /api/workspaces/:id/labels
DELETE /api/workspaces/:id/labels/:labelId
GET    /api/workspaces/:id/projects
POST   /api/workspaces/:id/projects
GET    /api/workspaces/:id/search

GET    /api/invitations/:token
POST   /api/invitations/:token/accept

GET    /api/projects/:id/board
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/columns
POST   /api/projects/:id/tasks

PATCH  /api/columns/:id
DELETE /api/columns/:id

GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/move
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments

GET    /api/activity?projectId=...   (or ?taskId=...)
```

The frontend (`../TaskLoom-FE`) talks to this API through `src/api/client.js`.
