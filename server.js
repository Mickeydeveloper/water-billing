const express = require('express');
const bodyParser = require('body-parser');
const Mega = require('megajs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Twilio config (set these in Render environment variables)

app.use(bodyParser.json());

// Serve login.html as the default page
app.use(express.static(path.join(__dirname, '/')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;
  try {
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save file to MEGA cloud using provided credentials
app.post('/save-to-mega', async (req, res) => {
  const { email, password, filename, content } = req.body;
  if (!email || !password || !filename || content === undefined) {
    return res.status(400).json({ error: 'Missing required fields: email, password, filename, content' });
  }

  try {
    const storage = new Mega.Storage({ email, password });

    // wait for ready or error
    const readyOrErr = await new Promise((resolve, reject) => {
      const onReady = () => resolve('ready');
      const onError = (err) => reject(err);
      storage.on('ready', onReady);
      storage.on('error', onError);
      // safety timeout
      setTimeout(() => reject(new Error('MEGA login timeout')), 20000);
    });

    // upload the file buffer
    const file = storage.upload({ name: filename }, Buffer.from(content));

    const result = await new Promise((resolve, reject) => {
      file.on('complete', (fileInfo) => resolve(fileInfo));
      file.on('error', (err) => reject(err));
      // fallback timeout
      setTimeout(() => reject(new Error('MEGA upload timeout')), 60000);
    });

    res.json({ success: true, file: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
