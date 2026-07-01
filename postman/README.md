## Postman Collection

Import `expiry-collection.json` into Postman to run the full e2e test suite.

### Environment Variables

Create a new environment in Postman with the following variables:

| Variable | Description |
|---|---|
| baseUrl | http://localhost:3000/api |
| accessToken | Set automatically by login scripts |
| adminToken | Set automatically by admin login scripts |
| buyerToken | Set automatically by buyer login scripts |
| refreshToken | Set automatically by login scripts |
| email | Set automatically by register scripts |
| password | Set automatically by register scripts |