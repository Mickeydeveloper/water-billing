# API Documentation

## Authentication Endpoints

### POST `/signup`
Create a new user account
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "phone": "+255789123456"
}

Response:
{
  "success": true
}
```

### POST `/local-login`
Login with email and password
```json
Request:
{
  "email": "john@example.com",
  "password": "secure_password"
}

Response:
{
  "success": true
}
```

### GET `/auth/google`
Redirect to Google OAuth authentication

### GET `/auth/google/callback`
Google OAuth callback (automatic redirect)

### GET `/api/me`
Get current authenticated user info
```json
Response:
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+255789123456",
    "picture": "url",
    "provider": "google|local"
  }
}
```

### GET `/logout`
Logout user (clears session)

---

## User Management Endpoints

### GET `/api/users/count`
Get total number of registered users
```json
Response:
{
  "count": 156,
  "success": true
}
```

### GET `/api/users/list`
Get list of all registered users
```json
Response:
{
  "success": true,
  "users": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+255789123456",
      "provider": "google"
    }
  ]
}
```

### POST `/api/user/update`
Update current user profile (requires authentication)
```json
Request:
{
  "name": "Jane Doe",
  "phone": "+255789654321"
}

Response:
{
  "success": true
}
```

---

## Billing Records Endpoints

### POST `/save-record`
Create new billing record (requires authentication)
```json
Request:
{
  "name": "Customer Name",
  "phone": "+255789123456",
  "prev": 1000,
  "curr": 1150,
  "rate": 500,
  "fixed": 2000,
  "date": "2026-03-15"
}

Response:
{
  "success": true
}
```

### GET `/get-records`
Get user's billing records (requires authentication)
```json
Response:
{
  "success": true,
  "records": [
    {
      "userId": "user-123",
      "id": "record-456",
      "name": "Customer",
      "phone": "+255789123456",
      "prev": 1000,
      "curr": 1150,
      "usage": 150,
      "rate": 500,
      "fixed": 2000,
      "total": 77500,
      "date": "2026-03-15"
    }
  ]
}
```

### GET `/api/records/count`
Get total billing records count
```json
Response:
{
  "count": 892,
  "success": true
}
```

---

## Payment Endpoints

### POST `/save-payment`
Record a new payment (requires authentication)
```json
Request:
{
  "recordId": "record-456",
  "amount": 77500,
  "method": "mobile_money",
  "description": "Monthly water bill"
}

Response:
{
  "success": true,
  "payment": {
    "userId": "user-123",
    "recordId": "record-456",
    "amount": 77500,
    "method": "mobile_money",
    "status": "completed",
    "transactionId": "TXN-1710445200000-abc123",
    "paymentDate": "2026-03-15T10:30:00Z"
  }
}
```

### GET `/get-payments`
Get user's payment history (requires authentication)
```json
Response:
{
  "success": true,
  "payments": [
    {
      "userId": "user-123",
      "recordId": "record-456",
      "amount": 77500,
      "method": "mobile_money",
      "status": "completed",
      "transactionId": "TXN-1710445200000-abc123",
      "paymentDate": "2026-03-15T10:30:00Z"
    }
  ]
}
```

### GET `/get-payment-stats`
Get user's payment statistics (requires authentication)
```json
Response:
{
  "success": true,
  "totalAmount": 542500,
  "completedPayments": 12,
  "pendingPayments": 2
}
```

### GET `/api/payments/stats`
Get system-wide payment statistics (admin endpoint)
```json
Response:
{
  "success": true,
  "totalPayments": 892,
  "totalAmount": 45678900,
  "byStatus": [
    { "_id": "completed", "count": 850 },
    { "_id": "pending", "count": 35 },
    { "_id": "failed", "count": 7 }
  ]
}
```

---

## Chat & Support Endpoints

### GET `/api/chat`
AI chat interface
```
Query Parameters:
- text: The user's message

Example: /api/chat?text=Habari

Response:
{
  "reply": "Habari! Karibu ndani. Ninaweza kukusaidia kwa nini?"
}
```

---

## System Endpoints

### GET `/health`
Health check and database connection status
```json
Response:
{
  "status": "ok",
  "mongodb": true
}
```

### GET `/`
Main application (redirects to login if not authenticated)

### GET `/main.html`
Main application dashboard (requires authentication)

### GET `/admin.html`
Admin dashboard (requires authentication)

### GET `/records.html`
Billing records page (requires authentication)

### GET `/login`
Login page

### GET `/signup`
Sign up page

### GET `/botweb.html`
Chat bot web interface (public)

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "Database connection unavailable"
}
```

---

## Rate Limiting

- No explicit rate limiting implemented
- Monitor for unusual activity
- Implement rate limiting for production

---

## Authentication

All endpoints marked "(requires authentication)" need:
- User to be logged in via Google OAuth or local registration
- Valid session cookie
- CSRF protection enabled

---

## Data Types

### Payment Methods
- `cash` - Cash payment
- `card` - Debit/Credit card
- `mobile_money` - Mobile money (M-Pesa, Airtel Money, etc.)
- `bank` - Bank transfer

### Payment Status
- `pending` - Payment awaiting confirmation
- `completed` - Payment successfully processed
- `failed` - Payment transaction failed

### User Providers
- `google` - Google OAuth login
- `local` - Email/password registration

---

## Testing with cURL

```bash
# Health check
curl http://localhost:3000/health

# Chat API
curl "http://localhost:3000/api/chat?text=Habari"

# Requires authentication (after login):
curl http://localhost:3000/api/me
curl http://localhost:3000/get-records
curl http://localhost:3000/get-payment-stats
```

---

## Testing with Postman

1. Import collection from `/postman-collection.json` (if available)
2. Set environment variables:
   - base_url: http://localhost:3000
   - user_email: test@example.com
   - user_password: password123

3. Run authentication flows
4. Test endpoints in order

---

**API Version**: 1.1.0  
**Last Updated**: April 14, 2026  
**Status**: Production Ready
