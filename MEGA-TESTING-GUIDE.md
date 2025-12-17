# MEGA Handler - Testing with Your Account

## Your Credentials Configured ✅

Your MEGA account has been pre-configured for easy testing:

| Field | Value |
|-------|-------|
| Email | `mickidadyhamza@gmail.com` |
| Password | `Mickeydady29@` |

## 🚀 Quick Testing Steps

### Option 1: Auto-Fill Demo Button (Easiest)

1. Open **graphy.html** or **records.html**
2. Click the **⚡ Demo** button (orange button)
   - Credentials auto-fill instantly
   - No typing needed
3. Click **💾 Hifadhi Kredensho** (Save Credentials)
4. Click **☁️ Hifadhi kwenye MEGA** (Upload to MEGA)
5. Check your MEGA account for uploaded files

### Option 2: Manual Entry

1. Enter email: `mickidadyhamza@gmail.com`
2. Enter password: `Mickeydady29@`
3. Click save and upload buttons

## 📍 Where to Test

### Test Location 1: graphy.html
```
/graphy.html
- Has data table functionality
- Upload entire table as JSON
- Good for testing with large datasets
```

### Test Location 2: records.html
```
/records.html
- Has water billing records
- Upload all records as backup
- Good for testing with existing data
```

## ✅ What to Verify

After uploading, check your MEGA account:

- [ ] Files appear with correct names (graphy.json, records.json)
- [ ] File size is reasonable (not empty)
- [ ] Timestamp is current
- [ ] You can download the files
- [ ] Files contain valid JSON data

## 🔍 Testing in Browser Console

```javascript
// Open F12 console and test these commands:

// 1. Check if handler loaded
typeof MegaHandler
// Should return: "function"

// 2. Create instance
const mega = new MegaHandler()

// 3. Get demo credentials
const demo = mega.getDemoCredentials()
console.log(demo)
// Should show your email and password

// 4. Auto-fill credentials
mega.autofillDemoCredentials()
// Should save credentials

// 5. Check if credentials saved
mega.hasCredentials()
// Should return: true

// 6. Get saved credentials
mega.getCredentials()
// Should show your email

// 7. Test upload (manually from console)
await mega.uploadJSON({test: true}, 'test.json')
// Should return success message
```

## 📊 Test Data Examples

### Example 1: Upload Test Data (graphy.html)
```javascript
// Create test data
const testData = {
    headers: ['Mwezi 1', 'Mwezi 2', 'Mwezi 3'],
    data: [
        { JINA: 'John', 'Mwezi 1': 100, 'Mwezi 2': 150, 'Mwezi 3': 200 },
        { JINA: 'Jane', 'Mwezi 1': 80, 'Mwezi 2': 120, 'Mwezi 3': 180 }
    ]
};

// Manually trigger upload
const result = await mega.uploadJSON(testData, 'test-graphy.json');
console.log(result);
```

### Example 2: Upload Records (records.html)
```javascript
// Get existing records
const records = JSON.parse(localStorage.getItem('mickeyBillingRecords') || '[]');

// Upload to MEGA
const result = await mega.uploadJSON(records, 'backup-records.json');
console.log(result);
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Credentials not found" | Click ⚡ Demo button first, or manually enter credentials |
| "Upload failed: auth" | Verify email and password are correct |
| "Upload failed: network" | Check internet connection |
| Credentials don't save | Check browser localStorage is enabled |
| Files not in MEGA | Check MEGA account cloud directly |

## 🔐 Security Notes

⚠️ **Important**: The demo credentials are configured for **testing only**

- ✅ Safe to use in development
- ✅ Safe to use in staging
- ❌ Remove before production deployment
- ❌ Don't commit to public repositories

### For Production
1. Remove demo credentials from mega-handler.js
2. Use user-entered credentials only
3. Consider server-side session management
4. Use HTTPS for all operations

## 📝 Testing Checklist

### Basic Functionality
- [ ] Demo button auto-fills credentials
- [ ] Save credentials button works
- [ ] Upload button works
- [ ] Files appear in MEGA account
- [ ] Console shows success message

### Error Handling
- [ ] Empty credentials show error
- [ ] Invalid credentials show error
- [ ] Network error shows error message
- [ ] Invalid filename shows error

### Data Integrity
- [ ] Uploaded JSON is valid
- [ ] Data not corrupted
- [ ] Timestamps are correct
- [ ] File sizes are reasonable

### Browser Compatibility
- [ ] Chrome: Works
- [ ] Firefox: Works
- [ ] Safari: Works
- [ ] Edge: Works

## 🎯 Next Steps

### After Successful Testing
1. ✅ Verify files in MEGA account
2. ✅ Test download from MEGA
3. ✅ Check file integrity
4. ✅ Test with different data
5. ✅ Test error scenarios

### Before Production
1. ❌ Remove demo credentials
2. ❌ Remove demo button from UI
3. ❌ Test with production account
4. ❌ Monitor error logs
5. ❌ Document any issues

## 📞 Quick Reference

### Files Modified
- `mega-handler.js` - Added demo credentials and auto-fill function
- `graphy.html` - Added ⚡ Demo button
- `records.html` - Added ⚡ Demo button

### New Functions
- `megaHandler.autofillDemoCredentials()` - Auto-fill credentials
- `megaHandler.getDemoCredentials()` - Get demo credentials
- `megaAutofill()` in graphy.html - UI button handler
- `megaAutofillDemo()` in records.html - UI button handler

## ✨ Pro Tips

### Quick Full Backup
```javascript
// Type in browser console to backup everything
const mega = new MegaHandler();
mega.autofillDemoCredentials();
const records = JSON.parse(localStorage.getItem('mickeyBillingRecords') || '[]');
await mega.uploadJSON(records, 'full-backup-' + new Date().toISOString() + '.json');
```

### Test Bulk Upload
```javascript
// Upload multiple files
for (let i = 1; i <= 5; i++) {
    await mega.uploadJSON({test: i}, `test-${i}.json`);
}
```

### Monitor Upload Progress
```javascript
// Add progress tracking
const startTime = Date.now();
const result = await mega.uploadJSON(largeData, 'large-file.json');
const endTime = Date.now();
console.log(`Upload took ${endTime - startTime}ms`);
```

---

**Ready to Test!** 🚀

Click the ⚡ Demo button on any page and start uploading to your MEGA account.

**Account**: mickidadyhamza@gmail.com  
**Status**: ✅ Configured & Ready
