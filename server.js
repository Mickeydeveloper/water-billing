require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const webpush = require('web-push');

const app = express();

// --- 1. SETTINGS ZA SERVER ---
// Muhimu kwa Render/Heroku ili cookies za session zifanye kazi (HTTPS Proxy)
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory (for HTML, CSS, JS files)
app.use(express.static(__dirname, {
  index: false, // Don't serve index.html automatically
  dotfiles: 'deny' // Deny access to dotfiles
}));

// --- 2. SESSION CONFIG ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'water_secret_123',
  resave: false, // Usi-save session kama haijabadilika
  saveUninitialized: false, // Usitengeneze session mpaka user alogin
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // True ukiwa live (HTTPS)
    httpOnly: true, 
    maxAge: 7 * 24 * 60 * 60 * 1000, // Wiki 1
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- 3.5. MONGODB CONNECTION CHECK MIDDLEWARE ---
const checkMongoConnection = (req, res, next) => {
  if (!isMongoConnected) {
    console.error('MongoDB not connected, rejecting request');
    return res.status(503).json({ error: 'Database connection unavailable' });
  }
  next();
};

// --- 3. MONGODB CONNECTION ---
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://mickidadyhamza_db_user:U41ddz44QsMxBI7D@cluster0.motlmco.mongodb.net/?appName=Cluster0';
console.log('Connecting to MongoDB...');

let isMongoConnected = false;

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('MongoDB connected successfully');
  isMongoConnected = true;
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  isMongoConnected = false;
  // Don't exit, just log the error
});

// --- 4. WEB PUSH CONFIGURATION ---
// VAPID keys for Web Push notifications (generate your own in production)
// You can generate keys using: npx web-push generate-vapid-keys
webpush.setVapidDetails(
  'mailto:admin@waterbilling.com', // Replace with your email
  process.env.VAPID_PUBLIC_KEY || 'BM8VdKmJC6e8rXc3x0zqF5zQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQ',
  process.env.VAPID_PRIVATE_KEY || 'your_private_key_here_replace_in_production'
);

// Store push subscriptions (in production, save to database)
let pushSubscriptions = [];

// --- 4. MONGOOSE MODELS ---
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: String,
  picture: String,
  provider: { type: String, required: true }
});

const recordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  prev: { type: Number, required: true },
  curr: { type: Number, required: true },
  usage: { type: Number, required: true },
  rate: { type: Number, required: true },
  fixed: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: String, required: true }
});

// Push Subscription Schema for PWA notifications
const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Associated user ID
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);
const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

// --- 5. DATABASE FUNCTIONS ---
async function findUserByEmail(email) {
  try {
    const normalizedEmail = email.toLowerCase();
    console.log('Searching for user with email:', normalizedEmail);
    const user = await User.findOne({ email: normalizedEmail });
    console.log('Database query result:', user ? 'found' : 'not found');
    return user;
  } catch (error) {
    console.error('Database error in findUserByEmail:', error);
    throw error;
  }
}

async function findUserById(id) {
  try {
    const user = await User.findOne({ id });
    return user;
  } catch (error) {
    console.error('Database error in findUserById:', error);
    throw error;
  }
}

// --- 6. PASSPORT CONFIG ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    proxy: true // Muhimu kwa OAuth ukiwa kwenye proxy (Render)
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!isMongoConnected) {
        return done(new Error('Database connection unavailable'), null);
      }

      const email = profile.emails?.[0]?.value || null;
      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }
      let user = await findUserByEmail(email);

      if (!user) {
        user = new User({
          id: String(Date.now()),
          name: profile.displayName,
          email: email.toLowerCase(),
          picture: profile.photos?.[0]?.value || '',
          provider: 'google'
        });
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    if (!isMongoConnected) {
      return done(new Error('Database connection unavailable'), null);
    }

    const user = await findUserById(id);
    done(null, user || null);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

// --- 5. ROUTES ---

// Login & Signup Pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// Google Auth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  (req, res) => res.redirect('/index.html') // After login, go to dashboard
);

// Local Signup
app.post('/signup', checkMongoConnection, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.toLowerCase();
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      id: String(Date.now()), 
      name, 
      email: normalizedEmail, 
      phone, 
      passwordHash: hashedPassword,
      provider: 'local' 
    });
    await user.save();

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      req.session.save(() => res.json({ success: true }));
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Local Login
app.post('/local-login', checkMongoConnection, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    const user = await findUserByEmail(email);
    console.log('User found:', user ? 'yes' : 'no');
    
    if (!user || !user.passwordHash) {
      console.log('Invalid credentials - no user or no password hash');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', match);
    
    if (!match) {
      console.log('Password does not match');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }
      req.session.save(() => {
        console.log('Login successful for user:', user.email);
        res.json({ success: true });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// API ya ku-check kama user ameingia (Inatumika na main.html/index.html)
app.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// API for admin statistics
app.get('/api/users/count', checkMongoConnection, async (req, res) => {
  try {
    const count = await User.countDocuments({});
    res.json({ count });
  } catch (error) {
    console.error('Error getting user count:', error);
    res.status(500).json({ error: 'Failed to get user count' });
  }
});

app.get('/api/records/count', checkMongoConnection, async (req, res) => {
  try {
    const count = await Record.countDocuments({});
    res.json({ count });
  } catch (error) {
    console.error('Error getting record count:', error);
    res.status(500).json({ error: 'Failed to get record count' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// API ya kusave billing record
app.post('/save-record', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user.id;
    const { name, phone, prev, curr, rate, fixed, total, date } = req.body;

    // Validate required fields
    if (!name || !phone || prev === undefined || curr === undefined || rate === undefined || fixed === undefined || total === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prevNum = parseFloat(prev);
    const currNum = parseFloat(curr);
    const rateNum = parseFloat(rate);
    const fixedNum = parseFloat(fixed);
    const totalNum = parseFloat(total);

    if (isNaN(prevNum) || isNaN(currNum) || isNaN(rateNum) || isNaN(fixedNum) || isNaN(totalNum)) {
      return res.status(400).json({ error: 'Invalid number format' });
    }

    // Create record object
    const record = new Record({
      userId,
      id: String(Date.now()),
      name,
      phone,
      prev: parseFloat(prev),
      curr: parseFloat(curr),
      usage: parseFloat(curr) - parseFloat(prev),
      rate: parseFloat(rate),
      fixed: parseFloat(fixed),
      total: parseFloat(total),
      date: date || new Date().toISOString()
    });

    // Save record
    await record.save();

    res.json({ 
      success: true, 
      message: 'Record saved successfully',
      record: record
    });
  } catch (error) {
    console.error('Save record error:', error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// API ya kuget all billing records
app.get('/get-records', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user.id;
    const records = await Record.find({ userId }).sort({ date: -1 });

    res.json({ 
      success: true,
      records: records
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Failed to get records' });
  }
});

// API ya kudelete billing record
app.delete('/delete-record/:recordId', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user.id;
    const recordId = req.params.recordId;

    const result = await Record.deleteOne({ userId, id: recordId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ 
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
});

// --- WEB PUSH API ROUTES ---

// Subscribe to push notifications
app.post('/api/push/subscribe', checkMongoConnection, async (req, res) => {
  try {
    const subscription = req.body;
    const userId = req.user ? req.user.id : 'anonymous'; // Use user ID if authenticated

    // Validate subscription object
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.keys = subscription.keys;
      existingSubscription.lastUsed = new Date();
      existingSubscription.userAgent = req.get('User-Agent');
      await existingSubscription.save();
      console.log('Push subscription updated for user:', userId);
    } else {
      // Create new subscription
      const newSubscription = new PushSubscription({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: req.get('User-Agent')
      });
      await newSubscription.save();
      console.log('New push subscription created for user:', userId);
    }

    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Send bulk push notifications to all subscribers (Admin only)
app.post('/api/push/send-bulk', checkMongoConnection, async (req, res) => {
  try {
    const { title, body, icon, badge, url } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Get all active subscriptions
    const subscriptions = await PushSubscription.find({});
    console.log(`Sending bulk notification to ${subscriptions.length} subscribers`);

    if (subscriptions.length === 0) {
      return res.json({ success: true, message: 'No subscribers found', sent: 0 });
    }

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: icon || '/icon-192x192.svg',
      badge: badge || '/icon-192x192.svg',
      data: {
        url: url || '/',
        timestamp: Date.now()
      }
    });

    let successCount = 0;
    let failureCount = 0;
    const failedEndpoints = [];

    // Send notifications with proper error handling
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: subscription.keys
        }, payload);

        // Update last used timestamp
        subscription.lastUsed = new Date();
        await subscription.save();

        successCount++;
        console.log(`Notification sent successfully to: ${subscription.userId}`);
      } catch (error) {
        failureCount++;
        console.error(`Failed to send notification to ${subscription.endpoint}:`, error.message);

        // Handle different error types
        if (error.statusCode === 410 || error.statusCode === 400) {
          // Subscription expired or invalid, remove it
          await PushSubscription.deleteOne({ _id: subscription._id });
          console.log('Removed expired subscription:', subscription.endpoint);
        } else {
          failedEndpoints.push(subscription.endpoint);
        }
      }
    });

    await Promise.allSettled(promises);

    res.json({
      success: true,
      message: `Notifications sent: ${successCount} successful, ${failureCount} failed`,
      sent: successCount,
      failed: failureCount,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ error: 'Failed to send bulk notifications' });
  }
});

// Get push notification statistics
app.get('/api/push/stats', checkMongoConnection, async (req, res) => {
  try {
    const totalSubscriptions = await PushSubscription.countDocuments({});
    const recentSubscriptions = await PushSubscription.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      totalSubscriptions,
      recentSubscriptions,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error getting push stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get VAPID public key for client-side subscription
app.get('/api/push/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BM8VdKmJC6e8rXc3x0zqF5zQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQ';
  res.json({ publicKey });
});

// Kulinda files za Dashboard
const protect = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/main.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'main.html')));
app.get('/records.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'records.html')));
app.get('/admin.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT} 🚀`));

// Global error handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit in production
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production
});
