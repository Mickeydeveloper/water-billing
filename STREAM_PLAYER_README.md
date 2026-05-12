# 📺 Live Stream DASH Player

A complete web-based DASH (Dynamic Adaptive Streaming over HTTP) player for live streaming channels with DRM support, multi-quality streaming, and a full-featured admin management panel.

## Features

### Player Features
- ✅ **DASH Streaming** - Dynamic Adaptive Streaming with automatic quality adjustment
- ✅ **DRM Protection** - Widevine DRM support for protected content
- ✅ **Multi-Quality** - Manual quality selection and adaptive bitrate streaming
- ✅ **Live Channel Support** - Stream multiple live channels
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
- ✅ **Full Controls** - Play/pause, volume, fullscreen, picture-in-picture
- ✅ **Stream Statistics** - Real-time bitrate, resolution, buffer stats
- ✅ **Playlist Management** - Switch between channels seamlessly
- ✅ **Keyboard Shortcuts** - Space (play/pause), F (fullscreen), M (mute), N (next channel)
- ✅ **Analytics Tracking** - Built-in event tracking for viewer analytics

### Admin Features
- ✅ **Channel Management** - Add, edit, delete streaming channels
- ✅ **DRM Configuration** - Configure Widevine DRM per channel
- ✅ **Status Control** - Activate/deactivate channels
- ✅ **Stream Analytics** - View channel statistics and analytics
- ✅ **Configuration API** - RESTful API for managing streams

## Files

```
stream-player.html          # Main streaming player interface
stream-manager.html         # Admin management panel
stream-player-routes.js     # Backend API routes (add to server.js)
```

## Installation

### 1. Copy Files
Copy the three files to your project root directory.

### 2. Update Server (server.js)

Add the stream player routes to your `server.js`:

```javascript
// At the top with other requires
const path = require('path');

// Add this section in your routes, before the final handlers

// ================== STREAM PLAYER CONFIGURATION ==================
// Paste the contents of stream-player-routes.js here

// Or require it as a module:
// require('./stream-player-routes')(app, protect, isAdmin);

// Add this route to serve the stream manager page
app.get('/stream-manager', protect, (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'stream-manager.html'));
});
```

### 3. Update HTML Root

Add route to serve the player (in server.js):
```javascript
app.get('/stream', (req, res) => {
    res.sendFile(path.join(__dirname, 'stream-player.html'));
});
```

## Usage

### For Viewers
1. Navigate to `/stream` to access the player
2. Select channels from the sidebar playlist
3. Use controls to manage playback:
   - Click play button or press **Space** to play/pause
   - Click volume icon or press **M** to mute
   - Press **F** for fullscreen
   - Click quality icon to change resolution
   - Press **N** to play next channel
4. View stream stats by clicking the stats icon (📊)

### For Admins
1. Navigate to `/stream-manager` (requires admin login)
2. **Channels Tab**: View all active channels
   - Edit channel settings
   - Delete channels
3. **Add Channel Tab**: Create new streaming channels
   - Enter channel name and category
   - Provide DASH manifest URL
   - Configure DRM if needed
   - Upload poster image
4. **Analytics Tab**: View stream statistics

## API Endpoints

### Public Endpoints
```
GET  /api/stream/channels           # List all active channels
GET  /api/stream/channel/:id        # Get single channel config
```

### Protected Endpoints (Admin Only)
```
GET  /api/stream/config             # Get full player config
POST /api/stream/channel            # Add new channel
PUT  /api/stream/channel/:id        # Update channel
DELETE /api/stream/channel/:id      # Delete channel
GET  /api/stream/analytics          # Get analytics stats
```

## Configuration Format

### Basic Channel
```json
{
  "id": 1,
  "name": "Channel Name",
  "category": "Category",
  "manifest_url": "https://example.com/stream.mpd",
  "poster": "https://example.com/poster.jpg",
  "description": "Channel Description",
  "active": true,
  "drm": {
    "enabled": false
  }
}
```

### With DRM Protection
```json
{
  "id": 2,
  "name": "Premium Channel",
  "category": "Movies",
  "manifest_url": "https://example.com/premium.mpd",
  "poster": "https://example.com/premium.jpg",
  "active": true,
  "drm": {
    "enabled": true,
    "license_server_url": "https://drm-provider.com/license",
    "keys": {
      "key_id": "d012a9d5834f69be1313d4864d150a5f",
      "key_value": "3b92b644635f3bad9f7d09ded676ec47"
    }
  }
}
```

## Streaming Requirements

### DASH Manifest
Your streaming server should provide DASH (.mpd) manifests:
```
https://your-server.com/live/channel-name/DASH/stream.mpd
```

### Supported Codecs
- **Video**: H.264, HEVC (H.265)
- **Audio**: AAC, AC3
- **Container**: MPEG-DASH

### DRM Support
- Widevine DRM (Chrome, Firefox, Edge)
- License server must support DASH DRM

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Arrow Right | Seek +10 seconds |
| Arrow Left | Seek -10 seconds |
| F | Fullscreen |
| M | Mute/Unmute |
| N | Next Channel |

## Stream Statistics Displayed

- **Bitrate**: Current streaming bitrate (Mbps)
- **Resolution**: Current video resolution (pixels)
- **FPS**: Frames per second
- **Buffered**: Buffered content duration (seconds)
- **Latency**: Streaming latency (seconds)

## Customization

### Change Colors
Edit CSS variables in `stream-player.html`:
```css
:root {
    --primary: #ff1744;      /* Change accent color */
    --primary-glow: rgba(255, 23, 68, 0.3);
    --bg: #0a0e27;           /* Background color */
}
```

### Add Custom Channels
Edit the `channels` array in `stream-player.html`:
```javascript
const channels = [
    {
        id: 1,
        name: "Your Channel",
        category: "Category",
        manifest_url: "https://your-server.com/stream.mpd",
        poster: "https://your-server.com/poster.jpg"
    }
];
```

### Modify Player Size
The player is responsive and fills the container. Adjust in parent HTML:
```html
<div style="width: 100%; height: 100vh;">
    <iframe src="/stream" style="width: 100%; height: 100%; border: none;"></iframe>
</div>
```

## Analytics

### Events Tracked
- `channel_change` - User switches channels
- Video state changes (play, pause, seek)
- Quality changes
- Errors and buffering events

### Access Analytics
```javascript
// In browser console
// Events are logged to console.log with 📊 emoji

// Or fetch from server
fetch('/api/stream/analytics')
    .then(r => r.json())
    .then(data => console.log(data));
```

## Troubleshooting

### Player Shows Error
1. Check manifest URL is accessible
2. Verify CORS headers on streaming server
3. Check browser console for errors
4. Ensure DRM configuration is correct (if enabled)

### DRM Not Working
1. Verify Widevine is supported in your browser
2. Check license server URL is correct
3. Verify key ID and key value
4. Check DRM provider documentation

### No Video Playing
1. Check network tab in browser dev tools
2. Verify manifest (.mpd) file is valid
3. Check if streaming server is running
4. Ensure SSL certificate is valid (for HTTPS)

### Quality Not Changing
1. Player must be playing to change quality
2. Available qualities depend on manifest
3. Use adaptive bitrate for automatic quality

## Performance Tips

1. **Use CDN** - Host manifest and segments on CDN for better performance
2. **Segment Duration** - 2-10 seconds segment duration is recommended
3. **Bitrate Ladder** - Provide 3-5 quality levels
4. **Buffer Strategy** - Default settings work for most cases
5. **DRM License Cache** - License servers should cache for performance

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support including DRM |
| Firefox | ✅ | Full support including DRM |
| Edge | ✅ | Full support including DRM |
| Safari | ⚠️ | DASH via HLS proxy recommended |
| Opera | ✅ | Full support including DRM |

## Security Considerations

1. **DRM Keys** - Never expose in client-side code (use backend proxy)
2. **License Server** - Implement proper authentication
3. **CORS** - Configure properly for streaming server
4. **HTTPS** - Always use HTTPS in production
5. **Admin Access** - Protect `/stream-manager` with authentication

## Example Manifest URL

```
https://cdnblncr.azamtv.ltd.co.tz/live/eds/AzamTwo/DASH/AzamTwo.mpd
```

## License

This streaming player is provided as-is for live streaming applications.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all URLs are accessible
3. Test manifest with DASH validator
4. Check streaming server logs
5. Review DRM provider documentation
