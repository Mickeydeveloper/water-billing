// ================== QUICK INTEGRATION GUIDE ==================
// 
// Add these routes directly to server.js (around line 650, after other stream routes)
// Copy everything from this file and paste into server.js
//
// OR use this as a reference to understand what endpoints you need
//

// ================== STREAM PLAYER CONFIGURATION ==================

// In-memory storage for stream configurations
let streamChannels = [
    {
        id: 1,
        name: "Azam Two",
        category: "Movies",
        manifest_url: "https://cdnblncr.azamtv.ltd.co.tz/live/eds/AzamTwo/DASH/AzamTwo.mpd",
        poster: "https://i.imgur.com/WA3r9kf.jpeg",
        description: "Azam Two - Premium Movies Channel",
        active: true,
        drm: {
            enabled: true,
            license_server_url: "https://example.com/drm/license",
            keys: {
                key_id: "d012a9d5834f69be1313d4864d150a5f",
                key_value: "3b92b644635f3bad9f7d09ded676ec47"
            }
        }
    },
    {
        id: 2,
        name: "Azam Sports",
        category: "Sports",
        manifest_url: "https://cdnblncr.azamtv.ltd.co.tz/live/eds/AzamSports/DASH/AzamSports.mpd",
        poster: "https://i.imgur.com/WA3r9kf.jpeg",
        description: "Azam Sports - Live Sports Events",
        active: true,
        drm: {
            enabled: true,
            license_server_url: "https://example.com/drm/license",
            keys: {
                key_id: "d012a9d5834f69be1313d4864d150a5f",
                key_value: "3b92b644635f3bad9f7d09ded676ec47"
            }
        }
    },
    {
        id: 3,
        name: "Azam Musique",
        category: "Music",
        manifest_url: "https://cdnblncr.azamtv.ltd.co.tz/live/eds/AzamMusique/DASH/AzamMusique.mpd",
        poster: "https://i.imgur.com/WA3r9kf.jpeg",
        description: "Azam Musique - Music & Entertainment",
        active: true,
        drm: {
            enabled: true,
            license_server_url: "https://example.com/drm/license",
            keys: {
                key_id: "d012a9d5834f69be1313d4864d150a5f",
                key_value: "3b92b644635f3bad9f7d09ded676ec47"
            }
        }
    }
];

// ================== STREAM PLAYER ROUTES ==================

// Get all channels
app.get('/api/stream/channels', (req, res) => {
    try {
        const activeChannels = streamChannels.filter(ch => ch.active);
        res.json({
            success: true,
            channels: activeChannels,
            total: activeChannels.length
        });
    } catch (err) {
        console.error('Get channels error:', err);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// Get single channel config
app.get('/api/stream/channel/:id', (req, res) => {
    try {
        const channel = streamChannels.find(ch => ch.id === parseInt(req.params.id));
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        if (!channel.active) {
            return res.status(403).json({ error: 'Channel not available' });
        }

        res.json({
            success: true,
            channel: channel
        });
    } catch (err) {
        console.error('Get channel error:', err);
        res.status(500).json({ error: 'Failed to fetch channel' });
    }
});

// Get player config (admin only)
app.get('/api/stream/config', protect, (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({
            success: true,
            config: {
                player: {
                    type: "DASH",
                    ui: {
                        controls: true,
                        autoplay: false,
                        fullscreen: true
                    }
                },
                channels: streamChannels
            }
        });
    } catch (err) {
        console.error('Get config error:', err);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// Add new channel (admin only)
app.post('/api/stream/channel', protect, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { name, category, manifest_url, poster, description, drm } = req.body;

        if (!name || !manifest_url) {
            return res.status(400).json({ error: 'Name and manifest_url are required' });
        }

        const newChannel = {
            id: Math.max(...streamChannels.map(ch => ch.id), 0) + 1,
            name,
            category: category || 'Other',
            manifest_url,
            poster: poster || 'https://i.imgur.com/WA3r9kf.jpeg',
            description: description || '',
            active: true,
            drm: drm || {
                enabled: false,
                license_server_url: '',
                keys: {}
            },
            createdAt: new Date(),
            createdBy: req.user.email
        };

        streamChannels.push(newChannel);

        console.log('✅ Channel added:', name);
        res.json({
            success: true,
            message: 'Channel added successfully',
            channel: newChannel
        });
    } catch (err) {
        console.error('Add channel error:', err);
        res.status(500).json({ error: 'Failed to add channel' });
    }
});

// Update channel (admin only)
app.put('/api/stream/channel/:id', protect, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const channel = streamChannels.find(ch => ch.id === parseInt(req.params.id));
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const { name, category, manifest_url, poster, description, active, drm } = req.body;

        if (name) channel.name = name;
        if (category) channel.category = category;
        if (manifest_url) channel.manifest_url = manifest_url;
        if (poster) channel.poster = poster;
        if (description) channel.description = description;
        if (typeof active === 'boolean') channel.active = active;
        if (drm) channel.drm = drm;
        
        channel.updatedAt = new Date();
        channel.updatedBy = req.user.email;

        console.log('✏️  Channel updated:', channel.name);
        res.json({
            success: true,
            message: 'Channel updated successfully',
            channel: channel
        });
    } catch (err) {
        console.error('Update channel error:', err);
        res.status(500).json({ error: 'Failed to update channel' });
    }
});

// Delete channel (admin only)
app.delete('/api/stream/channel/:id', protect, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const index = streamChannels.findIndex(ch => ch.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const deleted = streamChannels.splice(index, 1)[0];

        console.log('🗑️  Channel deleted:', deleted.name);
        res.json({
            success: true,
            message: 'Channel deleted successfully',
            channel: deleted
        });
    } catch (err) {
        console.error('Delete channel error:', err);
        res.status(500).json({ error: 'Failed to delete channel' });
    }
});

// Get stream analytics (admin only)
app.get('/api/stream/analytics', protect, async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({
            success: true,
            analytics: {
                totalChannels: streamChannels.length,
                activeChannels: streamChannels.filter(ch => ch.active).length,
                channelsWithDRM: streamChannels.filter(ch => ch.drm.enabled).length,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Stream player page
app.get('/stream', (req, res) => {
    res.sendFile(path.join(__dirname, 'stream-player.html'));
});

// Stream manager page (admin only)
app.get('/stream-manager', protect, (req, res) => {
    if (!isAdmin(req.user)) {
        return res.status(403).redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'stream-manager.html'));
});
