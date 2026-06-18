# [refactor] Architecture cleanup + rating & notification system improvements

---

## Backend

- Moved business logic to service layer (Controller → Service pattern)
- Added express-validator with shared validate middleware
- Standardized route structure and removed inconsistencies
- Added express-rate-limit (env-based enable/disable)
- Fixed shop-user relationship (Shop.belongsTo User)
- Admin shop list now includes owner info
- Added shop profile update & password change endpoints
- Fixed deleteShop transaction handling
- Fixed shop apply notification flow (SHOP_APPLY / SHOP_REAPPLY)

### Event System
- Added order.events.js
- Introduced ORDER_EVENTS.CONFIRMED
- Implemented event-driven notification pipeline (order → event → handler)

### Rating System
- Added ShopRating service integration
- Enabled order-based rating (only confirmed orders)
- Prevented duplicate ratings per order
- Fixed rateShop validation flow

### Notification System
- Extended Notification model (targetId, orderId)
- Added migration for new fields
- Added RATE_SHOP notification type
- Updated notification handler for order lifecycle events

---

## Frontend

- Renamed all Market → Shop screens for consistency
- Refactored navigation (MarketStack → ShopStack)
- Integrated RateShopScreen into ShopStack
- Fixed notification-driven navigation flow
- ShopDetail now shows real ratingAverage
- Updated API layer (cleaned unused functions, removed logs)
- Improved ShopApplyScreen (pending state + auto redirect)
- Applied unified design system (COLORS theme)

---

## Summary

Refactored backend architecture, introduced event-driven notification system, fixed rating flow, and aligned frontend navigation + naming structure for consistency and scalability.
