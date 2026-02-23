# Water Billing System - Google OAuth Setup Guide

## Overview
This application now uses **Google Authentication** to securely login users and store their billing records in the cloud.

## Features Implemented ✅
- **Google Sign-In**: Users login with their Google accounts
- **Secure Authentication**: JWT tokens for session management
- **Cloud Storage**: Records stored per user on the server
- **Multi-User Support**: Each Google account has its own billing records
- **Data Persistence**: Records are automatically saved and retrieved

## Installation Steps

### Step 1: Update Dependencies
Dependencies have already been added to `package.json`:
- `google-auth-library`: For verifying Google ID tokens
- `jsonwebtoken`: For creating secure session tokens

Install them with:
```bash
npm install
```

### Step 2: Get Google Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:10000` (for development)
   - `http://localhost:3000` (if using different port)
7. Add authorized redirect URIs:
   - `http://localhost:10000` (for development)
8. Copy your **Client ID**

### Step 3: Configure Google Client ID
Replace the placeholder in `login.html`:

**File**: `login.html` (Line ~209)
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID from Google Cloud Console.

**Example**:
```javascript
const GOOGLE_CLIENT_ID = '123456789-abc1234def5678ghi9jkl0mno1pqrst.apps.googleusercontent.com';
```

### Step 4: Set Environment Variables (Optional)
Create a `.env` file in the project root:
```env
GOOGLE_CLIENT_ID=your_client_id_here
JWT_SECRET=your_secure_secret_key_here
NODE_ENV=production
PORT=10000
```

Update `server.js` to use these:
```javascript
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'fallback_client_id';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
```

### Step 5: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm install -g nodemon
nodemon server.js
```

The server will run on `http://localhost:10000`

## How It Works

### Login Flow
1. User goes to `/` (login page)
2. Clicks "Google Sign-In" button
3. Google authentication window opens
4. User signs in with their Google account
5. Google returns an ID token
6. Application verifies token with backend
7. Backend creates a JWT token
8. User is redirected to main billing page

### Data Storage
- User data files stored in `user_data/` directory
- Each user gets a file: `user_data/{userId}.json`
- File structure:
```json
{
  "userId": "google_user_id",
  "email": "user@example.com",
  "name": "Username",
  "picture": "profile_picture_url",
  "lastLogin": "2026-02-23T...",
  "records": [
    {
      "id": 1234567890,
      "name": "Customer Name",
      "phone": "255712345678",
      "prev": 100,
      "curr": 150,
      "usage": 50,
      "rate": 2000,
      "fixed": 0,
      "total": 100000,
      "date": "2026-02-23T..."
    }
  ]
}
```

### API Endpoints

#### Authentication Endpoints
- **POST `/auth/google`**: Verify Google token and get JWT
- **GET `/auth/verify`**: Verify current user's JWT token
- **POST `/auth/logout`**: Logout user (client-side token removal)

#### Billing Endpoints (Requires Authentication)
- **POST `/save-record`**: Save new billing record
- **GET `/get-records`**: Get all records for authenticated user
- **DELETE `/delete-record/:recordId`**: Delete specific record

## Demo Mode
Users can skip Google authentication and use demo mode:
- Click **"Skip to Demo"** button on login page
- Demo account will be created with test data
- Data is still stored server-side

## File Structure
```
water-billing/
├── server.js          # Express backend
├── login.html         # Google Sign-In page
├── main.html          # Billing calculator (protected)
├── records.html       # Billing history (protected)
├── index.html         # Dashboard (protected)
├── package.json       # Dependencies
├── user_data/         # User records (created at runtime)
└── SETUP_GUIDE.md     # This file
```

## Important Notes

### Security
- **Never** commit your Google Client ID to public repositories
- Use environment variables for sensitive data
- Change `JWT_SECRET` in production
- Use HTTPS in production environments
- Implement CORS properly for production

### Development vs Production
**Development**:
- Local `http://localhost:10000`
- File-based storage (JSON files)
- Simple JWT implementation

**Production**:
- Use proper SSL/HTTPS
- Migrate to MongoDB or PostgreSQL
- Set environment variables properly
- Use secure password for JWT_SECRET
- Add rate limiting and security headers

## Troubleshooting

### Issue: "Invalid Google Token"
- Check that GOOGLE_CLIENT_ID is correct
- Verify the token was freshly obtained
- Ensure Google+ API is enabled in Google Cloud Console

### Issue: "Failed to save record"
- Check that `user_data/` directory exists
- Verify write permissions on the directory
- Check disk space

### Issue: "Unauthorized" on protected pages
- Ensure localStorage has both `authToken` and `user` keys
- Clear localStorage and login again
- Check browser console for errors

### Issue: Port already in use
```bash
# Change port in server.js or use:
PORT=3000 npm start
```

## Next Steps

1. **Configure Database**: Replace JSON file storage with MongoDB/PostgreSQL
2. **Add Email Notifications**: Send billing alerts via email
3. **SMS Integration**: Connect Twilio or Africastalking for SMS
4. **Analytics Dashboard**: Add charts and analytics
5. **Mobile App**: Create React Native or Flutter app
6. **Payment Gateway**: Integrate payment processing
7. **Admin Panel**: Add admin features for managing multiple users

## Support
For issues or questions:
- Check the console error messages
- Review server logs
- Verify Google Cloud Console configuration
- Test with demo mode first

## License
MIT License - See package.json

---
**Last Updated**: February 23, 2026
**Version**: 1.0.0
