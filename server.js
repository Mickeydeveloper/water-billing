require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const axios = require('axios'); // Nimeongeza hii kwa ajili ya AI API

const app = express();

// --- 1. SETTINGS ZA SERVER ---
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname, {
  index: false,
  dotfiles: 'deny'
}));

// --- 2. SESSION CONFIG ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'water_secret_123',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- 3. MONGODB CONNECTION ---
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://mickidadyhamza_db_user:U41ddz44QsMxBI7D@cluster0.motlmco.mongodb.net/?appName=Cluster0';
let isMongoConnected = false;

const checkMongoConnection = (req, res, next) => {
  if (!isMongoConnected) return res.status(503).json({ error: 'Database connection unavailable' });
  next();
};

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully ✅');
  isMongoConnected = true;
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  isMongoConnected = false;
});

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
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  recordId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card', 'mobile_money', 'bank'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  description: String,
  transactionId: { type: String, unique: true },
  paymentDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// --- 5. PASSPORT CONFIG ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(new Error('No email provided'), null);
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          id: String(Date.now()),
          name: profile.displayName,
          email,
          picture: profile.photos?.[0]?.value || '',
          provider: 'google'
        });
        await user.save();
      }
      return done(null, user);
    } catch (e) { return done(e, null); }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ id });
    done(null, user);
  } catch (e) { done(e, null); }
});

// --- 6. ROUTES ---
const protect = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// AI PROXY ROUTE (Hii ndiyo inafanya Chat ifanye kazi kwenye Web)
app.get('/api/chat', async (req, res) => {
  const userText = req.query.text;
  if (!userText) return res.status(400).json({ error: 'andika kitu' });

  const prompt = `
Wewe ni chatbot msaidizi.

Sheria:
- Jibu swali moja kwa jibu moja tu.
- Tumia majibu mafupi sana (short and clear).
- Usiongeze maelezo yasiyoombwa.
- Tumia Kiswahili rahisi + English kidogo.

Context rules:
- Kama swali ni salamu (mfano: habari, hi, hello) → jibu salamu tu.
- Kama swali linahusu bot au deployment → toa hatua chache (few steps only).
- Kama mtu anauliza kuhusu bot → mpe link hii tu:
https://github.com/Mickeydeveloper/Mickey-Glitch
(sema: link iko juu / link is above)

- Usijibu vitu vingi kwa swali moja.
- Usirudie majibu.

Fanya mazungumzo yawe simple, fast na yasiyokela.
`;
  
  try {
    const response = await axios.get(`https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(prompt + " " + userText)}`);
    const reply = response.data.result || response.data.response || "Dah mwanangu, nimepata data tupu.";
    res.json({ reply });
  } catch (e) {
    console.error("AI Error:", e.message);
    res.status(500).json({ reply: "Mwanangu network ya AI inayumba, jaribu tena kdg!" });
  }
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  (req, res) => res.redirect('/records.html')
);

app.post('/signup', checkMongoConnection, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      id: String(Date.now()), name, email: email.toLowerCase(), phone, 
      passwordHash: hashedPassword, provider: 'local' 
    });
    await user.save();
    req.login(user, (err) => res.json({ success: true }));
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/local-login', checkMongoConnection, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid creds' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid' });
  req.login(user, (err) => res.json({ success: true }));
});

app.get('/api/me', (req, res) => req.isAuthenticated() ? res.json({ user: req.user }) : res.status(401).json({ error: 'No' }));

// Check if user is admin (for now, check if email contains 'admin' or specific domain)
app.get('/api/is-admin', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ isAdmin: false });
  const adminEmails = ['mickidadyhamza@gmail.com', 'mickey@water-billing.com'];
  const isAdmin = adminEmails.includes(req.user.email?.toLowerCase());
  res.json({ isAdmin });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
});

app.post('/save-record', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  try {
    const record = new Record({ ...req.body, userId: req.user.id, id: String(Date.now()), usage: req.body.curr - req.body.prev });
    await record.save();
    res.json({ success: true });
  } catch (e) { res.status(500).send(); }
});

app.get('/get-records', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  
  // Check if user is admin
  const adminEmails = ['mickidadyhamza@gmail.com', 'mickey@water-billing.com'];
  const isAdmin = adminEmails.includes(req.user.email?.toLowerCase());
  
  // Get records: all for admin, only user's records for regular users
  let records;
  if (isAdmin) {
    records = await Record.find().sort({ date: -1 });
  } else {
    records = await Record.find({ userId: req.user.id }).sort({ date: -1 });
  }
  
  res.json({ 
    success: true, 
    records,
    currentUserId: req.user.id,
    currentUserEmail: req.user.email,
    isAdmin
  });
});

// ======================== PAYMENT ROUTES ========================
app.post('/save-payment', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  try {
    const { recordId, amount, method, description } = req.body;
    if (!recordId || !amount || !method) return res.status(400).json({ error: 'Missing fields' });

    const payment = new Payment({
      userId: req.user.id,
      recordId,
      amount,
      method,
      description,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed'
    });
    await payment.save();
    res.json({ success: true, payment });
  } catch (e) {
    console.error('Payment error:', e);
    res.status(500).json({ error: 'Payment save failed' });
  }
});

app.get('/get-payments', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ paymentDate: -1 });
    res.json({ success: true, payments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.get('/get-payment-stats', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  try {
    const totalAmount = await Payment.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const completedPayments = await Payment.countDocuments({ userId: req.user.id, status: 'completed' });
    const pendingPayments = await Payment.countDocuments({ userId: req.user.id, status: 'pending' });
    
    res.json({
      success: true,
      totalAmount: totalAmount[0]?.total || 0,
      completedPayments,
      pendingPayments
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ======================== NOTIFICATION ROUTES ========================
// In-memory notifications (can upgrade to MongoDB later)
const notifications = {};

app.post('/send-notification', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  try {
    const { recordId, title, message, type } = req.body;
    if (!recordId || !title) return res.status(400).json({ error: 'Missing fields' });

    const notif = {
      id: String(Date.now()),
      userId: req.user.id,
      recordId,
      title,
      message,
      type: type || 'info',
      read: false,
      createdAt: new Date()
    };

    if (!notifications[req.user.id]) notifications[req.user.id] = [];
    notifications[req.user.id].push(notif);

    res.json({ success: true, notification: notif });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/get-notifications', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  const userNotifs = notifications[req.user.id] || [];
  res.json({ success: true, notifications: userNotifs });
});

app.post('/mark-notification-read', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  const { notifId } = req.body;
  const userNotifs = notifications[req.user.id] || [];
  const notif = userNotifs.find(n => n.id === notifId);
  if (notif) notif.read = true;
  res.json({ success: true });
});

// ======================== ADMIN ROUTES ========================
app.get('/api/users/count', checkMongoConnection, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count, success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to count users' });
  }
});

app.get('/api/records/count', checkMongoConnection, async (req, res) => {
  try {
    const count = await Record.countDocuments();
    res.json({ count, success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to count records' });
  }
});

app.get('/api/users/list', checkMongoConnection, async (req, res) => {
  try {
    const users = await User.find().select('id name email phone provider -_id').limit(100);
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/payments/stats', checkMongoConnection, async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const byStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0,
      byStatus
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch payment stats' });
  }
});

app.post('/api/user/update', checkMongoConnection, async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send();
  try {
    const { name, phone } = req.body;
    await User.findOneAndUpdate(
      { id: req.user.id },
      { name, phone },
      { new: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', mongodb: isMongoConnected }));

// Page protection
app.get('/', protect, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/main.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'main.html')));
app.get('/records.html', protect, (req, res) => res.sendFile(path.join(__dirname, 'records.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT} 🚀`));
