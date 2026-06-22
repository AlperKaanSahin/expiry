# Expiry 🛒

> A mobile platform connecting consumers with local markets to purchase discounted products nearing their expiration date — reducing food waste while saving money.

> ⚠️ **Work in Progress – Active Development**

---

## What is Expiry?

Expiry allows markets to list discounted product packages that are close to their expiration date. Consumers can browse nearby markets, purchase packages at reduced prices, and pick up their order in person — with a secure escrow-style order flow that requires confirmation from both sides before the transaction is complete.

The platform supports three roles:

- **User** — browse markets, purchase packages, track orders, rate markets
- **Market** — a role that owns a Shop; manages products, packages, and incoming orders
- **Admin** — approves/rejects market applications, manages users, views audit logs

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Mobile | React Native (Expo), React Navigation, Axios |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | MySQL |
| Auth & Security | JWT (access + refresh tokens), bcrypt, helmet, cors, express-rate-limit, express-validator |

---

## Architecture Highlights

**Escrow-style order lifecycle**
Orders follow a strict state machine to ensure safe transactions:
```
pending → paid → delivered → confirmed → released
```
Each transition is validated server-side, requires the correct role/ownership, and runs inside a database transaction.

**Event-driven notifications & audit logging**
A custom EventBus decouples business logic from side effects. Order status changes, shop approvals, and role changes emit events that trigger notifications and audit log entries — without coupling the core logic to either concern.

**Role-based access control (RBAC)**
Middleware guards (`auth`, `isAdmin`, `onlyMarket`) protect every route based on the authenticated user's role. Ownership is also validated at the service layer (e.g. a market can only edit its own products/packages; a user can only confirm their own orders).

**Refresh token authentication**
Short-lived access tokens (15 min) paired with long-lived refresh tokens (7 days). The mobile client automatically refreshes expired tokens via an Axios interceptor, with an event-driven logout flow if the refresh token is invalid.

**Server-side price integrity**
Order totals are calculated from the database at order-creation time, not trusted from client input — preventing price manipulation.

**Relational data model**
12+ tables with Sequelize ORM, soft deletes (paranoid mode), and a full migration history. Audit logs preserve an `actorSnapshot` so historical records remain meaningful even if the acting user is later deleted.

---

## Project Structure

```
expiry/
├── expiry_backend/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # Sequelize models
│   ├── routes/           # Express routers
│   ├── middlewares/      # Auth, role guards, validation
│   ├── validators/       # express-validator schemas
│   ├── events/           # EventBus & event definitions
│   ├── handlers/         # Event listeners (audit, notification)
│   ├── domain/           # State machine logic
│   ├── migrations/       # Database migrations
│   └── app.js
└── expiry/                # React Native mobile app
    └── src/
        ├── screens/
        ├── navigation/
        ├── services/
        ├── events/
        ├── theme/
        └── context/
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL
- Expo CLI

### Backend Setup

```bash
cd expiry_backend
npm install
cp .env.example .env   # fill in DB credentials, JWT_SECRET, JWT_REFRESH_SECRET
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm start
```

### Mobile Setup

```bash
cd expiry
npm install
npx expo start
```

---

## Roadmap

### Security & Validation
- [x] Input validation with express-validator on all endpoints
- [x] Rate limiting on auth endpoints (login, register)
- [x] Refresh token mechanism (access token expires in 15min)
- [x] Order ownership verification (users/markets can only act on their own orders)
- [x] Server-side price validation on order creation
- [x] Security audit (mass assignment, password leakage, ownership checks)

### Testing
- [ ] Unit tests for state machine logic (order & shop transitions)
- [ ] Integration tests for order lifecycle flow
- [ ] API endpoint tests with supertest

### Features
- [x] In-app notifications (order status updates, shop approval/rejection)
- [x] Shop rating system
- [ ] Push notifications (order status updates)
- [ ] Auto price drop scheduler for packages nearing expiry
- [ ] Payment gateway integration (replacing simulate-payment)
- [ ] Map integration for shop locations
- [ ] Market search & filtering by location/category

### Code Quality
- [x] Consistent error handling across all controllers
- [x] Controller → Service layer separation
- [x] Consistent naming convention (market = role, shop = entity)
- [ ] Centralized logging (replace console.log with a logger like winston)
- [ ] API documentation with Postman collection

---

## Author

**Alper Kaan Şahin**
[LinkedIn](https://www.linkedin.com/in/alper-kaan-%C5%9Fahin-3341a228a) · [GitHub](https://github.com/AlperKaanSahin)
