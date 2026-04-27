require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const compression = require('compression');

const app = express();

// ================== SECURITY HEADERS ==================
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ================== PERFORMANCE OPTIMIZATIONS ==================
// Enable compression for all responses
app.use(compression({ threshold: 1024, level: 6 }));

// Set cache headers for static assets
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.set('ETag', 'disabled'); // Disable ETag for static files
  } else if (req.path.match(/\.(html)$/)) {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// ================== BASIC ==================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with proper caching
app.use(express.static(__dirname, { 
  maxAge: '24h',
  etag: false,
  index: false
}));

// ================== SESSION ==================
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

app.use(passport.initialize());
app.use(passport.session());

// ================== MONGODB ==================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Mongo Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));

// ================== MODELS WITH INDEXES ==================
const userSchema = new mongoose.Schema({
  id: { type: String, index: true },
  name: String,
  email: { type: String, index: true, unique: true, sparse: true },
  passwordHash: String,
  provider: String,
  googleId: String,
  picture: String,
  createdAt: { type: Date, default: Date.now, index: true }
});

const recordSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  name: String,
  phone: { type: String, index: true },
  prev: Number,
  curr: Number,
  usage: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now, index: true }
});

// Create compound indexes for faster queries
recordSchema.index({ userId: 1, createdAt: -1 });
recordSchema.index({ phone: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);

// ================== PASSPORT STRATEGIES ==================
// Local Strategy for email/password login
passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return done(null, false, { message: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return done(null, false, { message: 'Invalid password' });
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Google Strategy
passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'not-configured',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Create new user
      user = new User({
        id: profile.id,
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        picture: profile.photos?.[0]?.value,
        provider: 'google'
      });
      await user.save();
    }
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ================== AUTH ==================
const protect = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
};

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({});
  res.json({ user: req.user });
});

// ================== AUTHENTICATION ENDPOINTS ==================

// Sign up with email
app.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      id: new Date().getTime().toString(),
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      provider: 'local'
    });
    
    await newUser.save();
    
    // Log in the user
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed after signup' });
      res.json({ 
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Local email login
app.post('/local-login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'Authentication error' });
    
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Invalid credentials' });
    }
    
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      
      res.json({ 
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    });
  })(req, res, next);
});

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login.html?error=oauth',
    successRedirect: '/records.html'
  })
);

// Logout
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login.html');
  });
});

// ================== AI/CHAT API ==================
// Endpoint for chat messages
app.get('/api/chat', async (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text || text.trim().length === 0) {
      return res.json({ reply: 'Please ask something' });
    }
    
    // Simple response system - you can integrate a real AI/ML service here
    const lowerText = text.toLowerCase();
    let reply = 'I can help with billing calculations and water usage tracking. What would you like to know?';
    
    if (lowerText.includes('billing') || lowerText.includes('charge')) {
      reply = 'Water billing is calculated as: (Current Reading - Previous Reading) × Rate + Fixed Charges';
    } else if (lowerText.includes('usage') || lowerText.includes('consume')) {
      reply = 'Your water usage is the difference between current and previous meter readings in cubic meters.';
    } else if (lowerText.includes('help')) {
      reply = 'I can help you with:\n• Calculating water charges\n• Understanding meter readings\n• Billing information\nWhat do you need?';
    } else if (lowerText.includes('rate') || lowerText.includes('price')) {
      reply = 'Water rates vary by region. Please check your account dashboard for your specific rate.';
    }
    
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({ reply: 'Service temporarily unavailable' });
  }
});

// ================== SAVE RECORD ==================
app.post('/save-record', protect, async (req, res) => {
  try {
    // Validate input
    const { curr, prev, name, phone, rate, fixed } = req.body;
    
    if (typeof curr !== 'number' || curr < 0) {
      return res.status(400).json({ error: "Invalid current reading" });
    }
    if (typeof prev !== 'number' || prev < 0) {
      return res.status(400).json({ error: "Invalid previous reading" });
    }
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const usage = curr - prev;
    const total = (usage * (rate || 2000)) + (fixed || 0);

    const record = new Record({
      userId: req.user.id,
      name,
      phone,
      prev,
      curr,
      usage,
      total,
      createdAt: new Date()
    });

    await record.save();
    
    // Clear cache for this user
    delete recordCache[req.user.id];

    res.json({ 
      success: true,
      record: {
        id: record._id,
        usage,
        total
      }
    });

  } catch (e) {
    console.error('Save record error:', e.message);
    res.status(500).json({ error: "Failed to save record" });
  }
});

// ================== RECORD CACHE ==================
const recordCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ================== GET RECORDS WITH PAGINATION ==================
app.get('/get-records', protect, async (req, res) => {
  try {
    const adminEmails = ['mickidadyhamza@gmail.com'];
    const isAdmin = adminEmails.includes(req.user.email);
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Check cache first (for non-admins)
    if (!isAdmin && recordCache[req.user.id]) {
      return res.json(recordCache[req.user.id]);
    }

    const query = isAdmin ? {} : { userId: req.user.id };
    
    // Use lean() for better performance
    const [records, total] = await Promise.all([
      Record.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Record.countDocuments(query).exec()
    ]);

    const response = {
      success: true,
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache for user records only
    if (!isAdmin) {
      recordCache[req.user.id] = response;
      setTimeout(() => {
        delete recordCache[req.user.id];
      }, CACHE_DURATION);
    }

    res.json(response);

  } catch (e) {
    console.error("Get records error:", e.message);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// ================== ROUTES ==================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/records.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'records.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/main.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'main.html')));
app.get('/botweb.html', (req, res) => res.sendFile(path.join(__dirname, 'botweb.html')));

// ================== HEALTH CHECK ==================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ================== ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error'
    : err.message;
  
  res.status(status).json({ 
    error: message,
    timestamp: new Date().toISOString()
  });
});

// ================== 404 HANDLER ==================
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ================== START ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});