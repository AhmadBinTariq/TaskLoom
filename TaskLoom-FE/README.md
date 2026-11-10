# TaskLoom – Frontend

A team task-board app (workspaces → projects → Kanban boards → tasks) built with
**React + Redux Toolkit + React Router**, in the style taught in class.

## Tech used

- **React** (function components + hooks: `useState`, `useEffect`, `useParams`, `useNavigate`, `useSearchParams`)
- **Redux Toolkit** (`createSlice`) + **React Redux** (`useSelector`, `useDispatch`) for state
- **React Router** (`react-router-dom`) for pages
- **@hello-pangea/dnd** for drag-and-drop on the board
- **Vite** for the dev server and build
- Plain CSS files (one per component/page)

There is **no backend yet**. All data (users, workspaces, projects, tasks, …) is kept
in the Redux store and saved to the browser's `localStorage`, so it survives refreshes.
The backend will live in the sibling `TaskLoom-BE` folder later.

## Run it

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build
npm run lint     # check the code
```

## Demo accounts

The app starts with some example data. On the login page, click a name to fill the form.
All demo accounts use the password **`password123`**:

| Email | Role in "Taskloom Team" |
|-------|-------------------------|
| azib@taskloom.dev | Owner |
| ahmad@taskloom.dev | Admin |
| hamza@taskloom.dev | Member |
| sara@taskloom.dev | Viewer (read-only) |
| bilal@taskloom.dev | Owns a different workspace |

## Folder structure

```
src/
  main.jsx              app entry: <Provider> + <BrowserRouter>
  App.jsx               all the routes (<Routes>/<Route>)
  index.css             global styles + theme colours
  app/
    store.js            configureStore + save-to-localStorage
    seed.js             demo users and data
    permissions.js      who can do what (owner/admin/member/viewer)
    format.js           date helpers
    filters.js          task filter helpers
    theme.js            light/dark theme helper
  features/
    auth/authSlice.js   users, login, register, profile
    data/dataSlice.js   workspaces, projects, tasks, comments, … + selectors
    ui/uiSlice.js        toast messages
  components/            reusable pieces (layout, modal, task card, …)
  pages/                 one file per page (Login, Board, Members, …)
```

## How data flows

1. A page reads data with `useSelector(...)` (selectors live in `dataSlice.js`).
2. When the user does something, the page calls `dispatch(someAction(...))`.
3. The reducer in the slice updates the state.
4. `store.subscribe` saves the new state to `localStorage`.

When the backend is ready, the plan is to replace the reducers' direct updates with
calls to the API and keep the same component code.
