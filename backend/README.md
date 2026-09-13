# Osta Authentication API

This backend provides a production-oriented authentication and authorization foundation for a marketplace platform with customer, artisan, and admin roles.

## Environment

Copy `.env.example` to `.env` and provide secure values for all secrets.

## Authentication model

- `User`: stores identity and auth fields (`name`, `email`, `phone`, `password`, `role`, active status, verification state, password reset state)
- `Artisan`: stores artisan-specific profile data and links to `User` via `userId`
- `Session`: stores hashed refresh tokens for rotation, revocation, and logout support

## Core security behaviors

- Passwords are hashed with `bcryptjs` before persistence.
- Access tokens and refresh tokens use separate secrets and expiration values.
- Refresh tokens are stored as hashes in the database and are revoked on logout or password change.
- HTTP-only cookies are used to store tokens for browser clients.
- Public registration does not allow `admin` creation; admin creation is handled via a protected bootstrap script.

## API endpoints

### POST /api/auth/register

- Auth: No
- Body: `name`, `email`, `phone`, `password`, `role`, optional artisan fields (`profession`, `bio`, `experienceYears`, `skills`, `serviceAreas`, `hourlyRate`, `location`)
- Success: `201`
- Errors: `400`, `409`

### POST /api/auth/login

- Auth: No
- Body: `email`, `password`
- Success: `200`
- Sets secure HTTP-only access and refresh cookies
- Errors: `401`

### POST /api/auth/logout

- Auth: Required
- Success: `200`
- Revokes refresh session and clears cookies

### POST /api/auth/logout-all

- Auth: Required
- Success: `200`
- Revokes all active sessions for the current user

### GET /api/auth/me

- Auth: Required
- Success: `200`
- Returns authenticated user profile and optional artisan profile

### POST /api/auth/refresh

- Auth: Not required via cookie or body token
- Body or cookie: `refreshToken`
- Success: `200`
- Rotates refresh token and issues a new access token

### PATCH /api/auth/change-password

- Auth: Required
- Body: `currentPassword`, `newPassword`
- Success: `200`
- Errors: `400`

### POST /api/auth/forgot-password

- Auth: No
- Body: `email`
- Success: `200` with generic response
- Does not reveal whether the account exists

### POST /api/auth/reset-password

- Auth: No
- Body: `token`, `newPassword`
- Success: `200`
- Invalid or expired tokens return `400`

### POST /api/auth/verify-email

- Auth: No
- Body: `token`
- Success: `200`

## Authorization

- `authorize('admin')` restricts admin-only routes
- `authorize('artisan')` restricts artisan-only routes
- `authorize('customer')` restricts customer-only routes
- `authorize('admin', 'artisan')` allows multiple roles

## Admin bootstrap

Run:

```bash
npm run seed:admin
```

Set environment variables before running the command:

```bash
ADMIN_NAME="System Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PHONE="+1000000000"
ADMIN_PASSWORD="AdminPass123!"
```
