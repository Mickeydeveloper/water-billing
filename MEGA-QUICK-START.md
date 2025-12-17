# MEGA Handler - Quick Start Guide

## What Changed? 🎯

All MEGA cloud storage operations have been moved to a **single centralized file** (`mega-handler.js`). This replaces the scattered MEGA code that was in each HTML file.

## Quick Setup ⚡

### 1️⃣ The Files

| File | Purpose |
|------|---------|
| `mega-handler.js` | **NEW** - Master MEGA operations handler |
| `graphy.html` | Updated to use handler |
| `records.html` | Updated to use handler |
| `login.html` | Updated (MEGA upload removed) |

### 2️⃣ How It Works

```
Your App → mega-handler.js → Server (/save-to-mega) → MEGA Cloud
```

Simple! Just one handler does everything.

### 3️⃣ Using It in Your Page

**Step A**: Include the script
```html
<script src="mega-handler.js"></script>
```

**Step B**: Create handler instance (automatic on page load)
```javascript
const megaHandler = new MegaHandler();
```

**Step C**: Use it
```javascript
// Save credentials
megaHandler.saveCredentials('email@gmail.com', 'password123');

// Upload data
const result = await megaHandler.uploadJSON(myData, 'myfile.json');
```

## Common Tasks 📝

### Save MEGA Credentials
```javascript
function saveMyCredentials() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const result = megaHandler.saveCredentials(email, password);
    console.log(result.message);  // ✅ Credentials saved!
}
```

### Upload Table Data
```javascript
async function uploadTable() {
    const tableData = {
        headers: ['Name', 'Age', 'Score'],
        rows: [[...], [...]]
    };
    
    const result = await megaHandler.uploadJSON(tableData, 'table.json');
    alert(result.message);  // Shows result to user
}
```

### Upload Records
```javascript
async function backupRecords() {
    const records = JSON.parse(localStorage.getItem('records'));
    const result = await megaHandler.uploadJSON(records, 'backup.json');
    
    if (result.success) {
        console.log('✅ Backup complete');
    } else {
        console.error('❌ Backup failed:', result.message);
    }
}
```

### Show Status to User
```javascript
megaHandler.showMessage('statusDiv', 'Uploading...', 'info');
megaHandler.showMessage('statusDiv', 'Done!', 'success', 3000);
```

## Key Functions 🔑

### Upload Functions
```javascript
// JSON data
await megaHandler.uploadJSON(data, 'file.json')

// Any file
await megaHandler.uploadFile('data.txt', content)

// Images
await megaHandler.uploadImage(base64Data, 'photo.png')
```

### Credential Functions
```javascript
megaHandler.saveCredentials(email, password)
megaHandler.loadCredentials()
megaHandler.clearCredentials()
megaHandler.hasCredentials()
megaHandler.getCredentials()
```

### UI Functions
```javascript
megaHandler.showMessage(elementId, message, type, duration)
megaHandler.updateProgressBar(barId, fillId, percent)
```

## Response Format 📦

Every upload returns:
```javascript
{
  success: true/false,
  message: "✅ File uploaded",  // User-friendly
  file: { ... }  // If successful
}
```

Check `success` to know if it worked!

## Error Handling ⚠️

```javascript
const result = await megaHandler.uploadJSON(data, 'file.json');

if (!result.success) {
    // Show error to user
    alert('❌ ' + result.message);
} else {
    // Success!
    console.log('✅ ' + result.message);
}
```

## Where It's Used 🌍

### graphy.html
```javascript
// Save credentials button
function megaSaveCredentials() {
    // ... validation ...
    const result = megaHandler.saveCredentials(email, password);
}

// Upload button  
async function megaUploadData() {
    const { data, headers } = getTableData();
    const result = await megaHandler.uploadJSON({ data, headers }, 'graphy.json');
}
```

### records.html
```javascript
async function megaSaveToCloud() {
    megaHandler.saveCredentials(email, password);
    const records = getRecords();
    const result = await megaHandler.uploadJSON(records, 'records.json');
    alert(result.message);
}
```

## Testing in Browser 🧪

Open developer console (F12) and try:

```javascript
// Check if handler loaded
console.log(MegaHandler);  // Should show class

// Create instance
const mega = new MegaHandler();

// Check credentials
mega.hasCredentials();  // false initially

// Save some credentials
mega.saveCredentials('test@gmail.com', 'testpass123');

// Verify they saved
mega.getCredentials();  // Should show your email

// Try upload (will use saved credentials)
await mega.uploadJSON({ test: 123 }, 'test.json');
```

## Troubleshooting 🔧

| Problem | Solution |
|---------|----------|
| "mega-handler.js not found" | Make sure file is in same folder as HTML |
| "Credentials not found" | Save them first with `saveCredentials()` |
| "Upload failed: auth" | Check email/password are correct |
| Script reference missing | Add `<script src="mega-handler.js"></script>` |

## What Was Removed ❌

- ❌ Duplicate MEGA code in graphy.html (40 lines)
- ❌ Duplicate MEGA code in records.html (20 lines)
- ❌ MEGA upload from login.html (no longer needed)
- ❌ Scattered credential handling

## What You Get ✅

- ✅ Single, clean handler
- ✅ Easier to maintain
- ✅ Consistent across all pages
- ✅ Better error handling
- ✅ Reusable everywhere

## Full Documentation

See **MEGA-HANDLER-README.md** for:
- Complete API reference
- Advanced examples
- Server setup details
- Security notes
- Future enhancements

## Next Steps 🚀

1. Deploy updated files
2. Test in browser (F12 console)
3. Use in your application
4. Add to new pages as needed

---

**Need help?** Check the full README at `MEGA-HANDLER-README.md`

**Last Updated**: December 17, 2025
