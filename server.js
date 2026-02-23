/**
 * Mickey Water Billing System & Music Player - Server
 * A combined Express.js server for billing and music search
 * Optimized for Aswin Sparky API Integration
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors'); 
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Google OAuth Client ID (Replace with your actual Google Client ID)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Data storage directory
const DATA_DIR = path.join(__dirname, 'user_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

app.use(cors()); 
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '/')));

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * Helper function to get user data file path
 */
const getUserDataFile = (userId) => {
  return path.join(DATA_DIR, `${userId}.json`);
};

/**
 * Helper function to load user data
 */
const loadUserData = (userId) => {
  const filePath = getUserDataFile(userId);
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading user data:', err);
  }
  return { records: [] };
};

/**
 * Helper function to save user data
 */
const saveUserData = (userId, data) => {
  const filePath = getUserDataFile(userId);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving user data:', err);
    return false;
  }
};

// Custom error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ============================================
// MUSIC API ROUTE (Mickey Music v4 - BORESHO)
// ============================================

/**
 * POST /auth/google - Authenticate with Google token
 * Body: { token: string }
 */
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Google token is required'
      });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userId = payload.sub; // Google user ID
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // Create JWT token
    const jwtToken = jwt.sign(
      {
        userId,
        email,
        name,
        picture,
        provider: 'google'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Load or create user data
    let userData = loadUserData(userId);
    userData.userId = userId;
    userData.email = email;
    userData.name = name;
    userData.picture = picture;
    userData.lastLogin = new Date().toISOString();
    if (!userData.records) {
      userData.records = [];
    }

    // Save user data
    saveUserData(userId, userData);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: jwtToken,
      user: {
        userId,
        email,
        name,
        picture
      }
    });

  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({
      success: false,
      error: 'Invalid Google token',
      message: err.message
    });
  }
});

/**
 * POST /auth/logout - Logout user
 */
app.post('/auth/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /auth/verify - Verify current user token
 */
app.get('/auth/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * GET / - Serve login page as default
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

/**
 * GET /api/search-music
 * Inatafuta YouTube -> Inapata Link -> Inachukua Audio toka Aswin API
 */
app.get('/api/search-music', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ status: false, error: 'Andika jina la wimbo' });
    }

    // 1. Hatua ya kwanza: Tafuta video YouTube
    const r = await yts(query);
    const video = r.videos[0]; 

    if (!video) {
      return res.status(404).json({ status: false, error: 'Wimbo haukupatikana YouTube' });
    }

    const youtubeUrl = video.url;

    // 2. Hatua ya pili: Ite API ya Aswin Sparky kupata playable audio link
    // Tunatumia link ya YouTube tuliyoipata hapo juu
    const aswinApiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(youtubeUrl)}`;
    
    const response = await fetch(aswinApiUrl);
    const result = await response.json();

    if (result.status && result.data) {
      // Tunarudisha jibu moja lililokamilika
      res.json({
        status: true,
        title: video.title,
        thumbnail: video.thumbnail,
        author: video.author.name,
        timestamp: video.timestamp,
        audioUrl: result.data.url, // Hii ndiyo link ya ku-play na kupakua
        creator: result.creator
      });
    } else {
      res.status(500).json({ status: false, error: 'API ya audio imeshindwa kutoa link' });
    }

  } catch (err) {
    console.error('Music Search Error:', err);
    res.status(500).json({ status: false, error: 'Hitilafu ya server', details: err.message });
  }
});

// ============================================
// BILLING ROUTES (Original)
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/music', (req, res) => {
  res.sendFile(path.join(__dirname, 'music.html'));
});

app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/records', (req, res) => {
  res.sendFile(path.join(__dirname, 'records.html'));
});

/**
 * POST /save-record - Save billing record (requires authentication)
 * Body: { name, phone, prev, curr, rate, fixed, total, date }
 */
app.post('/save-record', verifyToken, async (req, res) => {
  try {
    const { name, phone, prev, curr, rate, fixed, total, date } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    const requiredFields = ['name', 'phone', 'prev', 'curr', 'rate', 'fixed', 'total'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Validate numeric fields
    const numericFields = ['prev', 'curr', 'rate', 'fixed', 'total'];
    for (const field of numericFields) {
      if (isNaN(req.body[field]) || req.body[field] < 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid value for ${field}: must be a non-negative number`
        });
      }
    }

    // Validate phone format
    const phoneRegex = /^255\d{9}$/;
    if (!phoneRegex.test(phone.toString().trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Validate current > previous
    if (parseFloat(curr) < parseFloat(prev)) {
      return res.status(400).json({
        success: false,
        error: 'Current reading must be greater than or equal to previous reading'
      });
    }

    // Create record object
    const record = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      prev: parseFloat(prev),
      curr: parseFloat(curr),
      usage: parseFloat(curr) - parseFloat(prev),
      rate: parseFloat(rate),
      fixed: parseFloat(fixed),
      total: parseFloat(total),
      date: date || new Date().toISOString()
    };

    // Load user data and add record
    const userData = loadUserData(userId);
    if (!userData.records) {
      userData.records = [];
    }
    userData.records.push(record);

    // Save user data
    const saved = saveUserData(userId, userData);

    if (!saved) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save record'
      });
    }

    res.json({ 
      success: true,
      message: 'Record saved successfully',
      record 
    });

  } catch (err) {
    console.error('Save Record Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save record',
      message: err.message 
    });
  }
});

/**
 * GET /get-records - Get all records for authenticated user
 */
app.get('/get-records', verifyToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userData = loadUserData(userId);

    res.json({
      success: true,
      records: userData.records || [],
      user: {
        name: userData.name,
        email: userData.email
      }
    });

  } catch (err) {
    console.error('Get Records Error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve records',
      message: err.message
    });
  }
});

/**
 * DELETE /delete-record/:recordId - Delete a specific record
 */
app.delete('/delete-record/:recordId', verifyToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = parseInt(req.params.recordId);

    const userData = loadUserData(userId);
    const initialLength = userData.records?.length || 0;

    userData.records = (userData.records || []).filter(r => r.id !== recordId);

    if (userData.records.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    saveUserData(userId, userData);

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });

  } catch (err) {
    console.error('Delete Record Error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete record'
    });
  }
});

/**
 * POST /send-sms - Handle SMS sending
 * Body: { to: string, message: string }
 */
app.post('/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;

    // Validate input
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    // Validate phone number format (Tanzania)
    const phoneRegex = /^255\d{9}$/;
    if (!phoneRegex.test(to.toString().trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Expected: 255XXXXXXXXX'
      });
    }

    // Message length validation
    if (message.trim().length === 0 || message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message must be between 1 and 1000 characters'
      });
    }

    // TODO: Integrate with actual SMS service (Twilio, Africastalking, etc.)
    // For now, return success
    console.log(`SMS would be sent to ${to}: ${message}`);

    res.json({ 
      success: true,
      message: 'SMS sent successfully',
      details: {
        to,
        length: message.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('SMS Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send SMS',
      message: err.message 
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ============================================
// ERROR HANDLING & STARTUP
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`🌊 Mickey Billing & Music Server running on port ${PORT}`);
});
