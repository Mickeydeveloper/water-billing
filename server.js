require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Inaruhusu kusoma html files zako moja kwa moja

// Session Config (Muhimu kwa OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'water_secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy (Inasoma OAuth kutoka kwenye .env)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- ROUTES ---

// Login Route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/main.html') // Ikifaulu inapeleka main.html
);

// Protect records (Mfano wa kuzuia asiye na login asione records.html)
app.get('/records.html', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'records.html'));
    } else {
        res.redirect('/login');
    }
});

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Logout
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is runnin' on port ${PORT} 🚀`));
