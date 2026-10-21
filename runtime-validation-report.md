# Runtime Validation Report

**Generated**: 2026-10-21T17:49:00Z  
**Target**: `C:\Users\parik\Desktop\Final year project`

## Summary

| Step | Status | Exit Code | Details |
|------|--------|-----------|---------|
| TypeScript compilation | PASS | 0 | `tsc --noEmit` |
| Startup | PASS | 0 | Express started on port 5055 and `/api` returned 200 |
| Provider API flow | PASS | 0 | Registration, OTP verification, JWT, protected read |
| Worker API flow | PASS | 0 | Registration, worker-ID login, JWT, protected read |
| Auth failure flows | PASS | 0 | Missing and invalid credentials rejected |
| Refresh/logout flow | PASS | 0 | Refresh rotation and revoked-token rejection |

## Environment

- Node.js: available, v22.14.0
- MongoDB: available on `127.0.0.1:27017`
- Docker: unavailable because the Docker Desktop Linux engine was not running
- Browser E2E: not applicable; this repository exposes a JSON API

## Tested Journeys

1. Provider registration, OTP verification, JWT issuance, and protected profile read.
2. Worker registration, worker-ID login, JWT issuance, and protected profile read.
3. Refresh-token rotation followed by logout and revoked-token rejection.
4. Missing and invalid access-token rejection.
5. Invalid request validation rejection.

Reusable scripts are in `tests/`. Start the API with `RETURN_OTP_IN_RESPONSE=true`
for local OTP testing, then run each PowerShell script.

## Verdict

**Overall: PASS**

All executed API flows returned the expected results with exit code 0.
