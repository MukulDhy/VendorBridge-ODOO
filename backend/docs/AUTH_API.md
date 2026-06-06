# Inflio Auth API

Base URL: `http://localhost:5001/api/v1/auth` (also mounted at `/api/user`)

## Sign up

`POST /register`

```json
{
  "name": "Jane Brand",
  "email": "jane@example.com",
  "password": "Secure@123",
  "role": "brand",
  "phone": "+919876543210"
}
```

`role`: `"brand"` | `"influencer"`

Response includes `accessToken`, `refreshToken`, and `user`. A verification email is sent when SMTP is configured.

## Sign in

`POST /login`

```json
{
  "email": "jane@example.com",
  "password": "Secure@123"
}
```

## Current user

`GET /me` — Header: `Authorization: Bearer <accessToken>`

## Email verification

- Link: `GET /verify-email/:token`
- Body: `POST /verify-email` `{ "token": "..." }`
- Code: `POST /verify-email-code` `{ "email": "...", "code": "123456" }`
- Resend: `POST /resend-verification` `{ "email": "..." }`

## Password reset

1. `POST /forgot-password` `{ "email": "..." }`
2. `POST /reset-password` `{ "email": "...", "otp": "123456", "password": "NewSecure@123" }`

## Other

- `POST /logout` (authenticated)
- `PUT /change-password` (authenticated)
- `POST /refresh-token` `{ "refreshToken": "..." }`
- `GET /check-email?email=test@example.com`

## Real-time (Socket.IO)

Connect after login:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5001", {
  path: "/socket.io",
  auth: { token: accessToken },
});
socket.on("auth:email_verified", () => { /* refresh UI */ });
socket.on("auth:login", () => { /* another session signed in */ });
```

## Environment

Copy `.env.example` to `.env` and set `JWT_SECRET`, `MONGO_URI`, and Gmail App Password for `SMTP_*`.
