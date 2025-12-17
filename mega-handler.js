/**
 * MEGA Cloud Storage Handler
 * Centralized module for all MEGA operations
 * Handles file uploads, downloads, and credential management
 */

class MegaHandler {
  constructor() {
    this.credentials = this.loadCredentials();
    this.apiEndpoint = '/save-to-mega';
    
    // Demo credentials for testing (remove in production)
    this.demoEmail = 'mickidadyhamza@gmail.com';
    this.demoPassword = 'Mickeydady29@';
  }

  /**
   * Load credentials from localStorage
   */
  loadCredentials() {
    try {
      const stored = localStorage.getItem('megaCredentials');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading MEGA credentials:', e);
      return {};
    }
  }

  /**
   * Save credentials to localStorage
   * @param {string} email - MEGA account email
   * @param {string} password - MEGA account password
   */
  saveCredentials(email, password) {
    try {
      const credentials = { email, password, savedAt: new Date().toISOString() };
      localStorage.setItem('megaCredentials', JSON.stringify(credentials));
      this.credentials = credentials;
      return { success: true, message: '✅ MEGA credentials saved securely' };
    } catch (e) {
      console.error('Error saving credentials:', e);
      return { success: false, message: '❌ Failed to save credentials' };
    }
  }

  /**
   * Auto-fill demo credentials for testing
   * @returns {object} Result object
   */
  autofillDemoCredentials() {
    try {
      this.saveCredentials(this.demoEmail, this.demoPassword);
      return { 
        success: true, 
        message: '✅ Demo credentials pre-filled for testing',
        email: this.demoEmail
      };
    } catch (e) {
      return { success: false, message: '❌ Failed to auto-fill credentials' };
    }
  }

  /**
   * Get demo credentials (for testing only)
   * @returns {object} Demo credentials
   */
  getDemoCredentials() {
    return { email: this.demoEmail, password: this.demoPassword };
  }

  /**
   * Clear saved credentials
   */
  clearCredentials() {
    try {
      localStorage.removeItem('megaCredentials');
      this.credentials = {};
      return { success: true, message: 'Credentials cleared' };
    } catch (e) {
      console.error('Error clearing credentials:', e);
      return { success: false, message: 'Failed to clear credentials' };
    }
  }

  /**
   * Upload file to MEGA cloud
   * @param {string} filename - File name
   * @param {string|object} content - File content (will be stringified if object)
   * @param {object} options - Additional options (email, password, progressCallback)
   * @returns {Promise} Upload result
   */
  async uploadFile(filename, content, options = {}) {
    const email = options.email || this.credentials.email;
    const password = options.password || this.credentials.password;

    // Validate credentials
    if (!email || !password) {
      return {
        success: false,
        message: '❌ MEGA credentials not found. Please save credentials first.',
      };
    }

    // Validate filename
    if (!filename || filename.trim() === '') {
      return {
        success: false,
        message: '❌ Filename is required',
      };
    }

    // Convert content to string if it's an object
    let contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    try {
      // Call server endpoint
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          filename: filename.trim(),
          content: contentString,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Upload failed');
      }

      return {
        success: true,
        message: `✅ File saved to MEGA: ${filename}`,
        file: responseData.file,
      };
    } catch (error) {
      console.error('MEGA upload error:', error);
      return {
        success: false,
        message: `❌ MEGA upload failed: ${error.message}`,
      };
    }
  }

  /**
   * Upload JSON data to MEGA
   * @param {object} data - Data object to upload
   * @param {string} filename - File name for the JSON file
   * @param {object} options - Additional options
   * @returns {Promise} Upload result
   */
  async uploadJSON(data, filename, options = {}) {
    return this.uploadFile(filename, data, options);
  }

  /**
   * Upload image (base64) to MEGA
   * @param {string} base64Data - Base64 encoded image data
   * @param {string} filename - File name for the image
   * @param {object} options - Additional options
   * @returns {Promise} Upload result
   */
  async uploadImage(base64Data, filename, options = {}) {
    // Remove data URI prefix if present
    let cleanData = base64Data;
    if (base64Data.startsWith('data:')) {
      cleanData = base64Data.split(',')[1];
    }

    return this.uploadFile(filename, cleanData, {
      ...options,
      isBase64: true,
    });
  }

  /**
   * Get upload progress callback (for future use with streaming)
   * @param {function} progressFn - Callback function receiving progress (0-100)
   * @returns {function} Progress handler
   */
  getProgressHandler(progressFn) {
    return (loaded, total) => {
      const percent = Math.round((loaded / total) * 100);
      if (progressFn) progressFn(percent);
    };
  }

  /**
   * Show status message with auto-clear
   * @param {string} elementId - DOM element ID to display message
   * @param {string} message - Message text
   * @param {string} type - Message type ('success', 'error', 'info')
   * @param {number} duration - Auto-clear duration in ms
   */
  showMessage(elementId, message, type = 'info', duration = 4000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const colorMap = {
      success: '#10b981',
      error: '#ef4444',
      info: '#0ea5e9',
    };

    element.textContent = message;
    element.style.color = colorMap[type] || colorMap.info;

    if (duration > 0) {
      setTimeout(() => {
        element.textContent = '';
      }, duration);
    }
  }

  /**
   * Show progress bar update
   * @param {string} progressBarId - DOM element ID for progress bar
   * @param {string} fillId - DOM element ID for progress fill
   * @param {number} percent - Progress percentage (0-100)
   */
  updateProgressBar(progressBarId, fillId, percent) {
    const bar = document.getElementById(progressBarId);
    const fill = document.getElementById(fillId);

    if (bar) bar.style.display = percent > 0 ? 'block' : 'none';
    if (fill) fill.style.width = `${Math.min(percent, 100)}%`;
  }

  /**
   * Get saved credentials object
   * @returns {object} Credentials or empty object
   */
  getCredentials() {
    return { ...this.credentials };
  }

  /**
   * Check if credentials are available
   * @returns {boolean} True if email and password are saved
   */
  hasCredentials() {
    return !!(this.credentials.email && this.credentials.password);
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MegaHandler;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.MegaHandler = MegaHandler;
}
