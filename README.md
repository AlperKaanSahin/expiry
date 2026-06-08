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
