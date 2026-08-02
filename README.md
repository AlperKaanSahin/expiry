# Expiry

A full-stack mobile marketplace that helps reduce food waste by connecting consumers with local markets offering discounted products nearing their expiration date.

> 🚧 **Status:** Active Development

---

## Overview

Expiry enables local markets to create discounted product packages that are close to their expiration date. Customers can browse nearby markets, purchase available packages, and collect their orders in person.

The platform supports three different roles:

- **User** – Browse markets, purchase packages, track orders, and rate shops.
- **Market** – Manage products, packages, shop information, and incoming orders.
- **Admin** – Review market applications, manage users and shops, and monitor audit logs.

Market owners and administrators can also switch back to the regular customer experience without creating separate accounts.

---

## Features

- JWT authentication with Access & Refresh Tokens
- Role-based authorization (User / Market / Admin)
- Role-based mobile navigation
- Market application & approval workflow
- Product and package management
- Escrow-style order lifecycle
- In-app notification system
- Shop rating system
- Admin audit logs
- Server-side price validation
- Automatic access token renewal
- Account deletion

---

## Tech Stack

### Mobile

- React Native
- Expo
- React Navigation
- Axios

### Backend

- Node.js
- Express.js
- Sequelize ORM

### Database

- MySQL

### Security

- JWT
- bcrypt
- Helmet
- CORS
- express-rate-limit
- express-validator

---

## Architecture

The project follows a layered backend architecture:

- Controllers
- Services
- Models
- Middleware
- Event Handlers

Business logic is isolated inside the service layer while side effects such as notifications and audit logs are handled through an event-driven architecture.

### Highlights

- Role-Based Access Control
- Event-Driven Notifications
- Event-Driven Audit Logs
- Automatic Refresh Token Flow
- Server-Side Price Validation
- Ownership Validation
- Relational Database Design

---

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
- Expo Go or Android/iOS Emulator

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

---

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

---

## API Testing

A complete Postman collection is included for testing the application's API.

It covers:

- Authentication
- Shop application flow
- Product & package management
- Order lifecycle
- Notifications
- Ratings

---

## Roadmap

- Firebase Cloud Messaging
- Push notifications
- Real payment integration
- Email verification
- Password reset
- Automatic order release scheduler
- Automatic package price scheduler
- Maps integration
- Search & filtering
- Swagger/OpenAPI documentation
- Unit tests
- Integration tests
- CI/CD pipeline

---

## Development Goals

Current development focuses on:

- Improving navigation architecture
- Production-ready backend security
- Better notification flow
- Automated testing
- Code quality
- Performance optimization

---

## Author

**Alper Kaan Sahin**

- GitHub: https://github.com/AlperKaanSahin
- LinkedIn: https://www.linkedin.com/in/alperkaansahin/
