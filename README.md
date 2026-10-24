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

The Compose JWT secret fallback is for local development only. Set `JWT_SECRET`
to a random value of at least 32 characters in the root `.env` file before
deploying, and never expose the development database credentials to the internet.

## Option B: Docker for the database only, run the rest locally

1. `docker compose up -d db` (PostgreSQL is available locally on port 5433)
2. Set `DB_PORT=5433` in `backend/.env`, then run `cd backend && npm install && npm run start:dev` (runs on http://localhost:3000/api)
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
| POST | /api/auth/signup | 201 + access token and profile; sets an HttpOnly refresh cookie |
| POST | /api/auth/login | 200 + access token and profile; sets an HttpOnly refresh cookie |
| POST | /api/auth/refresh | 200 + rotated access token and profile; rotates the refresh cookie |
| POST | /api/auth/logout | 204 + revokes the refresh token and clears the cookie |

Access tokens expire after 15 minutes and are held only in frontend memory.
Refresh tokens are random, stored hashed in the database, rotated on refresh,
and sent as an HttpOnly, SameSite=Lax cookie scoped to `/api/auth`. Production
must use HTTPS and keep the frontend and API on the same site. TypeORM schema
synchronization is disabled in production; use database migrations to
create/update the schema before deploying.
