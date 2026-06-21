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
