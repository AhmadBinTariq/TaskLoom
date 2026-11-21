# TaskLoom

A team task-management app (workspaces → projects → Kanban boards → tasks) with
roles, invitations, comments with @mentions, activity history and search. Built
for the Web Programming semester project with the MERN stack.

## Structure

- **`TaskLoom-FE/`** — frontend: React + Redux Toolkit + React Router (Vite).
- **`TaskLoom-BE/`** — backend: Node.js + Express + MongoDB (Mongoose), JWT auth.

Each folder has its own README with details.

## Running the whole app

You need **Node.js** and a running **MongoDB** (`mongodb://localhost:27017`).

```bash
# 1) Backend
cd TaskLoom-BE
npm install
npm run seed      # loads demo data
npm run dev       # API on http://localhost:5000

# 2) Frontend (in a second terminal)
cd TaskLoom-FE
npm install
npm run dev       # app on http://localhost:5173
```

Then open http://localhost:5173.

## Demo accounts

All use the password **`password123`**:

| Email | Role |
|-------|------|
| azib@taskloom.dev | Owner of "Taskloom Team" |
| ahmad@taskloom.dev | Admin |
| hamza@taskloom.dev | Member |
| sara@taskloom.dev | Viewer (read-only) |
