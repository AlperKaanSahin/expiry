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
