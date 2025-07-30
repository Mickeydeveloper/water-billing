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
