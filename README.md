🚀 Security & Architecture Improvements

🔒 Security
- Added global rate limiting
- Added stricter rate limiting for login and register endpoints
- Enforced order ownership validation using req.user.id

🧠 Refactoring
- Refactored oversized controllers
- Moved business logic from controllers to service layer
- Improved separation of concerns and maintainability

🧱 Code Quality
- Cleaner controller structure
- Reduced controller responsibilities
- Improved backend architecture consistency
# 🚀 Backend Refactor & Architecture Improvements

## ✨ Features
- Added Audit Logs screen
- Introduced event-driven architecture (event bus + handlers)
- Centralized shop workflow constants

---

## 🧠 Architecture
- Refactored God Service/Object into modular service + domain events
- Separated business logic from side effects (notifications, future audit logs)
- Improved overall scalability and maintainability

---

## 🔁 Domain Logic
- Implemented Shop State Machine (FSM)
- Added `inactive` state
- Enforced strict status transitions:

  - pending → active / rejected  
  - active → inactive  
  - inactive → active  
  - rejected → terminal

---

## 🔔 Event System
- Added `shop.status.changed` event
- Implemented notification handler (event-driven)
- Prepared structure for future audit logging

---

## 🧱 Code Quality
- Centralized business rules via constants
- Clear separation of concerns:
  - Controller → Service → Domain Events
- Reduced side effects inside service layer
### Updates

* Moved market activation checks from `user.role === 'market' && shop.status === 'active'` into a centralized `isMarketActive` state within `AuthContext`.
* Refactored application navigation structure by modularizing `AdminStack` and `MarketStack`, simplifying `AppStack`.
* Improved role-based access control and centralized market-shop relationship management.
* Implemented Notification module:

  * Created Notification model, service, controller, and routes.
  * Added notification listing and read-status functionality.
  * Developed Notification Screen with navigation support.
  * Integrated unread notification count into the Home Screen.
* Added admin notifications for new market applications and re-application requests.
* Improved market application workflow, including rejected application re-submission support.
## 🚀 Recent Changes

### ✨ Features
- Implemented a custom entity-based Audit Log system (`auditService`, `auditHelper`)
- Added "Apply for Shop" flow with full admin approval process
- Introduced admin-controlled shop approval workflow for all shop creations

### 🛠 Improvements
- Fixed data inconsistencies in shop–market ownership and relationship logic

### 🧹 Refactoring / Cleanup
- Temporarily removed `createShopWithUser` due to architectural changes in the shop creation flow
## Recent Improvements

- Auth system refactored (AuthContext)
- Logout logic centralized
- Role-based navigation added (admin / user / market)
- Home screen dynamic menu based on user role

## Recent Improvements

### 1. Order UI Refactor
- Orders are now split into:
  - Active Orders
  - Past Orders

### 2. Status Filtering Fix
- "confirmed" orders now correctly move to **Past Orders**
- Active Orders now only include:
  - pending
  - paid
  - delivered

### 3. Order Flow Alignment
Backend state machine is fully reflected in UI:
pending → paid → delivered → confirmed → released

### 4. API Fixes
- Fixed incorrect order status update handling
- Unified "/orders/:id/status" endpoint usage

### 5. Ngrok Migration
- Backend connection switched to Ngrok for mobile testing
- Localhost removed from production testing flow
- Moved logic from adminController to adminService (removed controller bloat)
- Added pagination to admin users list
- Converted user profile endpoint from static data to dynamic data
- Implemented role update feature for users (admin/users/:id/role)
- Added email-based search in admin users endpoint
