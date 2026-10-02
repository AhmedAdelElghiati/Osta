# Marketplace Production Plan

## Current baseline

- Canonical frontend: root `src/`; `Frontend/` is a duplicate and must not receive new features.
- Backend: Express/Mongoose API under `backend/src/`.
- Angular build and tests are currently blocked by Node `24.12.0`; Angular CLI 22.1 requires Node `24.15.0+` or `22.22.3+`.
- Authentication uses secure cookie sessions with refresh support.

## Delivery phases

### Phase 0: Foundation and release safety

- Upgrade the development/CI Node version and pin it with `.nvmrc` or an equivalent toolchain file.
- Remove or archive the duplicate `Frontend/` application after confirming no deployment references it.
- Add environment configuration for API origin, production build budgets, and CI checks.
- Replace stale smoke tests with meaningful route, service, and accessibility tests.
- Add structured logging, health/readiness endpoints, request IDs, and production error reporting.

### Phase 1: Canonical role workflows

- Consolidate the artisan experience into one API-backed dashboard.
- Implement customer request creation, editing, publishing, cancellation, offers, acceptance, and review flows against the API.
- Implement artisan profile loading/editing, market search, offer submission/withdrawal, active jobs, and earnings from persisted data.
- Implement admin user management, artisan verification, contact inbox, and operational states.

### Phase 2: Data and business integrity

- Add request/offer lifecycle state-machine validation and authorization tests.
- Add idempotency for payments, wallet mutations, offer actions, and retries.
- Add MongoDB indexes, pagination limits, query validation, and transaction boundaries for wallet/escrow operations.
- Define audit events for authentication, profile changes, request lifecycle, offer lifecycle, and admin actions.

### Phase 3: Security and reliability

- Enforce secure cookie/CORS/CSRF policy per environment, secret validation at startup, and password/session rotation rules.
- Add abuse protection for auth, uploads, contact, and search; validate upload type, size, and storage lifecycle.
- Add automated dependency/security scans, backup/restore verification, and rate-limit observability.
- Add contract tests for every frontend service and integration tests for every protected API route.

### Phase 4: UX completeness

- Add loading, empty, error, retry, optimistic-update, and offline-aware states to every data screen.
- Ensure responsive Arabic RTL layouts, keyboard navigation, semantic labels, focus management, and screen-reader announcements.
- Add consistent notifications, confirmation dialogs, pagination/filter persistence, and accessible form validation.

### Phase 5: Release and operations

- Add Docker/production configuration, migrations/seeding policy, CI/CD, staging smoke tests, and rollback documentation.
- Run build, unit, integration, security, accessibility, and browser-flow gates before release.
- Publish API documentation, environment variable reference, support runbook, and incident procedures.

## First implementation slice

1. Make the API-backed artisan dashboard canonical.
2. Load the artisan profile from the authenticated user and persist it through the artisan endpoint.
3. Redirect the legacy mock dashboard route to the canonical dashboard.
4. Restore validation once the supported Node version is installed, then add focused dashboard tests.

## Completed in the current iteration

- Canonicalized the artisan dashboard and removed the legacy mock dashboard route.
- Replaced the customer demo offers/comparison screen with persisted offer data and real accept/reject actions.
- Added admin artisan listing and verification controls backed by the API.
- Corrected admin contact field bindings and stale Angular smoke-test expectations.
- Verified Angular TypeScript checks and backend regression tests (13 tests passing).
