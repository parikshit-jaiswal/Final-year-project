# CareTrail API

Express and MongoDB APIs for the provider and migrant worker screens.

## Run locally

1. Copy `.env.example` to `.env`.
2. Start MongoDB locally, or set `MONGODB_URI` to a MongoDB deployment.
3. Run `npm run dev`.

Set `RETURN_OTP_IN_RESPONSE=true` while developing locally to receive the generated
OTP in the request response. OTPs are hashed before they are stored and should be
delivered through an SMS provider in production.

## API endpoints

- `POST /api/providers/auth/request-otp` - request provider phone verification.
- `POST /api/providers/auth/verify-otp` - verify provider OTP.
- `POST /api/providers` - submit provider registration.
- `GET /api/providers/:id` - retrieve provider registration.
- `POST /api/workers/auth/request-otp` - request worker phone verification.
- `POST /api/workers/auth/verify-otp` - verify worker OTP.
- `POST /api/workers` - create a worker health ID.
- `POST /api/workers/login` - log in with a worker ID.
- `POST /api/auth/refresh` - rotate a refresh token and issue a new access token.
- `POST /api/auth/logout` - revoke a refresh token.
- `GET /api/workers/:workerId` - retrieve a worker profile.

Successful OTP verification and worker-ID login return:

```json
{
  "accessToken": "short-lived JWT",
  "refreshToken": "rotating opaque token",
  "accessTokenExpiresIn": 900,
  "refreshTokenExpiresAt": "ISO-8601 timestamp"
}
```

Send the access token to protected endpoints as
`Authorization: Bearer <accessToken>`. Refresh tokens are stored only as hashes
and are rotated and revoked on every refresh.

Provider registration expects `category`, `fullName`, `designation`, `facilityId`,
`phone`, `state`, `district`, and `consent: true`. Worker registration expects
`fullName`, `phone`, `yearOfBirth`, `gender`, `industry`, `homeState`,
`homeDistrict`, `workDestination`, and `consent: true`.
