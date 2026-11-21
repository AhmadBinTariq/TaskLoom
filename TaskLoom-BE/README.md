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

`.env` holds `PORT`, `MONGO_URI`, and `JWT_SECRET`.

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
utils/permissions.js     role rules (owner/admin/member/viewer)
seed/seed.js             inserts the demo data
```

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

The frontend (`../TaskLoom-FE`) still uses `localStorage`; connecting it to this API is
the next step.
