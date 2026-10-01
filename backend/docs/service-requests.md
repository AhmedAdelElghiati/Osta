# Service Requests API

All endpoints require an authenticated user with role `customer`. The API is mounted at `/api/v1/requests` and uses the existing access token cookie or `Authorization: Bearer <token>`.

## Request management

- `POST /` creates a `DRAFT`. Body: `title`, `description`, `craftId`, `location { city, area, address, latitude?, longitude? }`, `preferredDate?`, `preferredTime?`, `budget { min, max, currency? }`, `receiveMode`.
- `GET /me` lists only the current customer's requests. Query: `page`, `limit` (1-100), `status`, `craftId`, `search`, `sortBy`, `sortOrder`.
- `GET /:id` returns an owned request and its active craft.
- `PATCH /:id` updates only `title`, `description`, `craftId`, `location`, `preferredDate`, `preferredTime`, `budget`, and `receiveMode` while status is `DRAFT` or `PUBLISHED`.

## Lifecycle

- `POST /:id/publish` changes `DRAFT` to `PUBLISHED` after required data validation.
- `POST /:id/cancel` changes `PUBLISHED` to `CANCELLED`. Body: `{ "reason": "..." }`.
- `POST /:id/republish` changes `CANCELLED` to `PUBLISHED` and clears cancellation data.

Invalid transitions return `409`. Ownership failures are intentionally returned as `404`.

## Timeline and images

- `GET /:id/timeline` returns owned events oldest first.
- `POST /:id/images` accepts multipart field `images`, up to 10 files, JPEG/PNG/WebP, 5 MB per file.
- `DELETE /:id/images/:imageId` removes an owned image and its local stored file.

Success responses use `{ success, message, data }`; validation and authorization errors use the same response shape. User-facing messages are Egyptian Arabic. Status values are `DRAFT`, `PUBLISHED`, `OFFER_RECEIVED`, `OFFER_ACCEPTED`, `AWAITING_PAYMENT`, `INSPECTION`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `DISPUTED`, and `EXPIRED`.

Run development seed data with:

```bash
npm run seed:service-requests
```

This creates Egyptian crafts, one customer, and draft/published/cancelled requests using EGP budgets.
