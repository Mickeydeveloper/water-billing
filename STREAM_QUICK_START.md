# 🎬 DASH Stream Player - Complete Setup Guide

## ✅ What Was Created

Your complete streaming platform includes:

### 1. **Stream Player** (`stream-player.html`)
A full-featured DASH video player with:
- Multi-channel support with playlist
- Adaptive bitrate streaming
- Manual quality selection
- DRM protection support
- Real-time statistics
- Picture-in-picture mode
- Fullscreen support
- Keyboard shortcuts
- Mobile responsive design

### 2. **Admin Manager** (`stream-manager.html`)
Admin dashboard for managing streams:
- View all active channels
- Add new streaming channels
- Edit channel properties
- Delete channels
- Configure DRM settings
- View stream analytics
- Real-time statistics

### 3. **Backend API** (`STREAM_INTEGRATION.js`)
RESTful API endpoints:
```
GET    /api/stream/channels           # List active channels
GET    /api/stream/channel/:id        # Get channel config
POST   /api/stream/channel            # Add channel (admin)
PUT    /api/stream/channel/:id        # Update channel (admin)
DELETE /api/stream/channel/:id        # Delete channel (admin)
GET    /api/stream/analytics          # Get analytics (admin)
GET    /stream                        # Player page
GET    /stream-manager                # Admin panel (admin)
```

## 🚀 Quick Start

### Step 1: Add Routes to Server
Open `server.js` and add this before the final error handlers:

```javascript
// Copy entire contents of STREAM_INTEGRATION.js file and paste here
// Around line 1300 (after payment routes)
```

OR add this reference:
```javascript
// At the top
const path = require('path');

// Then paste contents of STREAM_INTEGRATION.js
```

### Step 2: Access the Player
1. **Player**: Visit `http://localhost:3000/stream`
2. **Admin Panel**: Visit `http://localhost:3000/stream-manager` (requires admin login)

### Step 3: Add First Channel
1. Go to `/stream-manager`
2. Click "Add Channel" tab
3. Fill in details:
   - **Name**: e.g., "Azam Two"
   - **Category**: e.g., "Movies"
   - **Manifest URL**: e.g., `https://cdnblncr.azamtv.ltd.co.tz/live/eds/AzamTwo/DASH/AzamTwo.mpd`
   - **Poster**: Optional image URL
4. (Optional) Enable DRM and add license details
5. Click "Add Channel"

## 📺 Player Interface

```
┌────────────────────────────────────────────────────────────┐
│  LIVE │ Channel Name        │  Quality: 1080p             │
├────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                      VIDEO DISPLAY AREA                     │  │
│                                                              │
│                                                              │
├────────────────────────────────────────────────────────────┤
│  ▶  🔊 ──●─── [QUALITY] 📺 ⛶                              │
├────────────────────────────────────────────────────────────┤
│ CHANNELS                                                     │
│ ─────────                                                    │
│ ✓ Azam Two                                                  │
│   Movies                                                     │
│                                                              │
│ • Azam Sports                                               │
│   Sports                                                     │
│                                                              │
│ • Azam Musique                                              │
│   Music                                                     │
└────────────────────────────────────────────────────────────┘
```

## 🎮 Player Controls

| Element | Function |
|---------|----------|
| ▶ / ⏸ | Play/Pause |
| 🔊 | Mute/Unmute |
| ──●── | Volume slider |
| ⚙️ | Quality selector |
| 📺 | Picture-in-Picture |
| ⛶ | Fullscreen |
| 📊 | Show statistics |

## ⌨️ Keyboard Shortcuts

```
SPACE   →  Play/Pause
→       →  Skip +10 seconds
←       →  Rewind -10 seconds
F       →  Fullscreen toggle
M       →  Mute/Unmute
N       →  Next channel
```

## 🔧 Configuration Examples

### Simple Channel
```json
{
  "name": "News Channel",
  "category": "News",
  "manifest_url": "https://example.com/news.mpd",
  "poster": "https://example.com/news.jpg"
}
```

### With DRM Protection
```json
{
  "name": "Premium Movies",
  "category": "Movies",
  "manifest_url": "https://example.com/movies.mpd",
  "poster": "https://example.com/poster.jpg",
  "drm": {
    "enabled": true,
    "license_server_url": "https://license.example.com/drm",
    "keys": {
      "key_id": "d012a9d5834f69be1313d4864d150a5f",
      "key_value": "3b92b644635f3bad9f7d09ded676ec47"
    }
  }
}
```

## 📊 Admin Features

### Channels Tab
View all channels with status and DRM info:
```
Channel Name     │ Category │ Status   │ DRM Enabled
─────────────────┼──────────┼──────────┼────────────
Azam Two         │ Movies   │ ACTIVE   │ ✓
Azam Sports      │ Sports   │ ACTIVE   │ ✓
Azam Musique     │ Music    │ ACTIVE   │ ✓
```

### Add Channel Tab
Form with fields:
- Channel Name (required)
- Category (required)
- DASH Manifest URL (required)
- Poster Image URL
- Description
- DRM Configuration (optional)
  - License Server URL
  - Key ID
  - Key Value

### Analytics Tab
Statistics:
- Total Channels
- Active Channels
- Channels with DRM
- Last Updated Time

## 🌐 API Usage Examples

### Get All Channels
```javascript
fetch('/api/stream/channels')
  .then(r => r.json())
  .then(data => console.log(data.channels));
```

### Get Single Channel
```javascript
fetch('/api/stream/channel/1')
  .then(r => r.json())
  .then(data => console.log(data.channel));
```

### Add Channel (Admin)
```javascript
fetch('/api/stream/channel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Channel',
    category: 'Sports',
    manifest_url: 'https://example.com/stream.mpd',
    poster: 'https://example.com/poster.jpg'
  })
})
.then(r => r.json())
.then(data => console.log(data.message));
```

### Update Channel (Admin)
```javascript
fetch('/api/stream/channel/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Updated Name',
    active: true
  })
})
.then(r => r.json())
.then(data => console.log(data.message));
```

### Delete Channel (Admin)
```javascript
fetch('/api/stream/channel/1', {
  method: 'DELETE'
})
.then(r => r.json())
.then(data => console.log(data.message));
```

## 🔒 Security

### Admin-Only Routes
- `/stream-manager` - Requires admin authentication
- `POST /api/stream/channel` - Create channels
- `PUT /api/stream/channel/:id` - Update channels
- `DELETE /api/stream/channel/:id` - Delete channels

### DRM Security
- Keys stored server-side
- License server validates requests
- Widevine DRM protects content

## 🎯 Common Tasks

### Task: Add 3 Channels
1. Go to `/stream-manager`
2. Click "Add Channel" tab
3. Repeat 3 times with different channel info

### Task: Stream Local DASH File
1. Generate DASH manifest from your video
2. Host on web server (with CORS enabled)
3. Add channel with manifest URL
4. View in player

### Task: Enable DRM
1. Add channel through admin panel
2. Check "Enable DRM Protection"
3. Enter license server URL
4. Add Key ID and Key Value
5. Save channel

### Task: Switch Quality
1. While video is playing
2. Click quality icon (⚙️)
3. Select desired resolution
4. Quality will change within 5-10 seconds

### Task: View Statistics
1. While watching
2. Click stats button (📊)
3. See real-time bitrate, resolution, buffer, latency
4. Click again to hide

## 🐛 Troubleshooting

### Player Won't Load
- Check manifest URL is valid
- Verify CORS headers
- Test in browser dev tools

### No Audio
- Check audio codec (AAC recommended)
- Verify manifest includes audio track
- Check speaker volume

### Quality Not Changing
- Wait for rebuffering (5-10 seconds)
- Check available qualities in manifest
- Verify network has bandwidth

### DRM Error
- Confirm Widevine is supported
- Check license URL is accessible
- Verify key credentials
- Check DRM provider logs

## 📈 Analytics

### Tracked Events
```javascript
// Channel change
{
  event: 'channel_change',
  channel: 'Azam Two',
  category: 'Movies'
}

// Playback events
{
  event: 'play/pause/seek/ended',
  timestamp: '2026-05-12T10:00:00Z'
}

// Quality change
{
  event: 'quality_change',
  resolution: '1080p',
  bitrate: '5000 Mbps'
}
```

## 🚀 Production Deployment

### Before Going Live:
1. ✅ Replace sample manifest URLs
2. ✅ Configure real DRM license server
3. ✅ Set proper CORS headers
4. ✅ Use HTTPS only
5. ✅ Test all channels
6. ✅ Configure admin authentication
7. ✅ Enable analytics tracking
8. ✅ Set up monitoring/logging

### Performance Optimization:
1. Use CDN for manifest and segments
2. Configure caching headers
3. Optimize segment duration (2-10s)
4. Provide 3-5 quality levels
5. Enable bandwidth throttling

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify manifest accessibility
3. Test with DASH reference player
4. Check streaming server logs
5. Review DRM provider docs

---

**Ready to stream!** 🎬

Start playing: `http://localhost:3000/stream`
Manage channels: `http://localhost:3000/stream-manager`
