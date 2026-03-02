const express = require('express');
let WebSocket;
try {
  WebSocket = require('ws');
} catch (err) {
  console.warn("Optional module 'ws' not installed. WebSocket functionality will be disabled.");
}
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
let wss = null;
if (WebSocket) {
  wss = new WebSocket.Server({ server });
} else {
  console.log('WebSocket server disabled because ws module is not available.');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage
const users = new Map(); // userId -> user object
const messages = new Map(); // conversationId -> array of messages
const activeConnections = new Map(); // userId -> WebSocket connection

// =========================
// USER MANAGEMENT API
// =========================

/**
 * POST /api/users/register
 * Register a new user
 */
app.post('/api/users/register', (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const userId = uuidv4();
    const newUser = {
      id: userId,
      username,
      email,
      createdAt: new Date(),
      status: 'active'
    };

    users.set(userId, newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * GET /api/users/:userId
 * Get user by ID
 */
app.get('/api/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * GET /api/users
 * Get all users
 */
app.get('/api/users', (req, res) => {
  try {
    const allUsers = Array.from(users.values());
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * PUT /api/users/:userId
 * Update user information
 */
app.put('/api/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, status } = req.body;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (status) user.status = status;
    user.updatedAt = new Date();

    users.set(userId, user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * DELETE /api/users/:userId
 * Delete a user
 */
app.delete('/api/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.delete(userId);
    activeConnections.delete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// =========================
// MESSAGE STORAGE API
// =========================

/**
 * POST /api/messages/send
 * Send a message
 */
app.post('/api/messages/send', (req, res) => {
  try {
    let { conversationId, userId, content } = req.body;

    if (!conversationId || !userId || content == null) {
      return res.status(400).json({ error: 'conversationId, userId, and content are required' });
    }

    // ensure string types for safe operations later
    conversationId = String(conversationId);
    userId = String(userId);
    content = String(content);

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const messageId = uuidv4();
    const message = {
      id: messageId,
      conversationId,
      userId,
      username: user.username,
      content,
      timestamp: new Date(),
      type: 'user'
    };

    if (!messages.has(conversationId)) {
      messages.set(conversationId, []);
    }

    messages.get(conversationId).push(message);

    // Broadcast to WebSocket clients (safe)
    broadcastMessage(conversationId, message);

    // Generate bot response
    const botResponse = generateBotResponse(content);
    const botMessageId = uuidv4();
    const botMessage = {
      id: botMessageId,
      conversationId,
      userId: 'bot',
      username: 'Bot',
      content: botResponse,
      timestamp: new Date(),
      type: 'bot'
    };

    messages.get(conversationId).push(botMessage);
    broadcastMessage(conversationId, botMessage);

    res.status(201).json({ userMessage: message, botMessage });
  } catch (error) {
    console.error('Error in /api/messages/send:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * GET /api/messages/:conversationId
 * Get all messages in a conversation
 */
app.get('/api/messages/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversationMessages = messages.get(conversationId) || [];

    res.json(conversationMessages);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * DELETE /api/messages/:conversationId
 * Clear all messages in a conversation
 */
app.delete('/api/messages/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;

    if (messages.has(conversationId)) {
      messages.delete(conversationId);
    }

    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * GET /api/conversations
 * Get all conversations with message counts
 */
app.get('/api/conversations', (req, res) => {
  try {
    const conversations = [];

    messages.forEach((msgs, conversationId) => {
      conversations.push({
        conversationId,
        messageCount: msgs.length,
        lastMessageTime: msgs.length > 0 ? msgs[msgs.length - 1].timestamp : null
      });
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// =========================
// BOT ENDPOINTS
// =========================

/**
 * POST /api/bot/chat
 * Direct chat with bot (without WebSocket)
 */
app.post('/api/bot/chat', (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = generateBotResponse(message);

    res.json({
      userMessage: message,
      botResponse: response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

/**
 * GET /api/bot/status
 * Get bot status
 */
app.get('/api/bot/status', (req, res) => {
  try {
    res.json({
      status: 'online',
      activeConnections: activeConnections.size,
      totalUsers: users.size,
      totalConversations: messages.size,
      uptime: process.uptime(),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// =========================
// WEBSOCKET SUPPORT
// =========================

if (wss) {
  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    console.log(`New WebSocket connection: ${clientId}`);

    ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);
      const { type, userId, conversationId, content } = payload;

      if (type === 'register') {
        activeConnections.set(userId, ws);
        ws.send(JSON.stringify({
          type: 'connected',
          message: `Connected with user ${userId}`,
          timestamp: new Date()
        }));
      } else if (type === 'message') {
        // Handle incoming message
        if (!messages.has(conversationId)) {
          messages.set(conversationId, []);
        }

        const user = users.get(userId);
        if (!user) {
          ws.send(JSON.stringify({ error: 'User not found' }));
          return;
        }

        const userMessage = {
          id: uuidv4(),
          conversationId,
          userId,
          username: user.username,
          content,
          timestamp: new Date(),
          type: 'user'
        };

        messages.get(conversationId).push(userMessage);
        broadcastMessage(conversationId, userMessage);

        // Generate and send bot response
        const botResponse = generateBotResponse(content);
        const botMessage = {
          id: uuidv4(),
          conversationId,
          userId: 'bot',
          username: 'Bot',
          content: botResponse,
          timestamp: new Date(),
          type: 'bot'
        };

        messages.get(conversationId).push(botMessage);
        broadcastMessage(conversationId, botMessage);
      } else if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${clientId}`);
    // Find and remove user connection
    for (let [userId, connection] of activeConnections.entries()) {
      if (connection === ws) {
        activeConnections.delete(userId);
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// =========================
// UTILITY FUNCTIONS
// =========================

/**
 * Generate bot response based on user input
 */
function generateBotResponse(userMessage) {
  // ensure we have a string
  if (typeof userMessage !== 'string') {
    userMessage = String(userMessage || '');
  }

  const responses = {
    hello: "Hello! How can I help you today?",
    hi: "Hi there! What can I do for you?",
    help: "I can help you with various tasks. Try asking me about features, or just chat with me!",
    how: "I'm doing great! Thanks for asking. How can I assist you?",
    bye: "Goodbye! Have a wonderful day!",
    thanks: "You're welcome! Happy to help.",
    time: `Current time: ${new Date().toLocaleTimeString()}`,
    date: `Today's date: ${new Date().toLocaleDateString()}`,
    joke: "Why don't scientists trust atoms? Because they make up everything! 😄",
    weather: "I don't have access to real weather data, but I hope it's sunny where you are!",
    default: "That's interesting! I'm still learning. Could you tell me more?"
  };

  const lowerMessage = userMessage.toLowerCase();
  
  for (let key in responses) {
    if (lowerMessage.includes(key)) {
      return responses[key];
    }
  }

  return responses.default;
}

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastMessage(conversationId, message) {
  if (!wss) {
    // WebSocket not available; nothing to broadcast
    return;
  }

  const payload = JSON.stringify({
    type: 'message',
    conversationId,
    message
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.warn('Failed to send WS message to client:', err.message);
      }
    }
  });
}

// catch-all error handler (must be placed after all routes)
app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// =========================
// SERVER START
// =========================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🤖 Bot Chatting Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready at ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
