# Expiry

A full-stack mobile marketplace that helps reduce food waste by connecting consumers with local markets offering discounted products nearing their expiration date.

🚧 **Status:** Active Development — pre-launch

## Overview

Expiry enables local markets to create discounted product packages that are close to their expiration date. Customers can browse nearby markets, purchase available packages, and collect their orders in person via a QR-based pickup flow.

The platform supports three different roles:

- **User** – Browse markets, purchase packages, track orders, and rate shops.
- **Market** – Manage products, packages, shop information, and incoming orders.
- **Admin** – Review market applications, manage users and shops, and monitor audit logs.

A key architectural decision: roles aren't separate accounts or separate apps. A market owner is a user who has also been granted shop-management permissions — they can switch between browsing as a regular customer and managing their shop with a single tap, without logging in again. The same applies to admins. See [Architecture Highlights](#architecture) below for how this is implemented.

## Features

- JWT authentication with Access & Refresh Tokens (rotation + revocation support)
- Role-based authorization (User / Market / Admin)
- **Workspace-based navigation** — a single codebase serves three distinct experiences (customer, shop owner, admin), with instant, session-preserving switching between them
- Market application & approval workflow (including reapplication after rejection)
- Product and package management with pagination
- QR-based delivery confirmation — single-scan pickup flow
- Escrow-style order lifecycle
- Event-driven, type-based in-app notification system (routes to the correct workspace regardless of who triggered it)
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

**Backend**
- Node.js
- Express.js
- Sequelize ORM

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
- **Type-based notification routing** — notifications route based on their *type* rather than the recipient's role, so a shop owner's own customer-side notifications (e.g. rating a shop they bought from) correctly route to the customer workspace instead of being swallowed by their shop-owner context.
- **Event-Driven Notifications & Audit Logs** — order/shop status changes emit events consumed by dedicated handlers, decoupling business logic from side effects.
- **Pagination strategy** — straightforward `LIMIT`/`OFFSET` for most lists; a two-step query (filter + paginate on IDs, then hydrate) for endpoints where filtering depends on an aggregate (e.g. packages with available stock), keeping results accurate without loading full tables into memory.
- **Automatic Refresh Token Flow**
- **Server-Side Price Validation**
- **Ownership Validation**
- **Relational Database Design**
  
## Project Structure

```text
expiry/
├── expiry/                 # React Native application
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── data/
│   │   ├── events/
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
- Expo Go or Android/iOS Emulator (or an EAS development build for native modules like camera/Sentry)

### Backend

```bash
cd expiry_backend
npm install
```

Create local configuration files.

```bash
cp .env.example .env
cp config/config.example.json config/config.json
```

Run database migrations and seeders.

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Start the server.

```bash
npm start
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

## Roadmap

- Firebase Cloud Messaging / push notifications
- Real payment integration
- Email verification
- Automatic order release scheduler
- Automatic package price scheduler
- Maps integration
- Search & filtering
- Swagger/OpenAPI documentation
- Unit tests
- Integration tests
- CI/CD pipeline

## Development Goals

Current development focuses on:

- Final QA pass ahead of launch
- Production-ready backend security (rate limiting tuning, domain verification for transactional email)
- Automated testing
- Code quality
- Performance optimization

## Author

**Alper Kaan Sahin**

- GitHub: https://github.com/AlperKaanSahin
- LinkedIn: https://www.linkedin.com/in/alperkaansahin/
