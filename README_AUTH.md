# Authentication System Documentation

This document provides information about the authentication system implemented in the School Management application.

## Features

- Email-based OTP authentication
- JWT-based session management
- Protected routes
- Secure HTTP-only cookies
- Automatic user creation on first login

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key

# Email Configuration (for sending OTPs)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Database Configuration
DATABASE_URL=mysql://username:password@localhost:3306/school_management
```

## API Endpoints

### `POST /api/auth/send-otp`
Sends an OTP to the provided email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### `POST /api/auth/verify-otp`
Verifies the OTP and logs the user in.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### `POST /api/auth/logout`
Logs the user out by clearing the authentication cookie.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### `GET /api/auth/check`
Checks if the user is authenticated.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

## Protected Routes

The following routes require authentication:
- `/manage/*` - All management pages
- `/api/schools` - School management API endpoints

## Database Schema

### Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### OTP Verification Table
```sql
CREATE TABLE IF NOT EXISTS otp_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otp (email, otp, expires_at, is_used)
);
```

## Security Considerations

1. **OTP Expiry**: OTPs are valid for 10 minutes
2. **JWT Expiry**: Tokens expire after 1 day
3. **HTTP-only Cookies**: Tokens are stored in HTTP-only cookies for security
4. **Secure Cookies**: In production, cookies are only sent over HTTPS
5. **Rate Limiting**: Consider implementing rate limiting for OTP requests

## Setup Instructions

1. Create the required database tables using the schema in `database/schema.sql`
2. Copy `.env.example` to `.env` and fill in the required values
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Testing

You can test the authentication flow using the following steps:

1. Navigate to `/login`
2. Enter your email address and request an OTP
3. Check your email for the OTP
4. Enter the OTP to log in
5. You should be redirected to the home page and able to access protected routes
