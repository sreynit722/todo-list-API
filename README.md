# Daymark to-do app (React + NestJS + PostgreSQL)

```
todo-app/
├─ docker-compose.yml        PostgreSQL + backend + frontend
├─ backend/                  NestJS API (new)
└─ frontend/                 your existing Vite + React project
   ├─ Dockerfile             (new)
   ├─ .env.example           (new)
   └─ src/
      ├─ App.jsx             (updated: uses the API)
      ├─ App.css             (updated: error banner styles added at the bottom)
      ├─ api.js              (new)
      ├─ index.css           (unchanged)
      └─ main.jsx            (unchanged)
```

## Option A: everything in Docker

1. Put your existing Vite project (package.json, index.html, vite.config.js, ...) in `frontend/`
   and copy the files from `frontend/src` in this zip over your `src` folder.
2. From the `todo-app` folder run: `docker compose up --build`
3. Open http://localhost:5173

## Option B: Docker for the database only, run the rest locally

1. `docker compose up -d db`
2. Backend: `cd backend && npm install && npm run start:dev`  (runs on http://localhost:3000/api)
3. Frontend: `cd frontend && npm install && npm run dev`  (runs on http://localhost:5173)

## API

| Method | Path | Returns |
|---|---|---|
| GET | /api/todos | 200 + list |
| POST | /api/todos | 201 + new to-do, or 400 |
| PATCH | /api/todos/:id | 200 + to-do, or 400 / 404 |
| DELETE | /api/todos/:id | 204, or 404 |
| PUT | /api/todos/reorder | 200 + list (drag and drop order) |
| GET | /api/profile | 200 + profile |
| PATCH | /api/profile | 200 + profile, or 400 |
