# Daymark to-do app (React + NestJS + PostgreSQL)

```
todo-app/
├─ docker-compose.yml        PostgreSQL + backend + frontend
├─ backend/                  NestJS API (new)
└─ frontend/                 
   ├─ Dockerfile             (new)
   ├─ .env.example           (new)
   └─ src/
      ├─ App.jsx             (updated: uses the API)
      ├─ App.css             
      ├─ api.js              
      ├─ index.css           
      └─ main.jsx            
```

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
