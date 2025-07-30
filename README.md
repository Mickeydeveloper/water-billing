# Render Deployment for Mickey Water Billing System

This project is ready to deploy as a static site on Render or as a simple Node.js Express app for more advanced features (like Twilio SMS integration).

## Option 1: Static Site (HTML/CSS/JS only)
1. Place your `main.html`, `login.html`, and any assets (images, icons, etc.) in the root directory.
2. Rename `main.html` to `index.html` if you want it as the homepage.
3. In Render, create a new Static Site and connect your repo or upload these files.

## Option 2: Node.js Backend (for SMS, etc.)
1. Add the following files:
   - `package.json` (Node.js dependencies)
   - `server.js` (Express server)
   - `.render.yaml` (Render build instructions)
2. Deploy as a Web Service on Render.

---

## Example `package.json`
{
  "name": "mickey-water-billing",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "twilio": "^4.15.0"
  }
}

---

## Example `server.js`
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Twilio config (set these in Render environment variables)
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const twilioNumber = process.env.TWILIO_NUMBER;
const twilio = accountSid && authToken ? require('twilio')(accountSid, authToken) : null;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

app.post('/send-sms', async (req, res) => {
  if (!twilio) return res.status(500).json({ error: 'Twilio not configured' });
  const { to, message } = req.body;
  try {
    await twilio.messages.create({
      body: message,
      from: twilioNumber,
      to: to
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

---

## Example `.render.yaml`
services:
  - type: web
    name: mickey-water-billing
    env: node
    plan: free
    buildCommand: ''
    startCommand: 'node server.js'
    envVars:
      - key: TWILIO_SID
        sync: false
      - key: TWILIO_AUTH
        sync: false
      - key: TWILIO_NUMBER
        sync: false

---

## Steps
1. Place `main.html`, `login.html`, and any assets in the root.
2. Add `package.json`, `server.js`, and `.render.yaml` for backend/SMS.
3. Push to GitHub and connect to Render, or upload directly.
4. Set your Twilio credentials as environment variables in Render dashboard.

---

For static-only (no SMS), you only need the HTML files. For SMS, use the Node.js backend setup above.
