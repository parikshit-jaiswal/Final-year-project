# CareTrail API

Express and MongoDB APIs for the provider and migrant worker screens.

## Run locally

1. Copy `.env.example` to `.env`.
2. Start MongoDB locally, or set `MONGODB_URI` to a MongoDB deployment.
3. Run `npm run dev`.

Set `RETURN_OTP_IN_RESPONSE=true` while developing locally to receive the
generated OTP in the request response. OTPs are hashed before storage and
should be delivered through an SMS provider in production.

## Available commands

```powershell
npm run dev        # Start the development server with file watching
npm run typecheck  # Check TypeScript without generating dist/
npm run build      # Compile TypeScript into dist/
npm start          # Run the compiled production server
```

## Deploy on Render

Create a Render **Web Service** connected to this repository with:

| Render setting | Value |
| --- | --- |
| Environment | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

Add these environment variables in the Render dashboard:

```text
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_ACCESS_SECRET=<random secret with at least 32 characters>
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_DAYS=30
RETURN_OTP_IN_RESPONSE=false
CLOUDINARY_CLOUD_NAME=<your Cloudinary cloud name>
CLOUDINARY_API_KEY=<your Cloudinary API key>
CLOUDINARY_API_SECRET=<your Cloudinary API secret>
```

Render automatically provides `PORT`; the server listens on that value.
Configure an SMS provider before enabling real OTP authentication. Never set
`RETURN_OTP_IN_RESPONSE=true` in production.

After deployment, verify the service with:

```text
GET https://<your-render-service>.onrender.com/api
```

## API documentation

See the complete endpoint reference in [docs/API.md](./docs/API.md).

Protected endpoints require an `Authorization` header containing a Bearer
access token. Refresh tokens are stored only as hashes and are rotated and
revoked on every refresh.
