# Expiry

> A mobile platform connecting consumers with local markets to purchase discounted products nearing their expiration date, reducing food waste while helping users save money.

> Status: Work in progress - active development

---

## What Is Expiry?

Expiry allows local markets to list discounted product packages that are close to their expiration date. Users can browse markets, purchase available packages, and pick up their orders in person.

The application supports three main roles:

- **User**: browses markets, purchases packages, tracks orders, and rates markets
- **Market**: owns a shop, manages products/packages, and handles incoming orders
- **Admin**: approves or rejects market applications, manages users, and reviews audit logs

The project is being developed both as a portfolio project and as a product candidate.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Mobile | React Native, Expo, React Navigation, Axios |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | MySQL |
| Auth & Security | JWT access/refresh tokens, bcrypt, helmet, cors, express-rate-limit, express-validator |

---

## Architecture Highlights

### Role-Based Access Control

The backend uses authentication and role-based middleware such as `auth`, `isAdmin`, and `onlyMarket` to protect API routes. Service-layer ownership checks are used for sensitive actions such as managing shop resources and order status changes.

### Order Lifecycle

Orders follow an escrow-style lifecycle:

```text
pending -> paid -> delivered -> confirmed -> released
```

Most order transitions are validated server-side with role and ownership checks. Payment is currently simulated during development and is planned to be replaced with a real payment provider.

### Event-Driven Notifications And Audit Logs

The backend includes a custom event flow for side effects such as notifications and audit logs. This keeps core business logic separate from notification and logging concerns.

### Server-Side Price Integrity

Order totals are calculated from database values instead of trusting client-provided prices. This helps prevent price manipulation from the mobile client.

### Relational Data Model

The backend uses Sequelize models, migrations, and relational tables for users, shops, products, packages, package units, orders, notifications, ratings, and audit logs.

---

## Project Structure

```text
expiry/
├── expiry/                  # React Native mobile app
│   ├── src/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── events/
│   │   ├── theme/
│   │   └── context/
│   ├── App.js
│   └── package.json
│
└── expiry_backend/          # Express backend API
    ├── controllers/         # Request handlers
    ├── services/            # Business logic
    ├── models/              # Sequelize models
    ├── routes/              # Express routes
    ├── middlewares/         # Auth, role guards, validation
    ├── validators/          # express-validator schemas
    ├── events/              # Event definitions and event bus
    ├── handlers/            # Event listeners
    ├── migrations/          # Database migrations
    ├── seeders/             # Seed data
    ├── config/              # Sequelize config examples
    ├── app.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL
- Expo CLI or Expo Go
- npm

---

## Backend Setup

```bash
cd expiry_backend
npm install
```

Create local environment files:

```bash
cp .env.example .env
cp config/config.example.json config/config.json
```

Update `.env` with your local values:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=expiry_dev
DB_DIALECT=mysql

NODE_ENV=development
PORT=5000

JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me
```

Run database migrations and seeders:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Start the backend:

```bash
npm start
```

By default, the backend runs on:

```text
http://localhost:5000
```

---

## Mobile Setup

```bash
cd expiry
npm install
```

Create the local mobile environment file:

```bash
cp .env.example .env
```

Example frontend environment:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Start the Expo app:

```bash
npx expo start
```

---

## Environment And Git Notes

Local environment and configuration files are ignored by Git:

```text
.env
expiry/.env
expiry_backend/.env
expiry_backend/config/config.json
```

Example files are committed so the project can be configured locally:

```text
expiry/.env.example
expiry_backend/.env.example
expiry_backend/config/config.example.json
```

---

## Current Features

- User registration and login
- JWT-based authentication
- Role-based user, market, and admin flows
- Market application flow
- Admin approval/rejection for market applications
- Shop product and package management
- Order creation and order lifecycle tracking
- In-app notifications
- Shop rating system
- Audit log foundation for admin actions
- Server-side price calculation for orders

---

## Roadmap

### Security And Auth

- [x] JWT access token authentication
- [x] Refresh token flow on the mobile client
- [x] Password hashing with bcrypt
- [x] Basic rate limiting on auth routes
- [x] Server-side price validation
- [x] Core ownership checks for sensitive order/shop actions
- [ ] Persist, rotate, and revoke refresh tokens server-side
- [ ] Complete security audit for ownership checks and mass assignment risks
- [ ] Improve production error handling and logging

### Testing

- [ ] Unit tests for order state transitions
- [ ] Unit tests for shop application/status transitions
- [ ] Integration tests for authentication flow
- [ ] Integration tests for order lifecycle
- [ ] API endpoint tests with Supertest

### Product Features

- [x] In-app notifications
- [x] Shop rating system
- [x] Admin audit log foundation
- [ ] Push notifications
- [ ] Real payment provider integration
- [ ] Auto price-drop scheduler
- [ ] Map integration for shop locations
- [ ] Market search and filtering
- [ ] Order cancellation/refund flow

### Code Quality

- [x] Controller-service-model separation in the backend
- [x] Sequelize migrations for database schema changes
- [x] Environment example files for local setup
- [ ] API documentation with Postman or OpenAPI
- [ ] Centralized logger
- [ ] Consistent response/error format
- [ ] CI checks for linting and tests

---

## Development Status

This project is actively being improved with a focus on:

- production-readiness
- backend security
- clean Git workflow
- small pull requests
- readable project documentation
- test coverage for critical business logic

---

## Author

**Alper Kaan Sahin**

- GitHub: [AlperKaanSahin](https://github.com/AlperKaanSahin)
- LinkedIn: [Alper Kaan Sahin](https://www.linkedin.com/in/alper-kaan-%C5%9Fahin-3341a228a)
