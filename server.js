/**
 * Mickey Water Billing System & Music Player - Server
 * A combined Express.js server for billing and music search
 * Optimized for Aswin Sparky API Integration
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); 
const yts = require('yt-search'); 

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

app.use(cors()); 
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '/')));

// ============================================
// MUSIC API ROUTE (Mickey Music v4 - BORESHO)
// ============================================

/**
 * GET /api/search-music
 * Inatafuta YouTube -> Inapata Link -> Inachukua Audio toka Aswin API
 */
app.get('/api/search-music', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ status: false, error: 'Andika jina la wimbo' });
    }

    // 1. Hatua ya kwanza: Tafuta video YouTube
    const r = await yts(query);
    const video = r.videos[0]; 

    if (!video) {
      return res.status(404).json({ status: false, error: 'Wimbo haukupatikana YouTube' });
    }

    const youtubeUrl = video.url;

    // 2. Hatua ya pili: Ite API ya Aswin Sparky kupata playable audio link
    // Tunatumia link ya YouTube tuliyoipata hapo juu
    const aswinApiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(youtubeUrl)}`;
    
    const response = await fetch(aswinApiUrl);
    const result = await response.json();

    if (result.status && result.data) {
      // Tunarudisha jibu moja lililokamilika
      res.json({
        status: true,
        title: video.title,
        thumbnail: video.thumbnail,
        author: video.author.name,
        timestamp: video.timestamp,
        audioUrl: result.data.url, // Hii ndiyo link ya ku-play na kupakua
        creator: result.creator
      });
    } else {
      res.status(500).json({ status: false, error: 'API ya audio imeshindwa kutoa link' });
    }

  } catch (err) {
    console.error('Music Search Error:', err);
    res.status(500).json({ status: false, error: 'Hitilafu ya server', details: err.message });
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

app.get('/music', (req, res) => {
  res.sendFile(path.join(__dirname, 'music.html'));
});

app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/records', (req, res) => {
  res.sendFile(path.join(__dirname, 'records.html'));
});

// SMS & Record Handlers (Unchanged)
app.post('/send-sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    console.log(`SMS to ${to}: ${message}`);
    res.json({ success: true, message: 'SMS sent' });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/save-record', async (req, res) => {
  try {
    const record = { id: Date.now(), ...req.body };
    res.json({ success: true, record });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ============================================
// ERROR HANDLING & STARTUP
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`🌊 Mickey Billing & Music Server running on port ${PORT}`);
});
