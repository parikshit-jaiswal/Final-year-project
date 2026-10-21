# CareTrail API

Express and MongoDB APIs for the provider and migrant worker screens.

## Run locally

1. Copy `.env.example` to `.env`.
2. Start MongoDB locally, or set `MONGODB_URI` to a MongoDB deployment.
3. Run `npm run dev`.

Set `RETURN_OTP_IN_RESPONSE=true` while developing locally to receive the
generated OTP in the request response. OTPs are hashed before storage and
should be delivered through an SMS provider in production.

## API documentation

See the complete endpoint reference in [docs/API.md](./docs/API.md).

Protected endpoints require an `Authorization` header containing a Bearer
access token. Refresh tokens are stored only as hashes and are rotated and
revoked on every refresh.
