# MEGA Cloud Storage Handler

## Overview

This is a centralized MEGA cloud storage handler for the Mickey Water Billing System. All MEGA operations (file uploads, credential management, etc.) are now consolidated in a single `mega-handler.js` file.

## Features

- ✅ Centralized MEGA credential management
- ✅ Secure file uploads to MEGA cloud
- ✅ JSON data serialization
- ✅ Base64 image upload support
- ✅ Progress tracking
- ✅ Error handling with user-friendly messages
- ✅ LocalStorage-based credential caching

## Installation

1. **Include in HTML files:**
   ```html
   <script src="mega-handler.js"></script>
   ```

2. **Ensure server endpoint is available:**
   The server must have a `/save-to-mega` POST endpoint that handles file uploads.

## Usage

### Basic Setup

```javascript
// Initialize the handler (automatically done)
const megaHandler = new MegaHandler();

// Check if credentials exist
if (megaHandler.hasCredentials()) {
    console.log('Credentials available');
}
```

### Saving Credentials

```javascript
// Save MEGA account credentials
megaHandler.saveCredentials('your-email@gmail.com', 'your-password');

// Result: { success: true, message: '✅ MEGA credentials saved securely' }
```

### Upload JSON Data

```javascript
const data = { users: [...], records: [...] };

const result = await megaHandler.uploadJSON(data, 'mydata.json');

if (result.success) {
    console.log('Upload successful:', result.message);
} else {
    console.error('Upload failed:', result.message);
}
```

### Upload Files

```javascript
// Upload any file content
const result = await megaHandler.uploadFile('filename.txt', 'file content here');
```

### Upload Base64 Images

```javascript
const base64Data = canvas.toDataURL('image/png');

const result = await megaHandler.uploadImage(base64Data, 'photo.png');
```

### Display Status Messages

```javascript
megaHandler.showMessage('status-element-id', 'File uploaded successfully!', 'success');

// Auto-clears after 4 seconds (or custom duration)
megaHandler.showMessage('msg', 'Loading...', 'info', 5000);
```

### Update Progress Bar

```javascript
megaHandler.updateProgressBar('progressBar', 'progressFill', 75);
// Displays 75% progress
```

## API Reference

### Methods

#### `saveCredentials(email, password)`
- **Purpose**: Save MEGA account credentials
- **Parameters**:
  - `email` (string): MEGA account email
  - `password` (string): MEGA account password
- **Returns**: `{ success: boolean, message: string }`

#### `loadCredentials()`
- **Purpose**: Load credentials from localStorage
- **Returns**: Credentials object or empty object

#### `clearCredentials()`
- **Purpose**: Remove saved credentials
- **Returns**: `{ success: boolean, message: string }`

#### `uploadFile(filename, content, options)`
- **Purpose**: Upload any file to MEGA
- **Parameters**:
  - `filename` (string): Name for the file
  - `content` (string|object): File content (objects are JSON stringified)
  - `options` (object): Optional { email, password, progressCallback }
- **Returns**: Promise with `{ success, message, file }`

#### `uploadJSON(data, filename, options)`
- **Purpose**: Upload JSON data
- **Parameters**:
  - `data` (object): Data to upload
  - `filename` (string): JSON filename
  - `options` (object): Optional settings
- **Returns**: Promise with result

#### `uploadImage(base64Data, filename, options)`
- **Purpose**: Upload base64 encoded image
- **Parameters**:
  - `base64Data` (string): Base64 image data
  - `filename` (string): Image filename
  - `options` (object): Optional settings
- **Returns**: Promise with result

#### `showMessage(elementId, message, type, duration)`
- **Purpose**: Display status message
- **Parameters**:
  - `elementId` (string): DOM element ID
  - `message` (string): Message text
  - `type` (string): 'success', 'error', or 'info'
  - `duration` (number): Auto-clear time in ms (0 = no auto-clear)

#### `updateProgressBar(progressBarId, fillId, percent)`
- **Purpose**: Update progress bar display
- **Parameters**:
  - `progressBarId` (string): Progress bar container ID
  - `fillId` (string): Progress fill element ID
  - `percent` (number): Progress percentage (0-100)

#### `hasCredentials()`
- **Purpose**: Check if credentials are saved
- **Returns**: `boolean`

#### `getCredentials()`
- **Purpose**: Get saved credentials object
- **Returns**: `{ email, password, savedAt }`

## Implementation in Pages

### login.html
- Removed MEGA upload simulation
- Kept progress bar structure (unused)
- Photo capture works standalone now

### graphy.html
```javascript
const megaHandler = new MegaHandler();

function megaSaveCredentials() {
    const email = document.getElementById('mega-email').value;
    const password = document.getElementById('mega-password').value;
    const result = megaHandler.saveCredentials(email, password);
    showMessage(result.message, result.success ? 'green' : 'red');
}

async function megaUploadData() {
    const { data, headers } = getTableData();
    const result = await megaHandler.uploadJSON({ data, headers }, 'graphy.json');
    showMessage(result.message, result.success ? 'green' : 'red');
}
```

### records.html
```javascript
const megaHandler = new MegaHandler();

async function megaSaveToCloud() {
    const email = document.getElementById('mega-email').value;
    const password = document.getElementById('mega-password').value;
    const filename = document.getElementById('mega-filename').value || 'records.json';
    
    megaHandler.saveCredentials(email, password);
    const records = getRecords();
    const result = await megaHandler.uploadJSON(records, filename);
    
    alert(result.message);
}
```

## Server-Side Setup

The server requires a `/save-to-mega` endpoint:

```javascript
// server.js
const Mega = require('megajs');

app.post('/save-to-mega', async (req, res) => {
  const { email, password, filename, content } = req.body;
  
  if (!email || !password || !filename || content === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const storage = new Mega.Storage({ email, password });

    const readyOrErr = await new Promise((resolve, reject) => {
      const onReady = () => resolve('ready');
      const onError = (err) => reject(err);
      storage.on('ready', onReady);
      storage.on('error', onError);
      setTimeout(() => reject(new Error('MEGA login timeout')), 20000);
    });

    const file = storage.upload({ name: filename }, Buffer.from(content));

    const result = await new Promise((resolve, reject) => {
      file.on('complete', (fileInfo) => resolve(fileInfo));
      file.on('error', (err) => reject(err));
      setTimeout(() => reject(new Error('MEGA upload timeout')), 60000);
    });

    res.json({ success: true, file: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Security Notes

⚠️ **Important**: 
- MEGA credentials are stored in browser's localStorage
- For production, consider:
  - Server-side session management
  - Encrypted credential storage
  - User authentication
  - HTTPS only

## Error Handling

All upload operations return a result object:

```javascript
{
  success: boolean,
  message: string,  // User-friendly message with emoji
  file?: object     // File info from MEGA (if successful)
}
```

Check the `message` field to show users friendly feedback.

## Testing

To test the MEGA handler:

1. Open browser console (F12)
2. Create handler: `const mega = new MegaHandler()`
3. Save credentials: `mega.saveCredentials('email@gmail.com', 'password')`
4. Test upload: `mega.uploadJSON({ test: 'data' }, 'test.json')`

## Browser Support

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Requires localStorage support and fetch API.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Credentials not found" | Save credentials first using `saveCredentials()` |
| "Upload failed" | Check email/password and internet connection |
| "Server error" | Ensure server endpoint `/save-to-mega` is running |
| Credentials not loading | Check browser localStorage access |

## Future Enhancements

- [ ] Download files from MEGA
- [ ] Delete files from MEGA
- [ ] Folder organization
- [ ] Streaming large files
- [ ] Concurrent uploads
- [ ] Bandwidth throttling
- [ ] Retry logic for failed uploads

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintainer**: Mickey Water Billing System
