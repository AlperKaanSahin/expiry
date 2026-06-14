## [refactor] Architecture cleanup & validation layer

### Backend
- Added `express-validator` to all endpoints with a shared `validate` middleware
- Extracted business logic into service layer (Controller → Service pattern)
- Standardized all route files — prefix duplication removed, consistent middleware naming
- Added `express-rate-limit` (disabled in development via `NODE_ENV`)
- Fixed `AUDIT_EVENTS` missing import in `adminService`
- Added `Shop.associate` — `belongsTo User` with `owner` alias
- `adminService.getAllShops` now includes owner info (name, ID)
- Added `shopService.updateShopProfile` and `userService.changePassword`
- Added shop profile update and password change endpoints
- Fixed `deleteShop` — wrapped in transaction to prevent partial deletes
- Fixed `applyShop` — notification type changed to `SHOP_APPLY` / `SHOP_REAPPLY`
- Fixed `notification.handler` — now listens to `SHOP_EVENTS.STATUS_CHANGED` instead of non-emitted `APPROVED`/`REJECTED` events. Users now correctly receive approval/rejection notifications

### Frontend
- Resolved market/shop naming inconsistency across all screens
  - **market** = user role only
  - **shop** = entity owned by a market operator
- Renamed and refactored screens: `MarketProductsScreen` → `ShopProductsScreen`, `MarketPanelScreen` → `ShopPanelScreen`, `MarketOrdersScreen` → `ShopOrdersScreen`, `MarketPackagesScreen` → `ShopPackagesScreen`, `MarketProfileScreen` → `ShopProfileScreen`, `MarketApplyScreen` → `ShopApplyScreen`, `MarketListScreen` → `ShopListScreen`
- `MarketStack` → `ShopStack`
- Cleaned up `api.js` — removed unused functions, renamed functions to match new naming convention, removed all `console.log` calls
- `ShopApplyScreen` — shows "pending" state instead of form when application is already under review
- `ShopApplyScreen` — navigates to `Home` on successful submission
- `ShopListScreen` — displays owner name and ID
- All screens migrated to new design system (COLORS theme, consistent header/hero/card pattern)
- Added `src/theme/colors.js` as shared color palette
