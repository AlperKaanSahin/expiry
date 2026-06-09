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
