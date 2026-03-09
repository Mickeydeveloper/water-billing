require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

const app = express();

// --- 1. SETTINGS ZA SERVER ---
// Muhimu kwa Render/Heroku ili cookies za session zifanye kazi (HTTPS Proxy)
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

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

// --- 3. DATABASE (DEMO ONLY) ---
// ONYO: Hii itafutika kila Render ikirestart. Kwa app kubwa, tumia MongoDB.
const users = [];
const userRecords = {}; // Store billing records for each user

function findUserByEmail(email) {
  return users.find(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase());
}

function findUserById(id) {
  return users.find(u => u.id === id);
}

// --- 4. PASSPORT CONFIG ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    proxy: true // Muhimu kwa OAuth ukiwa kwenye proxy (Render)
  },
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value || null;
    let user = email ? findUserByEmail(email) : null;

    if (!user) {
      user = {
        id: String(Date.now()), // Tumia timestamp kama ID ya muda
        name: profile.displayName,
        email: email,
        picture: profile.photos?.[0]?.value || '',
        provider: 'google'
      };
      users.push(user);
    }
    return done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = findUserById(id);
  done(null, user || null);
});

// --- 5. ROUTES ---

// Login & Signup Pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

// Google Auth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  (req, res) => res.redirect('/main.html') // Baada ya login peleka main.html
);

// Local Signup
app.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (findUserByEmail(email)) return res.status(400).json({ error: 'User exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: String(Date.now()), name, email, phone, passwordHash: hashedPassword, provider: 'local' };
  users.push(user);

  req.login(user, (err) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    req.session.save(() => res.json({ success: true }));
  });
});

// Local Login
app.post('/local-login', async (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  req.login(user, (err) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    req.session.save(() => res.json({ success: true }));
  });
});

// API ya ku-check kama user ameingia (Inatumika na main.html/index.html)
app.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ user: req.user });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// API ya kusave billing record
app.post('/save-record', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user.id;
  const { name, phone, prev, curr, rate, fixed, total, date } = req.body;

  // Validate required fields
  if (!name || !phone || prev === undefined || curr === undefined || rate === undefined || fixed === undefined || total === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Initialize user records array if not exist
  if (!userRecords[userId]) {
    userRecords[userId] = [];
  }

  // Create record object
  const record = {
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
  };

  // Save record
  userRecords[userId].push(record);

  res.json({ 
    success: true, 
    message: 'Record saved successfully',
    record: record
  });
});

// API ya kuget all billing records
app.get('/get-records', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user.id;
  const records = userRecords[userId] || [];

  res.json({ 
    success: true,
    records: records
  });
});

// API ya kudelete billing record
app.delete('/delete-record/:recordId', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user.id;
  const recordId = req.params.recordId;

  // Initialize user records array if not exist
  if (!userRecords[userId]) {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Find and remove the record
  const initialLength = userRecords[userId].length;
  userRecords[userId] = userRecords[userId].filter(r => r.id !== recordId);

  if (userRecords[userId].length === initialLength) {
    return res.status(404).json({ error: 'Record not found' });
  }

  res.json({ 
    success: true,
    message: 'Record deleted successfully'
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
});

// Kulinda files za Dashboard
const protect = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/main.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'main.html')));
app.get('/records.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'records.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT} 🚀`));
