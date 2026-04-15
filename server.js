require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();

// ================== BASIC ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

// ================== SESSION ==================
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// ================== MONGODB ==================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Mongo Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));

// ================== MODELS ==================
const User = mongoose.model('User', new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  passwordHash: String
}));

const Record = mongoose.model('Record', new mongoose.Schema({
  userId: String,
  name: String,
  phone: String,
  prev: Number,
  curr: Number,
  usage: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now }
}));

// ================== AUTH ==================
const protect = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
};

app.get('/api/me', (req, res) => {
  if (!req.user) return res.status(401).json({});
  res.json({ user: req.user });
});

// ================== SAVE RECORD ==================
app.post('/save-record', protect, async (req, res) => {
  try {
    const record = new Record({
      ...req.body,
      userId: req.user.id,
      usage: req.body.curr - req.body.prev
    });

    await record.save();
    res.json({ success: true });

  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Save failed" });
  }
});

// ================== GET RECORDS (FULL FIX) ==================
app.get('/get-records', protect, async (req, res) => {
  try {
    const adminEmails = ['mickidadyhamza@gmail.com'];

    const isAdmin = adminEmails.includes(req.user.email);

    let records;

    if (isAdmin) {
      records = await Record.find().sort({ createdAt: -1 });
    } else {
      records = await Record.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      records
    });

  } catch (e) {
    console.log("ERROR:", e);
    res.status(500).json({ error: "Failed" });
  }
});

// ================== ROUTES ==================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/records.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'records.html')));

// ================== START ==================
app.listen(3000, () => console.log("Server running 🚀"));