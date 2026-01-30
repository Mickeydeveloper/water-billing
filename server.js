/**
 * Mickey Water Billing System - Server
 * A simple Express.js server for the water billing application
 * Features: Static file serving, form handling, and REST API endpoints
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Parse JSON bodies
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '/')));

// Custom error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ============================================
// ROUTES
// ============================================

/**
 * GET / - Serve login page as default
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

/**
 * GET /dashboard - Serve dashboard
 */
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * GET /billing - Serve billing page
 */
app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

/**
 * GET /records - Serve records page
 */
app.get('/records', (req, res) => {
  res.sendFile(path.join(__dirname, 'records.html'));
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
 * POST /save-record - Save billing record
 * Body: { name, phone, prev, curr, rate, fixed, total, date }
 */
app.post('/save-record', async (req, res) => {
  try {
    const { name, phone, prev, curr, rate, fixed, total, date } = req.body;

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

    // TODO: Store in database (MongoDB, PostgreSQL, etc.)
    // For now, just log it
    console.log('Record saved:', record);

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
 * GET /health - Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.path
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log(`🌊 Water Billing Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
