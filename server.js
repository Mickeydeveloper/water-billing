require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Inaruhusu kusoma html files zako moja kwa moja

// Session Config (Muhimu kwa OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'water_secret',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// Simple in-memory user store (demo). Replace with DB in production.
const users = [];

function findUserByEmail(email) {
  const user = users.find(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase());
  console.log('🔍 findUserByEmail("' + email + '") ->', user ? 'FOUND: ' + user.id : 'NOT FOUND');
  return user;
}

function findUserById(id) {
  const user = users.find(u => u.id === id);
  console.log('🔍 findUserById("' + id + '") ->', user ? 'FOUND: ' + user.email : 'NOT FOUND', '(total users: ' + users.length + ')');
  return user;
}

// Passport Strategy (Google OAuth)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
      let user = email ? findUserByEmail(email) : null;

      if (!user) {
        // Create new user record
        user = {
          id: String(users.length + 1),
          name: profile.displayName || '',
          email: email,
          picture: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
          provider: 'google',
          googleId: profile.id,
          createdAt: new Date().toISOString()
        };
        users.push(user);
      } else {
        // Update existing
        user.name = profile.displayName || user.name;
        user.picture = (profile.photos && profile.photos[0] && profile.photos[0].value) || user.picture;
        user.googleId = profile.id || user.googleId;
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('✓ Serializing user:', user.id, user.email);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = findUserById(id);
  console.log('✓ Deserializing user ID:', id, 'Found:', user ? user.email : 'NOT FOUND');
  done(null, user || null);
});

// --- ROUTES ---

// Login Route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=oauth' }),
  (req, res) => {
    // Successful auth: redirect to homepage (index)
    res.redirect('/');
  }
);

// Protect records (Mfano wa kuzuia asiye na login asione records.html)
app.get('/records.html', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'records.html'));
    } else {
        res.redirect('/login');
    }
});

// Return current authenticated user (used by client to populate UI)
app.get('/api/me', (req, res) => {
  console.log('🔍 /api/me called - isAuthenticated:', req.isAuthenticated());
  console.log('🔍 req.user:', req.user);
  console.log('🔍 req.session:', req.session ? 'exists' : 'missing');
  console.log('🔍 req.session.passport:', req.session ? req.session.passport : 'no session');
  
  if (req.isAuthenticated() && req.user) {
    // Send minimal profile information from stored user
    const profile = {
      id: req.user.id || null,
      name: req.user.name || '',
      email: req.user.email || '',
      picture: req.user.picture || ''
    };
    console.log('✓ Returning authenticated user:', profile.email);
    return res.json({ user: profile });
  }
  
  console.warn('⚠️ Authentication failed in /api/me');
  return res.status(401).json({ error: 'Not authenticated' });
});

// Debug endpoint to check session status
app.get('/api/debug', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null,
    sessionId: req.sessionID,
    sessionPassport: req.session ? req.session.passport : null,
    allUsers: users.map(u => ({ id: u.id, email: u.email })),
    totalUsers: users.length
  });
});

// Simple in-memory record store (for demo). Requires session-authenticated user.
const records = [];
app.post('/save-record', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const record = req.body;
  if (!record || !record.name) {
    return res.status(400).json({ error: 'Invalid record' });
  }

  // Attach owner info from session (use normalized stored user fields)
  record.owner = (req.user && (req.user.email || req.user.id)) || 'unknown';
  record.id = records.length + 1;
  records.push(record);

  return res.json({ success: true, record });
});

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Local signup: create an account and sign the user in
app.post('/signup', (req, res) => {
  const { name, email, password, phone } = req.body;
  console.log('📝 /signup attempt:', email);
  
  if (!email || !password) {
    console.warn('⚠️ Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (findUserByEmail(email)) {
    console.warn('⚠️ User already exists:', email);
    return res.status(409).json({ error: 'User already exists' });
  }

  // Hash password before storing (demo). Use a proper user DB in production.
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const user = {
    id: String(users.length + 1),
    name: name || '',
    email,
    phone: phone || '',
    passwordHash: hash,
    provider: 'local',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  console.log('✓ User created with id:', user.id, 'email:', user.email);
  console.log('✓ Total users in store:', users.length);

  // Log the user in
  req.login(user, (err) => {
    if (err) {
      console.error('❌ req.login error:', err);
      return res.status(500).json({ error: 'Failed to login after signup' });
    }
    
    console.log('✓ After req.login - isAuthenticated:', req.isAuthenticated());
    
    // Save session before sending response
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('❌ Session save error:', saveErr);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      console.log('✓ Session saved for new user:', user.email);
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    });
  });
});

// Local login (email/password)
app.post('/local-login', (req, res) => {
  const { email, password } = req.body;
  console.log('📧 /local-login attempt:', email);
  
  if (!email || !password) {
    console.warn('⚠️ Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    console.warn('⚠️ User not found:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('✓ User found:', user.email, '- Checking password...');
  const match = bcrypt.compareSync(password, user.passwordHash || '');
  if (!match) {
    console.warn('⚠️ Password mismatch for:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('✓ Password match! Logging in user:', user.id, user.email);
  req.login(user, (err) => {
    if (err) {
      console.error('❌ req.login error:', err);
      return res.status(500).json({ error: 'Failed to login' });
    }
    
    console.log('✓ After req.login - isAuthenticated:', req.isAuthenticated());
    console.log('✓ After req.login - req.user:', req.user);
    
    // Save session before sending response
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('❌ Session save error:', saveErr);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      console.log('✓ Session saved successfully for user:', user.email);
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    });
  });
});

// Logout route: clear session and redirect
app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session && req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is runnin' on port ${PORT} 🚀`));
