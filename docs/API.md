# CareTrail API Reference

Base URL:

```text
http://localhost:5000/api
```

All request and response bodies use JSON unless noted otherwise.

## Authentication

Protected endpoints require a valid access token:

```http
Authorization: Bearer <accessToken>
```

Access tokens are short-lived JWTs. Refresh tokens are opaque tokens stored as
hashes in MongoDB and rotated each time they are used.

### Token response

Successful provider OTP verification, worker OTP verification, and worker-ID
login return:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque-token>",
  "accessTokenExpiresIn": 900,
  "refreshTokenExpiresAt": "2026-11-20T12:00:00.000Z"
}
```

The actual response wraps this object in a `tokens` property.

## Endpoint summary

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | No | API test/health response |
| POST | `/providers/auth/request-otp` | No | Generate provider OTP |
| POST | `/providers/auth/verify-otp` | No | Verify provider OTP and issue tokens |
| POST | `/providers` | No | Register a healthcare provider |
| GET | `/providers/:id` | Access token | Read the authenticated provider profile |
| PATCH | `/providers/:id` | Access token | Complete or update the authenticated provider profile |
| POST | `/workers/auth/request-otp` | No | Generate worker OTP |
| POST | `/workers/auth/verify-otp` | No | Verify worker OTP and issue tokens |
| POST | `/workers` | No | Register a worker and generate a Worker Health ID |
| POST | `/workers/login` | No | Log in with a Worker Health ID |
| GET | `/workers/:workerId` | Access token | Read the authenticated worker profile |
| POST | `/auth/refresh` | No | Rotate a refresh token |
| POST | `/auth/logout` | No | Revoke a refresh token |

## 1. API test endpoint

### `GET /`

Optional query parameter:

```text
?name=CareTrail
```

Example response:

```json
{
  "success": true,
  "message": "Hello CareTrail! This is a test route.",
  "timestamp": "2026-10-21T17:00:00.000Z",
  "method": "GET"
}
```

## 2. Provider APIs

### `POST /providers`

Creates a provider registration with `pending_verification` status.

Request:

```json
{
  "category": "district_hospital",
  "fullName": "Dr. Ramesh Kumar",
  "designation": "Medical Officer",
  "facilityId": "MH-PUN-CIV-4401",
  "facilityProofUrl": "https://example.com/proof.pdf",
  "phone": "+919876543210",
  "state": "Maharashtra",
  "district": "Pune",
  "consent": true
}
```

Allowed `category` values:

- `district_hospital`
- `phc`
- `mobile_camp`
- `ngo_camp`

Response: `201 Created`

```json
{
  "success": true,
  "message": "Registration submitted for verification",
  "provider": {
    "_id": "671234567890abcdef123456",
    "category": "district_hospital",
    "fullName": "Dr. Ramesh Kumar",
    "designation": "Medical Officer",
    "facilityId": "MH-PUN-CIV-4401",
    "phone": "+919876543210",
    "state": "Maharashtra",
    "district": "Pune",
    "status": "pending_verification",
    "consent": true,
    "createdAt": "2026-10-21T17:00:00.000Z",
    "updatedAt": "2026-10-21T17:00:00.000Z"
  }
}
```

### `POST /providers/auth/request-otp`

Generates a six-digit OTP for the provider phone number. The OTP expires in
five minutes.

Request:

```json
{
  "phone": "+919876543210"
}
```

Response: `201 Created`

```json
{
  "success": true,
  "message": "OTP generated. It expires in 5 minutes.",
  "expiresInSeconds": 300
}
```

When `RETURN_OTP_IN_RESPONSE=true` is enabled for local development, the
response also includes `"otp": "123456"`. Do not enable this in production.

### `POST /providers/auth/verify-otp`

Verifies the latest unused provider OTP. An OTP allows a maximum of five
failed attempts.

Request:

```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```

Response: `200 OK`

```json
{
  "success": true,
  "verified": true,
  "provider": {
    "_id": "671234567890abcdef123456",
    "fullName": "Dr. Ramesh Kumar",
    "phone": "+919876543210",
    "status": "pending_verification"
  },
  "tokens": {
    "accessToken": "<jwt>",
    "refreshToken": "<opaque-token>",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresAt": "2026-11-20T12:00:00.000Z"
  }
}
```

### `GET /providers/:id`

Returns the provider profile belonging to the authenticated access token.

Required header:

```http
Authorization: Bearer <provider-access-token>
```

Response: `200 OK`

```json
{
  "success": true,
  "provider": {
    "_id": "671234567890abcdef123456",
    "fullName": "Dr. Ramesh Kumar",
    "phone": "+919876543210"
  }
}
```

The token subject must match `:id`, and its `userType` must be `provider`.

### `PATCH /providers/:id`

Completes or updates the provider's remaining profile data after phone OTP
verification. The access token returned by
`POST /providers/auth/verify-otp` is required. The token subject must match
`:id`; the phone number and verification status cannot be changed through this
endpoint.

Send the request as `multipart/form-data`. Text fields can include:

```json
{
  "category": "district_hospital",
  "fullName": "Dr. Ramesh Kumar",
  "designation": "Medical Officer",
  "facilityId": "MH-PUN-CIV-4401",
  "facilityProofUrl": "https://example.com/proof.pdf",
  "state": "Maharashtra",
  "district": "Pune",
  "condition": "Mobile camp operating normally",
  "conditionDateTime": "2026-10-23T10:30:00.000Z",
  "conditionStartDateTime": "2026-10-23T09:00:00.000Z",
  "conditionEndDateTime": "2026-10-23T17:00:00.000Z"
}
```

All fields are optional for an update, but at least one text field must be
supplied. The provider details fields are validated as follows:

- `category` must be one of `district_hospital`, `phc`, `mobile_camp`, or
  `ngo_camp`.
- `fullName`, `designation`, `facilityId`, `state`, and `district` must contain
  between 2 and 120 characters, except `state` and `district`, which allow up
  to 80 characters.
- `facilityProofUrl`, when supplied, must be a valid URL.
- `condition` must contain between 2 and 2,000 characters.
- Date/time fields must be valid dates. When both condition boundaries are
  supplied, `conditionEndDateTime` must be at or after
  `conditionStartDateTime`.

Attach the condition evidence image using the multipart field
`conditionPhoto`. The field accepts images only and files are limited to 10 MB.
Images are uploaded to Cloudinary. The API stores the resulting secure URL and
Cloudinary public ID in the provider record.

The endpoint does not accept `phone` or `status` updates. The `consent` field
is part of the provider registration schema and is not required when updating
an existing profile. If a condition photo is supplied, it can be sent together
with any valid text update field.

Response: `200 OK`

```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "provider": {
    "_id": "671234567890abcdef123456",
    "fullName": "Dr. Ramesh Kumar",
    "phone": "+919876543210",
    "status": "pending_verification",
    "condition": "Mobile camp operating normally",
    "conditionDateTime": "2026-10-23T10:30:00.000Z",
    "conditionPhotoUrl": "https://res.cloudinary.com/example/image/upload/condition.jpg"
  }
}
```

## 3. Worker APIs

### `POST /workers`

Creates a worker profile and generates a unique Worker Health ID.

Request:

```json
{
  "fullName": "Rajesh Kumar Verma",
  "phone": "+919876543210",
  "yearOfBirth": 1992,
  "gender": "male",
  "industry": "Construction",
  "homeState": "Bihar",
  "homeDistrict": "Samastipur",
  "workDestination": "Mumbai MMR",
  "consent": true
}
```

Allowed `gender` values:

- `male`
- `female`
- `other`

Response: `201 Created`

```json
{
  "success": true,
  "message": "Worker health ID generated successfully",
  "worker": {
    "_id": "671234567890abcdef123456",
    "workerId": "CTH61582737",
    "fullName": "Rajesh Kumar Verma",
    "phone": "+919876543210",
    "yearOfBirth": 1992,
    "gender": "male",
    "industry": "Construction",
    "homeState": "Bihar",
    "homeDistrict": "Samastipur",
    "workDestination": "Mumbai MMR",
    "consent": true,
    "status": "active"
  }
}
```

### `POST /workers/login`

Logs in with a Worker Health ID and issues access and refresh tokens.

Request:

```json
{
  "workerId": "CTH61582737"
}
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "worker": {
    "_id": "671234567890abcdef123456",
    "workerId": "CTH61582737",
    "fullName": "Rajesh Kumar Verma"
  },
  "tokens": {
    "accessToken": "<jwt>",
    "refreshToken": "<opaque-token>",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresAt": "2026-11-20T12:00:00.000Z"
  }
}
```

### `POST /workers/auth/request-otp`

Request and response are the same as the provider OTP request, but the OTP is
stored for the `worker` role.

Request:

```json
{
  "phone": "+919876543210"
}
```

### `POST /workers/auth/verify-otp`

Request and response are the same shape as provider OTP verification, but the
response contains a `worker` profile and worker tokens.

Request:

```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```

### `GET /workers/:workerId`

Returns the worker profile identified by the public Worker Health ID.

Required header:

```http
Authorization: Bearer <worker-access-token>
```

The token must belong to the requested worker and must have `userType` equal
to `worker`.

Response: `200 OK`

```json
{
  "success": true,
  "worker": {
    "_id": "671234567890abcdef123456",
    "workerId": "CTH61582737",
    "fullName": "Rajesh Kumar Verma",
    "phone": "+919876543210"
  }
}
```

## 4. Token lifecycle APIs

### `POST /auth/refresh`

Rotates a valid refresh token. The submitted token is revoked and cannot be
used again.

Request:

```json
{
  "refreshToken": "<current-refresh-token>"
}
```

Response: `200 OK`

```json
{
  "success": true,
  "tokens": {
    "accessToken": "<new-jwt>",
    "refreshToken": "<new-refresh-token>",
    "accessTokenExpiresIn": 900,
    "refreshTokenExpiresAt": "2026-11-20T12:00:00.000Z"
  }
}
```

### `POST /auth/logout`

Revokes the supplied refresh token. The endpoint is idempotent and returns
success even if the token is already absent or revoked.

Request:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Error responses

Validation errors return `400 Bad Request`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Enter a valid mobile number"
    }
  ]
}
```

Common authentication and resource errors:

| Status | Message | Meaning |
| --- | --- | --- |
| `400` | `Refresh token is required` | Refresh request omitted its token |
| `401` | `Invalid or expired OTP` | OTP is incorrect, expired, consumed, or over the attempt limit |
| `401` | `Invalid or expired access token` | Bearer token is invalid or expired |
| `401` | `Invalid or expired refresh token` | Refresh token is invalid, expired, or revoked |
| `401` | `Access token is required` | Protected endpoint has no Bearer token |
| `403` | `You cannot access this ... profile` | Token belongs to another user |
| `404` | `Provider is not registered` | No provider exists for the verified phone |
| `404` | `Worker ID not found` | Worker ID does not exist |
| `409` | `A record with one of these values already exists` | Phone or another unique field is already registered |

## Local configuration

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/caretrail
RETURN_OTP_IN_RESPONSE=false
JWT_ACCESS_SECRET=replace-this-with-a-random-string-at-least-32-characters
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
```

Start the development server:

```powershell
npm run dev
```
