# Expiry 🛒

> A mobile platform connecting consumers with local markets to purchase discounted products nearing their expiration date — reducing food waste while saving money.

> ⚠️ **Work in Progress – Active Development**

---

## What is Expiry?

Expiry allows markets to list discounted product packages that are close to their expiration date. Consumers can browse nearby markets, purchase packages at reduced prices, and track their orders through a secure escrow-based payment flow.

The platform supports three distinct user roles:
- **User** — browse markets, purchase packages, track orders
- **Market Operator** — manage products, create packages, handle deliveries
- **Admin** — approve/reject market applications, manage users, view audit logs

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Mobile | React Native (Expo), React Navigation, Axios |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | MySQL |
| Auth & Security | JWT, bcrypt, helmet, cors |

---

## Architecture Highlights

**Escrow-based order lifecycle**
Orders follow a strict state machine to ensure safe transactions:
```
pending → paid → delivered → confirmed → released
```
Each transition is validated and database transactions are used to guarantee data integrity.

**Event-driven audit logging**
Admin actions (role changes, shop approvals, deletions) are automatically logged via a custom EventBus, keeping a full audit trail without coupling business logic to logging code.

**Role-based access control (RBAC)**
Three middleware guards (`auth`, `isAdmin`, `onlyMarket`) protect every route based on the authenticated user's role.

**Relational data model**
12+ tables with Sequelize ORM, soft deletes (paranoid mode), and a full migration history.

---

## Project Structure

```
expiry/
├── expiry_backend/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # Sequelize models
│   ├── routes/           # Express routers
│   ├── middlewares/      # Auth, role guards
│   ├── events/           # EventBus & event definitions
│   ├── handlers/         # Event listeners (audit, notification)
│   ├── domain/           # State machine logic
│   ├── migrations/       # Database migrations
│   └── app.js
└── expiry/               # React Native mobile app
    └── src/
        ├── screens/
        ├── navigation/
        ├── services/
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
cp .env.example .env   # fill in your DB credentials and JWT secret
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
- [ ] Input validation with express-validator on all endpoints
- [ ] Rate limiting on auth endpoints (login, register)
- [ ] Refresh token mechanism (current JWT expires in 1h)
- [ ] Order ownership verification (prevent users accessing other users' orders)

### Testing
- [ ] Unit tests for state machine logic (order & shop transitions)
- [ ] Integration tests for order lifecycle flow
- [ ] API endpoint tests with supertest

### Features
- [ ] Push notifications (order status updates)
- [ ] Auto price drop scheduler for packages nearing expiry
- [ ] Payment gateway integration (replacing simulate-payment)
- [ ] Market search & filtering by location

### Code Quality
- [ ] Consistent error handling across all controllers
- [ ] Centralized logging (replace console.log with a logger like winston)
- [ ] API documentation with Postman collection (importable & runnable)

---

## Author

**Alper Kaan Şahin**
[LinkedIn](https://www.linkedin.com/in/alper-kaan-%C5%9Fahin-3341a228a) · [GitHub](https://github.com/AlperKaanSahin)
