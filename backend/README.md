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

Interactive OpenAPI documentation is available at `http://localhost:5001/api-docs` when the backend is running. Use the **Authorize** button to provide a Bearer access token; browser clients may also authenticate with the HTTP-only `accessToken` cookie.

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

## Service Requests API

Service Requests are available under `/api/v1/requests`. All endpoints require authentication and the `customer` role. The authenticated user's ID is always used as `customerId`.

### Request management

- `POST /api/v1/requests` creates a request as `DRAFT`.
- `GET /api/v1/requests/me` lists the current customer's requests.
- `GET /api/v1/requests/:id` returns one owned request.
- `PATCH /api/v1/requests/:id` updates editable fields while the request is `DRAFT` or `PUBLISHED`.

The list endpoint supports `page`, `limit` (maximum `100`), `status`, `craftId`, `search`, `sortBy`, and `sortOrder` query parameters. Search is performed in MongoDB across the request title and description.

### Request lifecycle

- `POST /api/v1/requests/:id/publish`: `DRAFT` to `PUBLISHED`.
- `POST /api/v1/requests/:id/cancel`: `PUBLISHED` to `CANCELLED`. Body: `{ "reason": "..." }`.
- `POST /api/v1/requests/:id/republish`: `CANCELLED` to `PUBLISHED`.

The supported status values are `DRAFT`, `PUBLISHED`, `OFFER_RECEIVED`, `OFFER_ACCEPTED`, `AWAITING_PAYMENT`, `INSPECTION`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `DISPUTED`, and `EXPIRED`. Only the three Service Requests transitions above are implemented.

### Timeline and images

- `GET /api/v1/requests/:id/timeline` returns the owned request events from oldest to newest.
- `POST /api/v1/requests/:id/images` uploads multipart files using the `images` field.
- `DELETE /api/v1/requests/:id/images/:imageId` deletes an owned image.

Images must be JPEG, PNG, or WebP and each file must be no larger than 5 MB. Up to 10 images can be attached to one request. Image files are stored locally under `uploads/requests`; only image metadata is stored in MongoDB.

Request responses use `{ success, message, data }`. Service Request messages are localized in Egyptian Arabic. Ownership failures are intentionally returned as `404`.

## Service Request development seed

Create Egyptian crafts, a customer, and draft/published/cancelled requests with EGP budgets:

```bash
npm run seed:service-requests
```

## Tests

Run the complete backend test suite:

```bash
npm test -- --runInBand
```

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
