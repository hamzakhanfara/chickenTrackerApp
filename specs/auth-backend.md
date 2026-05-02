# User Story — Backend Authentication (Phone OTP via Supabase)

## Story
As a developer, I want to set up the backend authentication layer using Supabase Phone OTP
so that farmers can register and log in using their phone number securely.

---

## Acceptance Criteria

- [ ] Supabase client installed and configured using `@supabase/supabase-js`
- [ ] Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) loaded from `.env`
- [ ] Auth middleware created in `src/middleware/auth.ts` that:
  - Extracts Bearer JWT token from `Authorization` header
  - Verifies token using Supabase
  - Attaches user to `req.user`
  - Returns `401` if token is missing or invalid
- [ ] Two auth routes created in `src/routes/auth.ts`:
  - `POST /auth/send-otp` → accepts `{ phone: string }`, sends OTP via Supabase
  - `POST /auth/verify-otp` → accepts `{ phone: string, token: string }`, verifies OTP and returns Supabase JWT
- [ ] Auth router mounted in `src/index.ts` under `/auth`
- [ ] A protected test route `GET /auth/me` that uses auth middleware and returns the current user info
- [ ] Input validation with Zod on both auth routes
- [ ] Proper error responses:
  - `400` for invalid/missing input
  - `401` for invalid OTP
  - `500` for server errors
- [ ] Phone number format accepted: international format (e.g. `+212XXXXXXXXX`, `+33XXXXXXXXX`)

---

## Folder Structure Changes

```
backend/
├── src/
│   ├── middleware/
│   │   └── auth.ts          # JWT verification middleware
│   ├── routes/
│   │   └── auth.ts          # OTP routes
│   └── index.ts             # Mount auth router
```

---

## Environment Variables to Add in `.env.example`

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Dependencies to Install

- `@supabase/supabase-js`
- `zod`

---

## API Contracts

### POST /auth/send-otp
```json
// Request
{ "phone": "+212612345678" }

// Response 200
{ "success": true, "data": { "message": "OTP sent" } }

// Response 400
{ "success": false, "error": "Invalid phone number format" }
```

### POST /auth/verify-otp
```json
// Request
{ "phone": "+212612345678", "token": "123456" }

// Response 200
{ "success": true, "data": { "access_token": "...", "user": { "id": "...", "phone": "..." } } }

// Response 401
{ "success": false, "error": "Invalid or expired OTP" }
```

### GET /auth/me (protected)
```json
// Response 200
{ "success": true, "data": { "id": "...", "phone": "..." } }

// Response 401
{ "success": false, "error": "Unauthorized" }
```

---

## Out of Scope
- No user profile creation (handled in a future user story)
- No PIN setup logic
- No refresh token handling
- No role-based access control

---

## Definition of Done
- `POST /auth/send-otp` sends a real OTP to the phone number
- `POST /auth/verify-otp` returns a valid JWT on correct OTP
- `GET /auth/me` returns user info with a valid token and 401 without one
