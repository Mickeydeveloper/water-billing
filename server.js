/**
 * Mickey Water Billing System & Music Player - Server
 * A combined Express.js server for billing and music search
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); 
const yts = require('yt-search'); // Maktaba ya kutafuta nyimbo YouTube

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

app.use(cors()); // Inaruhusu maombi kutoka kwa browser/domain tofauti
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '/')));

// ============================================
// MUSIC API ROUTE (Mickey Music v4)
// ============================================

/**
 * GET /api/search-music - Search songs on YouTube
 * Query: ?q=song+name
 */
app.get('/api/search-music', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Kutumia yt-search kupata video
    const r = await yts(query);
    const videos = r.videos.slice(0, 1); // Tunachukua matokeo ya kwanza tu

    if (videos.length === 0) {
      return res.status(404).json({ error: 'No results found' });
    }

    const video = videos[0];
    
    // Kurudisha data za wimbo
    res.json({
      success: true,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      timestamp: video.timestamp,
      author: video.author.name,
      views: video.views
    });

  } catch (err) {
    console.error('Music Search Error:', err);
    res.status(500).json({ error: 'Failed to search music', details: err.message });
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

// Route ya Music Page (Tengeneza music.html kama unataka iwe na page yake)
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
 * POST /send-sms - Handle SMS sending
 */
app.post('/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    console.log(`SMS would be sent to ${to}: ${message}`);
    res.json({ success: true, message: 'SMS sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /save-record - Save billing record
 */
app.post('/save-record', async (req, res) => {
  try {
    const record = { id: Date.now(), ...req.body };
    console.log('Record saved:', record);
    res.json({ success: true, message: 'Record saved successfully', record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

// ============================================
// ERROR HANDLING & STARTUP
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`🌊 Mickey Billing & Music Server running on port ${PORT}`);
  console.log(`🎵 Music Search API: http://localhost:${PORT}/api/search-music?q=song+name`);
});
