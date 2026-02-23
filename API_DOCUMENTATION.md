# API Documentation

## Base URL
```
http://localhost:10000
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

The token is obtained from the `/auth/google` endpoint and stored in `localStorage.authToken`.

---

## Endpoints

### 1. Authentication Endpoints

#### 1.1 Google Sign-In
**POST** `/auth/google`

Verify Google ID token and receive JWT session token.

**Request**:
```json
{
  "token": "google_id_token_from_frontend"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Google authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "google_user_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Error** (401):
```json
{
  "success": false,
  "error": "Invalid Google token",
  "message": "Error details"
}
```

---

#### 1.2 Verify Token
**GET** `/auth/verify`

Verify that the JWT token is valid and get user info.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "userId": "google_user_id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://...",
    "provider": "google"
  }
}
```

**Error** (401):
```json
{
  "success": false,
  "error": "Invalid token"
}
```

---

#### 1.3 Logout
**POST** `/auth/logout`

Logout the user (client-side token removal).

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2. Billing Records Endpoints

#### 2.1 Save Billing Record
**POST** `/save-record`

Create and save a new billing record for the authenticated user.

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "name": "Customer Name",
  "phone": "255712345678",
  "prev": 100,
  "curr": 150,
  "rate": 2000,
  "fixed": 0,
  "total": 100000,
  "date": "2026-02-23T10:00:00.000Z"
}
```

**Validation Rules**:
- `name`: 2-50 characters, required
- `phone`: Format 255XXXXXXXXX (12 digits), required
- `prev`: Non-negative number, required
- `curr`: Non-negative number, must be >= prev, required
- `rate`: Positive number, required
- `fixed`: Non-negative number, optional (default: 0)
- `total`: Non-negative number, required
- `date`: ISO datetime, optional (defaults to current time)

**Response** (200):
```json
{
  "success": true,
  "message": "Record saved successfully",
  "record": {
    "id": 1708857600000,
    "name": "Customer Name",
    "phone": "255712345678",
    "prev": 100,
    "curr": 150,
    "usage": 50,
    "rate": 2000,
    "fixed": 0,
    "total": 100000,
    "date": "2026-02-23T10:00:00.000Z"
  }
}
```

**Errors** (400/500):
```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

---

#### 2.2 Get All Records
**GET** `/get-records`

Retrieve all billing records for the authenticated user.

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "records": [
    {
      "id": 1708857600000,
      "name": "Customer Name",
      "phone": "255712345678",
      "prev": 100,
      "curr": 150,
      "usage": 50,
      "rate": 2000,
      "fixed": 0,
      "total": 100000,
      "date": "2026-02-23T10:00:00.000Z"
    },
    {
      "id": 1708944000000,
      "name": "Another Customer",
      "phone": "255787654321",
      "prev": 200,
      "curr": 280,
      "usage": 80,
      "rate": 2500,
      "fixed": 5000,
      "total": 205000,
      "date": "2026-02-24T10:00:00.000Z"
    }
  ],
  "user": {
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

**Error** (401):
```json
{
  "success": false,
  "error": "No token provided"
}
```

---

#### 2.3 Delete Record
**DELETE** `/delete-record/{recordId}`

Delete a specific billing record by ID.

**Parameters**:
- `recordId` (integer): The ID of the record to delete

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

**Error - Not Found** (404):
```json
{
  "success": false,
  "error": "Record not found"
}
```

**Error - Unauthorized** (401):
```json
{
  "success": false,
  "error": "Invalid token"
}
```

---

### 3. SMS Endpoint (Existing)

#### 3.1 Send SMS
**POST** `/send-sms`

Send a billing message via SMS.

**Request**:
```json
{
  "to": "255712345678",
  "message": "BILL STATEMENT\nCustomer: John\nTotal: TZS 100000"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "details": {
    "to": "255712345678",
    "length": 50,
    "timestamp": "2026-02-23T10:00:00.000Z"
  }
}
```

---

### 4. Health Check

#### 4.1 Health Check
**GET** `/health`

Check if server is running.

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2026-02-23T10:00:00.000Z",
  "uptime": 3600.5
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found (record doesn't exist) |
| 500 | Server Error |

---

## Common Error Responses

### Missing Token
```json
{
  "success": false,
  "error": "No token provided"
}
```

### Invalid Token
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Missing required field: name"
}
```

### Invalid Phone Format
```json
{
  "success": false,
  "error": "Invalid phone number format. Expected: 255XXXXXXXXX"
}
```

---

## Example JavaScript Usage

### Login with Google
```javascript
const response = await fetch('/auth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: googleIdToken
  })
});

const data = await response.json();
localStorage.setItem('authToken', data.token);
```

### Save Record
```javascript
const response = await fetch('/save-record', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '255712345678',
    prev: 100,
    curr: 150,
    rate: 2000,
    fixed: 0,
    total: 100000
  })
});

const data = await response.json();
console.log('Record saved:', data.record);
```

### Get Records
```javascript
const response = await fetch('/get-records', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});

const data = await response.json();
console.log('Records:', data.records);
```

### Delete Record
```javascript
const response = await fetch('/delete-record/1708857600000', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});

const data = await response.json();
console.log(data.message); // 'Record deleted successfully'
```

---

## Rate Limiting (Future)

Currently not implemented. Recommended for production:
- 100 requests per minute per user
- 1000 requests per minute per IP

---

## CORS (Current)

Static files served from root directory. CORS not strictly enforced in development.

For production, implement proper CORS:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

---

## Response Format

All endpoints return JSON. Common response patterns:

### Success (200)
```json
{
  "success": true,
  "message": "Action completed",
  "data": {}
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional details"
}
```

---

## Testing API with cURL

### Login
```bash
curl -X POST http://localhost:10000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"your_google_id_token"}'
```

### Get Records
```bash
curl -X GET http://localhost:10000/get-records \
  -H "Authorization: Bearer your_jwt_token"
```

### Save Record
```bash
curl -X POST http://localhost:10000/save-record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name":"Test",
    "phone":"255712345678",
    "prev":100,
    "curr":150,
    "rate":2000,
    "fixed":0,
    "total":100000
  }'
```

---

**API Version**: 1.0.0  
**Last Updated**: February 23, 2026  
