# Expiry

A full-stack mobile marketplace that helps reduce food waste by connecting consumers with local markets offering discounted products nearing their expiration date.

🚧 **Status:** Active Development — pre-launch

## Overview

Expiry connects local markets with customers looking for discounted products nearing their expiration date. Markets can create discounted packages from near-expiry products, while customers can browse, purchase, and pick them up in person using QR-based delivery confirmation.

The project is being developed as a real end-to-end product, with the goal of eventually shipping it rather than keeping it as a portfolio-only project.

The platform supports three roles from a single codebase:

- **User** – Browse markets, purchase packages, track orders, and rate shops.
- **Market** – Manage products, packages, shop information, and incoming orders.
- **Admin** – Review market applications, manage users and shops, and monitor audit logs.

A key design decision: roles aren't separate accounts or separate apps. A market owner is a user who has also been granted shop-management permissions — they can switch between browsing as a regular customer and managing their shop with a single tap, without logging in again. The same applies to admins. See [Architecture Highlights](#architecture) below for how this is implemented.

## Features

- JWT authentication with Access & Refresh Tokens (rotation + revocation support)
- Role-based authorization (User / Market / Admin)
- **Workspace-based navigation** — a single codebase serves three distinct experiences (customer, shop owner, admin), with instant, session-preserving switching between them
- Market application & approval workflow (including reapplication after rejection)
- Product and package management with pagination
- QR-based delivery confirmation — single-scan pickup flow
- Escrow-style order lifecycle
- Event-driven, type-based in-app notification system (routes to the correct workspace regardless of who triggered it)
- **Real-time push notifications** (Firebase Cloud Messaging) alongside in-app notifications, backed by the same event bus
- Shop rating system
- Admin audit logs
- Server-side price validation
- Automatic access token renewal
- Password reset with rate limiting and protection against user enumeration
- Account deletion

## Tech Stack

**Mobile**
- React Native
- Expo (EAS Build for development/production builds)
- React Navigation
- Axios
- Firebase Cloud Messaging (`@react-native-firebase/messaging`)

**Backend**
- Node.js
- Express.js
- Sequelize ORM
- firebase-admin (push delivery)
- iyzipay (Iyzico Node SDK)

**Database**
- MySQL

**Security**
- JWT
- bcrypt
- Helmet
- CORS
- express-rate-limit
- express-validator

**Monitoring & Tooling**
- Sentry (error monitoring, backend + frontend)
- Resend (transactional email)
- Postman (E2E API test collection)

**Testing & CI**
- Jest (unit tests)
- GitHub Actions (CI for backend + mobile — dependency validation, Expo config checks, automated tests)

## Architecture

The project follows a layered backend architecture:

- Controllers
- Services
- Models
- Middleware
- Event Handlers

Business logic is isolated inside the service layer while side effects such as notifications and audit logs are handled through an event-driven architecture.

### Highlights

- **Identity / Permissions / Workspace separation** — the mobile app models these as three distinct concepts instead of conflating them: `AuthContext` handles *who* the user is (identity), the user's `role` determines *what* they're allowed to do (permissions), and a separate `WorkspaceContext` tracks *which experience* they're currently using (workspace). A market or admin user can switch their workspace between "customer" and "management" instantly, on the same session, without any backend involvement — the server only ever trusts the JWT's role claim, never a client-declared mode.
- **Type-based notification routing** — notifications route based on their *type* rather than the recipient's role, so a shop owner's own customer-side notifications (e.g. rating a shop they bought from) correctly route to the customer workspace instead of being swallowed by their shop-owner context. The same event that writes an in-app notification also triggers the matching push notification, through one shared handler, so the two channels never drift out of sync.
- **Pagination strategy** — straightforward `LIMIT`/`OFFSET` for most lists; a two-step query (filter + paginate on IDs, then hydrate) for endpoints where filtering depends on an aggregate (e.g. packages with available stock), keeping results accurate without loading full tables into memory.
- **Ownership and ACL checks live in the service layer**, not scattered across controllers — a market can only ever query or mutate its own products, packages, and orders, enforced the same way regardless of which route triggered the call.
- **Centralized error handling** — a custom `AppError` class distinguishes operational errors (safe to show users, e.g. "insufficient stock") from unexpected ones (never exposed with internal details), routed through a single Express error-handling middleware via an async wrapper, instead of each controller handling — and often mishandling — its own errors.
- **Row-level locking on stock reservation** — a `SELECT ... FOR UPDATE` lock (plus deterministic ordering) prevents two concurrent orders from both reserving the same last unit of stock, a race condition that a naive read-then-write would allow.

## Project Structure

```text
expiry/
├── expiry/                 # React Native application
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/         # AuthContext (identity) + WorkspaceContext (workspace switching)
│   │   ├── data/
│   │   ├── events/
│   │   ├── navigation/      # workspace-scoped navigators (user / shop / admin)
│   │   ├── screens/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── theme/
│   │   └── utils/
│
├── expiry_backend/         # Express API
│   ├── controllers/
│   ├── domain/
│   ├── events/
│   ├── handlers/
│   ├── middlewares/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── seeders/
│   ├── services/
│   ├── tests/               # Jest unit tests
│   ├── utils/
│   └── validators/
│
└── postman/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL
- npm
- Expo Go or Android/iOS Emulator (or an EAS development build for native modules like camera, Sentry, and push notifications)

### Backend

```bash
cd expiry_backend
npm install
```

Create the local environment file.

```bash
cp .env.example .env
```

Fill in `.env` with your local database credentials (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_DIALECT`) and any other required secrets.

Run database migrations and seeders.

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Start the server.

```bash
npm start
```

Run the test suite.

```bash
npm test
```

### Mobile

```bash
cd expiry
npm install
```

Create the local environment file.

```bash
cp .env.example .env
```

Example:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Start Expo.

```bash
npx expo start
```

## API Testing

A complete Postman collection is included for testing the application's API.

It covers:

- Authentication
- Shop application flow
- Product & package management
- Order lifecycle
- Notifications
- Ratings

## Recently Completed

- Fixed a database race condition in stock reservation using row-level locking
- Refactored error handling across the entire API into a centralized, consistent pattern
- Set up CI (GitHub Actions) for both backend and mobile, including dependency and config validation
- Started unit testing (Jest), prioritizing the highest-risk business logic
- Push notification tap-routing, correctly workspace-aware (a shop owner's customer-side notifications route to their customer workspace, not their shop panel)

## Roadmap

- Iyzico payment integration — architecturally complete (submerchant model, hosted checkout form), currently blocked on Iyzico's business-registration requirement for their marketplace product
- Email verification
- Automatic order release scheduler
- Automatic package price scheduler
- Maps integration
- Search & filtering
- Swagger/OpenAPI documentation
- Integration tests (Supertest + MySQL service in CI)
- CD pipeline (automated deploy to VPS)

## Development Goals

Current focus, roughly in order:

- Legal pages and transactional email domain setup
- Production rate limiting values (currently using development-friendly defaults)
- Expanding automated test coverage — integration tests with a real MySQL service in CI
- Deployment pipeline: Docker + Nginx + CI/CD to a VPS
- Iyzico payment integration — blocked externally (business registration), not by remaining code work

## Author

**Alper Kaan Sahin**

- LinkedIn: https://www.linkedin.com/in/alperkaansahin/
