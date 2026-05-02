# User Story — Backend Auth Fix (Switch to Email/Password)

## Story
As a developer, I want to update the existing backend authentication from Phone OTP to
Email/Password using Supabase so that we can develop and test without needing a SMS provider.

---

## Acceptance Criteria

- [ ] Replace `POST /auth/send-otp` and `POST /auth/verify-otp` routes with:
  - `POST /auth/register` → accepts `{ email: string, password: string }`
  - `POST /auth/login` → accepts `{ email: string, password: string }`, returns JWT
  - `POST /auth/logout` → invalidates current session
- [ ] Zod validation updated:
  - `email` must be a valid email format
  - `password` minimum 8 characters
- [ ] Error responses:
  - `400` invalid/missing input
  - `401` wrong credentials
  - `409` email already registered
  - `500` server error
- [ ] `GET /auth/me` protected route stays the same — no change needed
- [ ] Auth middleware stays the same — no change needed

---

## API Contracts

### POST /auth/register
```json
// Request
{ "email": "farmer@example.com", "password": "securepassword" }

// Response 201
{ "success": true, "data": { "message": "Registration successful" } }

// Response 409
{ "success": false, "error": "Email already registered" }
```

### POST /auth/login
```json
// Request
{ "email": "farmer@example.com", "password": "securepassword" }

// Response 200
{ "success": true, "data": { "access_token": "...", "user": { "id": "...", "email": "..." } } }

// Response 401
{ "success": false, "error": "Invalid email or password" }
```

### POST /auth/logout
```json
// Response 200
{ "success": true, "data": { "message": "Logged out" } }
```

---

## Out of Scope
- No password reset flow
- No email confirmation flow
- No profile creation
- No PIN logic

---

## Definition of Done
- `POST /auth/register` creates a new user in Supabase
- `POST /auth/login` returns a valid JWT for correct credentials
- `GET /auth/me` still returns user info with valid token and 401 without
