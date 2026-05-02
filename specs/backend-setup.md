# User Story — Backend Initial Setup

## Story
As a developer, I want to set up the initial backend project structure so that I have a clean, 
configured and runnable Node.js server ready to receive future routes and business logic.

---

## Acceptance Criteria

- [ ] Backend folder initialized as a Node.js project with `package.json`
- [ ] TypeScript configured with `tsconfig.json` (strict mode enabled)
- [ ] Express server created and listening on a configurable port via `.env`
- [ ] `.env` file supported via `dotenv` with a `.env.example` committed to git
- [ ] Prisma initialized with a PostgreSQL datasource pointing to Supabase
- [ ] Prisma schema file created with a placeholder `User` model
- [ ] Folder structure created: `src/routes`, `src/controllers`, `src/middleware`, `src/services`
- [ ] A single health check endpoint `GET /health` returning `{ status: "ok" }` to confirm server is running
- [ ] `nodemon` configured for development auto-reload
- [ ] `ts-node` configured to run TypeScript directly in dev mode
- [ ] Scripts defined in `package.json`: `dev`, `build`, `start`
- [ ] `.gitignore` configured to exclude `node_modules`, `dist`, `.env`
- [ ] Server starts without errors with `npm run dev`

---

## Folder Structure Expected

```
backend/
├── src/
│   ├── index.ts           # Entry point, Express app init
│   ├── routes/            # Empty for now
│   ├── controllers/       # Empty for now
│   ├── middleware/        # Empty for now
│   └── services/          # Empty for now
├── prisma/
│   └── schema.prisma      # Initial schema with User model placeholder
├── .env.example           # Environment variable template
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Environment Variables Required (`.env.example`)

```
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

## Dependencies to Install

### Production
- `express`
- `dotenv`
- `@prisma/client`

### Development
- `typescript`
- `ts-node`
- `nodemon`
- `prisma`
- `@types/express`
- `@types/node`

---

## Out of Scope (not in this task)
- No authentication logic
- No business routes (lots, farms, entries...)
- No middleware implementation
- No database seeding
- No deployment configuration

---

## Definition of Done
Running `npm run dev` in the `/backend` folder starts the server and  
`GET http://localhost:3000/health` returns:
```json
{ "status": "ok" }
```
