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
const nodemailer = require('nodemailer');

const app = express();

// ================== EMAIL CONFIGURATION ==================
// Email transporter - using Gmail or custom SMTP
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email sending function
const sendEmail = async (to, subject, html) => {
  try {
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
      console.log('📧 Email (not sent):', { to, subject });
      return { success: false, error: 'Email service not configured' };
    }

    const info = await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'Water Billing System <noreply@waterbilling.local>',
      to: to,
      subject: subject,
      html: html
    });
    console.log('📧 Email sent to:', to, '| MessageID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

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
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: false, 
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  },
  name: 'waterBillingSid'
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
  resetToken: { type: String, index: true, sparse: true },
  resetExpiry: { type: Date, index: true, sparse: true },
  lastLogin: { type: Date, default: null },
  tempPassword: { type: String, sparse: true }, // Temporary password set by admin
  passwordChangeRequired: { type: Boolean, default: false }, // Flag if user must change password
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

// Password Reset Requests Schema
const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  userName: String,
  resetToken: { type: String, unique: true, sparse: true },
  newPassword: { type: String, sparse: true }, // Generated password by admin
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, index: true },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'expired'], default: 'pending' },
  emailSent: { type: Boolean, default: false },
  approvedBy: String, // Admin email who approved
  approvedAt: Date
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);
const PasswordResetRequest = mongoose.model('PasswordResetRequest', passwordResetSchema);

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
    // Validate profile data
    if (!profile.id) {
      console.error('❌ Google OAuth: Missing profile.id');
      return done(new Error('Invalid Google profile'));
    }

    const email = profile.emails?.[0]?.value;
    if (!email) {
      console.error('❌ Google OAuth: Missing email in profile');
      return done(new Error('Email required from Google profile'));
    }

    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Check if email already exists
      const existingByEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingByEmail) {
        console.log('ℹ️  Google OAuth: Linking Google ID to existing email');
        existingByEmail.googleId = profile.id;
        existingByEmail.picture = profile.photos?.[0]?.value || existingByEmail.picture;
        existingByEmail.lastLogin = new Date();
        await existingByEmail.save();
        return done(null, existingByEmail);
      }

      // Create new user
      user = new User({
        id: profile.id,
        googleId: profile.id,
        name: profile.displayName || 'User',
        email: email.toLowerCase(),
        picture: profile.photos?.[0]?.value,
        provider: 'google',
        lastLogin: new Date()
      });
      console.log('✅ Google OAuth: New user created:', email);
      await user.save();
    } else {
      // Update last login
      user.lastLogin = new Date();
      user.picture = profile.photos?.[0]?.value || user.picture;
      await user.save();
      console.log('✅ Google OAuth: Existing user logged in:', email);
    }
    
    return done(null, user);
  } catch (err) {
    console.error('❌ Google OAuth error:', err.message);
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
    if (!id) {
      return done(null, false);
    }
    const user = await User.findById(id).lean();
    if (!user) {
      console.log('⚠️  User not found during deserialization:', id);
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    console.error('❌ Deserialization error:', err.message);
    done(err);
  }
});

// ================== AUTH ==================
const protect = (req, res, next) => {
  if (!req.isAuthenticated()) {
    console.log('⚠️  Unauthorized access attempt to protected route:', req.path);
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!req.user) {
    console.log('⚠️  User session lost on:', req.path);
    return res.status(401).json({ error: "Session expired" });
  }
  next();
};

const adminEmails = ['mickidadyhamza@gmail.com'];
const isAdmin = (user) => user && adminEmails.includes(user.email);

// Track active sessions
const activeSessions = {};

app.get('/api/me', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({});
    }
    res.json({ user: req.user });
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ================== USER MANAGEMENT ENDPOINTS ==================

// Get all users (admin only)
app.get('/api/users/list', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const users = await User.find({}).select('-passwordHash').lean().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user count
app.get('/api/users/count', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const count = await User.countDocuments({});
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count users' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { name, email } = req.body;
    if (!name && !email) {
      return res.status(400).json({ error: 'At least one field is required' });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also delete all records for this user
    await Record.deleteMany({ userId: user.id });
    
    res.json({ success: true, message: 'User and their records deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get records count
app.get('/api/records/count', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const count = await Record.countDocuments({});
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count records' });
  }
});

// Get payment stats
app.get('/api/payments/stats', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const records = await Record.find({}).lean();
    const totalPayments = records.length;
    const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
    
    res.json({ totalPayments, totalAmount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get payment stats' });
  }
});

// Password reset request (send notification to admin and user)
app.post('/api/password-reset-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'Email not found in our system' });
    }
    
    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + (1 * 60 * 60 * 1000); // 1 hour
    
    // Store reset token in user record
    user.resetToken = resetToken;
    user.resetExpiry = resetExpiry;
    await user.save();
    
    // Store reset request in database for admin notification
    const resetRequest = new PasswordResetRequest({
      email: user.email,
      userName: user.name,
      resetToken: resetToken,
      expiresAt: new Date(resetExpiry),
      status: 'pending'
    });
    
    await resetRequest.save();
    
    // Send email to user
    const userEmailHtml = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>Your password reset request has been received. Please wait for admin approval.</p>
      <p><strong>Status:</strong> Pending Approval</p>
      <p>Once approved, you will receive your new password via email.</p>
      <p><small>This request expires in 1 hour.</small></p>
      <hr>
      <p>Water Billing System</p>
    `;
    
    await sendEmail(user.email, 'Password Reset Request Received', userEmailHtml);
    
    console.log('🔐 Password Reset Request:', {
      email: user.email,
      userName: user.name,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(resetExpiry).toISOString()
    });
    
    res.json({ 
      success: true,
      message: 'Password reset request submitted. Admin will review it shortly.'
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Get password reset requests (admin only)
app.get('/api/password-reset-requests', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const requests = await PasswordResetRequest.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    res.json({ success: true, requests });
  } catch (err) {
    console.error('Get password reset requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Send notification to all users (admin only)
app.post('/api/send-notification', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, body, url } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Log notification to console (in production, send via push service)
    const notification = {
      title,
      body,
      url: url || '/records.html',
      sentBy: req.user.email,
      sentAt: new Date().toISOString(),
      recipientCount: (await User.countDocuments({}))
    };

    console.log('📬 Notification Sent:', notification);

    res.json({ 
      success: true, 
      message: 'Notification sent to all users',
      notification
    });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ================== ADMIN RECORD MANAGEMENT ==================

// Get all records (admin only)
app.get('/api/records/all', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Record.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Record.countDocuments({})
    ]);

    res.json({
      success: true,
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get all records error:', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Edit record (admin only)
app.put('/api/records/:id', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { name, phone, prev, curr, usage, total } = req.body;
    
    if (!req.params.id) {
      return res.status(400).json({ error: 'Record ID required' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (typeof prev === 'number') updateData.prev = prev;
    if (typeof curr === 'number') updateData.curr = curr;
    if (typeof usage === 'number') updateData.usage = usage;
    if (typeof total === 'number') updateData.total = total;

    // If prev and curr provided, recalculate usage
    if (typeof prev === 'number' && typeof curr === 'number') {
      updateData.usage = curr - prev;
    }

    const record = await Record.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    console.log('✏️  Record edited by admin:', req.user.email, 'Record:', record._id);
    res.json({ success: true, record });
  } catch (err) {
    console.error('Edit record error:', err);
    res.status(500).json({ error: 'Failed to edit record' });
  }
});

// Delete record (admin only)
app.delete('/api/records/:id', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    console.log('🗑️  Record deleted by admin:', req.user.email);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// ================== ADMIN PASSWORD MANAGEMENT ==================

// Approve password reset and generate new password (admin only)
app.post('/api/admin/approve-password-reset', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID required' });
    }

    const resetRequest = await PasswordResetRequest.findById(requestId);
    if (!resetRequest) {
      return res.status(404).json({ error: 'Reset request not found' });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Generate new password
    const newPassword = require('crypto').randomBytes(8).toString('hex').toUpperCase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    const user = await User.findOne({ email: resetRequest.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.passwordHash = hashedPassword;
    user.passwordChangeRequired = true;
    user.tempPassword = newPassword;
    await user.save();

    // Update reset request
    resetRequest.status = 'approved';
    resetRequest.newPassword = newPassword;
    resetRequest.approvedBy = req.user.email;
    resetRequest.approvedAt = new Date();
    await resetRequest.save();

    // Send email with new password
    const emailHtml = `
      <h2>Password Reset Approved</h2>
      <p>Hello ${user.name},</p>
      <p>Your password reset request has been <strong>approved</strong>.</p>
      <p>Your temporary password is: <code style="font-size:16px; font-weight:bold; background:#f0f0f0; padding:10px;">${newPassword}</code></p>
      <p><strong>Important:</strong> You must change this password when you log in.</p>
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/login.html" style="display:inline-block; background:#2563eb; color:white; padding:10px 20px; border-radius:5px; text-decoration:none;">Log In Here</a>
      </p>
      <hr>
      <p><small>Approved by: ${req.user.email}</small></p>
      <p>Water Billing System</p>
    `;

    await sendEmail(user.email, 'Your New Password - Please Log In', emailHtml);

    console.log('✅ Password reset approved for:', user.email, 'New password sent via email');

    res.json({ 
      success: true, 
      message: 'Password reset approved. New password sent to user email.',
      userId: user._id
    });
  } catch (err) {
    console.error('Approve password reset error:', err);
    res.status(500).json({ error: 'Failed to approve password reset' });
  }
});

// Admin manually reset user password (admin only)
app.post('/api/admin/reset-user-password', protect, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new password
    const newPassword = require('crypto').randomBytes(8).toString('hex').toUpperCase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.passwordHash = hashedPassword;
    user.passwordChangeRequired = true;
    user.tempPassword = newPassword;
    await user.save();

    // Send email with new password
    const emailHtml = `
      <h2>Your Password Has Been Reset</h2>
      <p>Hello ${user.name},</p>
      <p>Your password has been reset by the administrator.</p>
      <p>Your temporary password is: <code style="font-size:16px; font-weight:bold; background:#f0f0f0; padding:10px;">${newPassword}</code></p>
      <p><strong>Important:</strong> You must change this password when you log in.</p>
      <p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/login.html" style="display:inline-block; background:#2563eb; color:white; padding:10px 20px; border-radius:5px; text-decoration:none;">Log In Now</a>
      </p>
      <hr>
      <p>Water Billing System</p>
    `;

    await sendEmail(user.email, 'Your Password Has Been Reset', emailHtml);

    console.log('✅ Password reset for user:', user.email, 'New password sent via email');

    res.json({ 
      success: true, 
      message: 'User password reset. New password sent to their email.',
      userId: user._id,
      userEmail: user.email
    });
  } catch (err) {
    console.error('Reset user password error:', err);
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

// ================== ADMIN SETUP ==================
// Setup admin account (one-time or reset)
app.post('/api/setup-admin', async (req, res) => {
  try {
    const adminEmail = 'mickidadyhamza@gmail.com';
    const adminPassword = 'MICKEY24@';
    
    // Check if admin already exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Update existing admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser.passwordHash = hashedPassword;
      adminUser.name = 'Admin';
      adminUser.provider = 'local';
      await adminUser.save();
      
      console.log('✅ Admin password updated successfully');
      res.json({ 
        success: true, 
        message: 'Admin account updated',
        email: adminEmail,
        password: adminPassword
      });
    } else {
      // Create new admin account
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const newAdmin = new User({
        id: 'admin_' + Date.now(),
        name: 'Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        provider: 'local',
        createdAt: new Date()
      });
      
      await newAdmin.save();
      
      console.log('✅ Admin account created successfully');
      res.json({ 
        success: true, 
        message: 'Admin account created',
        email: adminEmail,
        password: adminPassword
      });
    }
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: 'Failed to setup admin account' });
  }
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
    
    req.login(user, async (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      
      // Track last login
      try {
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
      } catch (e) {
        console.error('Failed to update lastLogin:', e);
      }
      
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

app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: true }, async (err, user, info) => {
    try {
      if (err) {
        console.error('❌ Google auth error:', err);
        return res.redirect(`/login.html?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!user) {
        console.error('❌ No user returned from Google strategy:', info);
        return res.redirect('/login.html?error=no-user');
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error('❌ Session login error:', loginErr.message);
          return res.redirect('/login.html?error=session-failed');
        }

        // Determine redirect based on admin status
        const adminEmails = ['mickidadyhamza@gmail.com'];
        const isAdminUser = adminEmails.includes(user.email);
        const redirectUrl = isAdminUser ? '/admin.html' : '/records.html';

        console.log('✅ Google OAuth successful:', user.email, '→', redirectUrl);
        res.redirect(redirectUrl);
      });
    } catch (error) {
      console.error('❌ Unexpected error in Google callback:', error);
      res.redirect('/login.html?error=unexpected-error');
    }
  })(req, res, next);
});

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
      return res.json({ 
        reply: 'Hello! I am your Water Billing Assistant. I can help you with:\n• Billing calculations\n• Water usage information\n• Meter readings\n• Account questions\n\nWhat would you like to know?' 
      });
    }
    
    const lowerText = text.toLowerCase();
    let reply = 'I can help with billing calculations and water usage tracking. What would you like to know?';
    let confidence = 'medium';
    
    // Billing and charges
    if (lowerText.includes('billing') || lowerText.includes('charge') || lowerText.includes('how much')) {
      reply = `💧 **Water Billing Calculation**\n\nYour bill is calculated using:\n**Total = (Current Reading - Previous Reading) × Unit Rate + Fixed Charges**\n\nExample:\n• Previous: 100 m³\n• Current: 125 m³\n• Usage: 25 m³\n• Rate: 2,000/m³\n• Fixed: 1,000\n• Total: (25 × 2,000) + 1,000 = 51,000\n\nWould you like help calculating your bill?`;
      confidence = 'high';
    } 
    // Usage information
    else if (lowerText.includes('usage') || lowerText.includes('consume') || lowerText.includes('meter')) {
      reply = `📊 **Water Usage Information**\n\nWater usage = Current Meter Reading - Previous Meter Reading\n\n**Understanding Your Meter:**\n• Meter shows total water used since installation\n• Read from right to left\n• Measured in cubic meters (m³)\n• 1 m³ = 1,000 liters\n\n**Tips to Reduce Usage:**\n• Fix leaks promptly\n• Use water-efficient fixtures\n• Avoid leaving taps running\n• Regular garden watering schedules\n\nNeed help with your readings?`;
      confidence = 'high';
    } 
    // Help menu
    else if (lowerText.includes('help') || lowerText.includes('what can') || lowerText.includes('options')) {
      reply = `🆘 **I can assist with:**\n\n1️⃣  **Billing** - How bills are calculated\n2️⃣  **Usage** - Understanding meter readings\n3️⃣  **Rates** - Current water rates and charges\n4️⃣  **Account** - Account and profile questions\n5️⃣  **Payment** - Payment methods and due dates\n6️⃣  **Complaints** - Report issues or concerns\n\nJust ask me anything about water billing!`;
      confidence = 'high';
    } 
    // Rates and pricing
    else if (lowerText.includes('rate') || lowerText.includes('price') || lowerText.includes('cost')) {
      reply = `💰 **Water Rates & Pricing**\n\n**Standard Rates:**\n• Unit Rate: 2,000 per m³\n• Fixed Charge: 1,000 per billing cycle\n\n**How to Reduce Your Bill:**\n• Monitor your usage regularly\n• Fix water leaks immediately\n• Maintain your meter properly\n\n**Questions about your bill?** Contact the billing department for details specific to your account.`;
      confidence = 'high';
    }
    // Account related
    else if (lowerText.includes('account') || lowerText.includes('profile') || lowerText.includes('register')) {
      reply = `👤 **Account Information**\n\n**Your Account Includes:**\n• Billing history\n• Usage records\n• Payment tracking\n• Meter information\n\n**Access Your Account:**\n• Log in with email and password\n• Use Google sign-in option\n• Reset password if needed\n\nNeed help with your account?`;
      confidence = 'high';
    }
    // Payment
    else if (lowerText.includes('payment') || lowerText.includes('pay') || lowerText.includes('due')) {
      reply = `💳 **Payment Information**\n\n**Payment Methods:**\n• Bank transfer\n• Mobile money\n• Online payment portal\n\n**Due Dates:**\n• Bills are due 30 days from issue date\n• Late payments may incur penalties\n• Payment confirmation via email\n\n**Can't Pay on Time?**\nContact our office to arrange payment plans.`;
      confidence = 'high';
    }
    // Complaints
    else if (lowerText.includes('complain') || lowerText.includes('issue') || lowerText.includes('problem')) {
      reply = `📢 **Report an Issue**\n\n**Common Issues:**\n• High billing\n• Meter problems\n• Billing errors\n• Service interruptions\n\n**How to Report:**\n1. Contact admin immediately\n2. Provide account details\n3. Describe the issue\n4. Upload photos if needed\n\nWe'll investigate within 24 hours.`;
      confidence = 'high';
    }
    else {
      reply = `I'm not sure about that. Here are some things I can help with:\n\n• 📊 **Billing** - How your bill is calculated\n• 💧 **Usage** - Understanding water usage and meters\n• 💰 **Rates** - Current water rates\n• 👤 **Account** - Account management\n• 💳 **Payment** - Payment information\n• 📢 **Issues** - Report problems\n\nWhat would you like to know?`;
      confidence = 'low';
    }
    
    res.json({ 
      reply,
      confidence,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({ 
      reply: 'Sorry, the chat service is temporarily unavailable. Please try again later or contact support.',
      error: true
    });
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
    const isAdminUser = isAdmin(req.user);
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Check cache first (for non-admins)
    if (!isAdminUser && recordCache[req.user.id]) {
      return res.json(recordCache[req.user.id]);
    }

    const query = isAdminUser ? {} : { userId: req.user.id };
    
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
    if (!isAdminUser) {
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
app.get('/admin.html', protect, (req, res) => {
  // Check if user is admin
  if (!isAdmin(req.user)) {
    return res.status(403).redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});
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