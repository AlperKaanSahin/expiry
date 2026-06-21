## [security] Refresh token mechanism & security audit

### Backend
- Icon package fix — `react-native-vector-icons` → `@expo/vector-icons` migration
- Refresh token mechanism added — access token (15min) + refresh token (7days) split
- `userService.js`: `generateAccessToken`, `generateRefreshToken`, `refreshAccessToken` added
- `/api/users/refresh` endpoint added
- `app.js`: `trust proxy` setting added — fixed `X-Forwarded-For` rate limiter error
- Removed `bcryptjs` (duplicate of `bcrypt`)
- **Security audit:** fixed mass assignment risks, password leakage in login/register response, missing `actorId` in audit events (`createShop`, `updateShop`, `deleteShop`)
- Order ownership check added — `changeStatus` now validates `userId` + role (user → own order, market → own shop's order, admin → unrestricted)
- `shopPackageService`: added product ownership validation, removed `paranoid: false` bypass, cleaned up debug logs
- `orderService.createOrder`: price now calculated server-side from DB, prevents client-side price manipulation; validates package belongs to the given shop
- `packageService.getShopPackages` fixed — sold-out packages no longer show in shopping screen
- `AuditLog`: added `actorSnapshot` column (migration) — preserves actor info even if user is deleted
- `userService.updateProfile` added — users can now edit their own profile
- Removed unused `adminService.createShop` (dead code, mass-assignment safe but unreachable)

### Frontend
- `api.js`: response interceptor added — auto token refresh on 401
- `AuthContext.js`: `authEvents` integration — auto logout when refresh token is invalid
- `src/events/authEvents.js` created — event-driven auth state sync
- `loginUser`/`registerUser` now store `accessToken`/`refreshToken` separately
- `EditProfileScreen` created — users can update firstName, lastName, phone, address
- `UserProfileScreen`: switched to `useFocusEffect` so profile updates reflect immediately

### Tested
- Token refresh flow verified with short-lived token (10s test)
