# 💧 Water Billing System - Google OAuth Edition

## 🎉 What's New

Your water billing system has been upgraded with **Google Account Authentication** and **Cloud Record Storage**!

### New Features ✨
- **Google Sign-In**: Login with any Google account (no passwords needed!)
- **Cloud Storage**: All billing records stored securely on the server
- **Multi-User Support**: Each Google account maintains their own billing records
- **Data Persistence**: Records saved permanently - even after logout
- **Cross-Device Access**: Login from any device with the same Google account to access your records

---

## 🚀 Getting Started (3 Steps)

### Step 1: Get Google Client ID
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials for Web Application
5. Add `http://localhost:10000` to authorized origins
6. Copy your Client ID

**⏱️ Time: 5 minutes**

### Step 2: Add Client ID to Code
Open `login.html` and replace line ~209:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

**⏱️ Time: 1 minute**

### Step 3: Start the Server
```bash
npm install
npm start
```

Open `http://localhost:10000` in your browser

**⏱️ Time: 1 minute**

🎊 **Total Setup Time: ~7 minutes**

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - ⚡ Fastest way to get started
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 📖 Complete setup instructions
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - 🔧 Technical details
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - 📡 API reference

---

## 🎯 Key Features

### Authentication
✅ Google Sign-In (no password management)  
✅ Automatic account linking  
✅ JWT session tokens  
✅ Secure logout  
✅ Demo mode for testing  

### Data Management
✅ Records stored per user  
✅ Automatic saving  
✅ Complete history  
✅ Delete records  
✅ Export to CSV  

### Billing Functions
✅ Calculate water bills  
✅ Calculate usage  
✅ Send via SMS  
✅ View monthly reports  
✅ Track revenue  

---

## 📁 Project Structure

```
water-billing/
├── server.js                    # Express backend with Google OAuth
├── login.html                   # Google Sign-In page
├── main.html                    # Billing calculator (requires auth)
├── records.html                 # Billing history (requires auth)
├── index.html                   # Dashboard (requires auth)
├── package.json                 # Dependencies
├── user_data/                   # User records (auto-created)
│
├── QUICK_START.md              # Quick setup guide
├── SETUP_GUIDE.md              # Detailed instructions
├── IMPLEMENTATION_SUMMARY.md   # What was implemented
├── API_DOCUMENTATION.md        # API endpoints
└── README.md                   # This file
```

---

## 🔒 How It Works

```
User Login with Google
         ↓
Backend verifies with Google
         ↓
Creates JWT session token
         ↓
User's records loaded from server
         ↓
Same account login later → Same records!
```

---

## 💾 Data Storage

Each user's records stored in: `user_data/{googleUserId}.json`

**Example file**:
```json
{
  "userId": "118203939474...",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "lastLogin": "2026-02-23T10:00:00.000Z",
  "records": [
    {
      "id": 1708857600000,
      "name": "Customer Name",
      "phone": "255712345678",
      "prev": 100,
      "curr": 150,
      "usage": 50,
      "rate": 2000,
      "total": 100000,
      "date": "2026-02-23T10:00:00.000Z"
    }
  ]
}
```

---

## 🔐 Security Features

- **Google Authentication**: Verified through Google's servers
- **JWT Tokens**: Secure session management
- **Protected Routes**: All data endpoints require valid token
- **User Isolation**: Each user only sees their own records
- **No Passwords**: Use Google's secure authentication

---

## 📱 Usage Workflow

### 1. Login
```
→ Open http://localhost:10000
→ Click "Google Sign-In"
→ Authenticate with your Google account
→ Auto-redirected to dashboard
```

### 2. Create Billing Record
```
→ Click "Create Bill" or go to main.html
→ Fill in customer details
→ Enter meter readings
→ Click "Calculate Bill"
→ Record automatically saved!
```

### 3. View Records
```
→ Click "View History" or go to records.html
→ See all your saved billing records
→ Filter by month
→ Export as CSV if needed
```

### 4. Logout
```
→ Click "Logout" button
→ Redirected to login page
→ Records safe on server
```

### 5. Login Again
```
→ Login with same Google account
→ All your records appear!
```

---

## 🧪 Testing

### Test Mode 1: Google Authentication
1. Click "Google Sign-In"
2. Authenticate with a Gmail account
3. Verify redirect to dashboard

### Test Mode 2: Demo Mode
1. Click "Skip to Demo"
2. No Google account needed
3. Test billing system

### Test Mode 3: Data Persistence
1. Create a billing record
2. Refresh the page
3. Records still visible ✓
4. Logout and login again
5. Records still there ✓

---

## ⚙️ Configuration

### Default Settings
- **Server Port**: 10000
- **Session Duration**: 7 days
- **Storage**: File-based JSON
- **Timezone**: UTC

### Customization
Edit in `server.js`:
```javascript
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-id';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';
const PORT = process.env.PORT || 10000;
```

---

## 🤔 FAQ

**Q: Can multiple users use the same computer?**  
A: Yes! Each Google account has separate records.

**Q: Will my records be lost if I restart the server?**  
A: No! Records are stored in `user_data/` folder.

**Q: Can I access records from my phone?**  
A: Yes! Login from any device with the same Google account.

**Q: What if I forget my Google password?**  
A: Use Google's account recovery. Your data is safe.

**Q: Can I share records with other users?**  
A: Future feature. Currently each user has private records.

**Q: Is this secure?**  
A: Yes! Uses Google's authentication and JWT tokens.

---

## 🆘 Common Issues

### "Invalid Google Token"
→ Check GOOGLE_CLIENT_ID in login.html  
→ Verify Google+ API is enabled  
→ Refresh browser and try again

### "Failed to save record"
→ Ensure `user_data/` folder exists  
→ Check server is running  
→ Look at terminal for error messages

### "Can't connect to localhost:10000"
→ Run `npm start` first  
→ Check if port 10000 is available  
→ Try different port: `PORT=3000 npm start`

### Records not saving?
→ Check network tab in browser dev tools  
→ Verify user is logged in  
→ Check localStorage has authToken

---

## 📞 Support

For detailed setup: See [QUICK_START.md](./QUICK_START.md)  
For API details: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)  
For troubleshooting: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 🚀 Next Steps

1. **Get Google Client ID** (5 min) → [Instructions](./QUICK_START.md)
2. **Add Client ID to code** (1 min)
3. **Run `npm install && npm start`** (1 min)
4. **Open http://localhost:10000** and test!

---

## 📊 Features Summary

| Feature | Status |
|---------|--------|
| Google Sign-In | ✅ Complete |
| User Authentication | ✅ Complete |
| Billing Records Storage | ✅ Complete |
| Multi-User Support | ✅ Complete |
| Data Persistence | ✅ Complete |
| Records Export (CSV) | ✅ Complete |
| SMS Integration | ✅ Complete |
| Dashboard Stats | ✅ Complete |
| Demo Mode | ✅ Complete |

---

## 🎓 Learning Resources

- [Google OAuth Documentation](https://developers.google.com/identity)
- [JWT Tokens Explained](https://jwt.io/)
- [Express.js Guide](https://expressjs.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/)

---

## 📝 Version Info

- **Version**: 1.0.0
- **Release Date**: February 23, 2026
- **Framework**: Express.js with Google OAuth
- **Storage**: JSON File-Based
- **Node Version**: >= 14.0.0

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🎉 Ready to Get Started?

1. Follow [QUICK_START.md](./QUICK_START.md)
2. It takes less than 10 minutes!
3. Your billing system will be ready for production.

**Happy billing!** 💧

---

**Questions?** Check the documentation files included with this project.
