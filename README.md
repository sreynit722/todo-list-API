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
