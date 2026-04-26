// Float Chat Widget - Optimized for Performance
// Include this in every page: <script src="/float-chat.js"></script>

(function() {
  'use strict';

  // Performance optimization: Debounce and throttle
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Message cache to avoid duplicate API calls
  const messageCache = new Map();
  let isProcessing = false;

  // Create float chat widget HTML
  const createFloatChatWidget = () => {
    const widget = document.createElement('div');
    widget.className = 'float-chat-widget';
    widget.id = 'floatChatWidget';
    widget.innerHTML = `
      <div class="float-chat-bubble" id="chatBubble" title="Njia ya Haraka - Fast Support" role="button" tabindex="0" aria-label="Open chat support">
        💬
        <span class="notification-badge" id="chatBadge" style="display: none;" aria-label="1 new message">1</span>
      </div>
      <div class="float-chat-window" id="chatWindow" role="dialog" aria-label="Support chat">
        <div class="float-chat-header">
          <span>🤖 Mickey Support</span>
          <button class="close-btn" id="closeBtn" aria-label="Close chat">✕</button>
        </div>
        <div class="float-chat-messages" id="floatMessages" role="log" aria-live="polite">
          <div class="float-msg float-bot-msg">
            Habari! 👋 Karibu! Kami kutusaidia kuhusu malipo ya maji.
          </div>
        </div>
        <div class="float-chat-input">
          <input type="text" id="floatChatInput" placeholder="Andika ujumbe..." aria-label="Message input">
          <button id="sendBtn" aria-label="Send message">↑</button>
        </div>
      </div>
    `;
    
    // Add CSS styles with performance optimizations
    const styles = `
      /* Float Chat Widget - Global */
      .float-chat-widget {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
        font-family: 'Poppins', sans-serif;
        will-change: transform;
      }

      .float-chat-bubble {
        position: relative;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #2563eb, #0284c7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
        transition: all 0.3s ease;
        font-size: 1.8rem;
        border: 2px solid rgba(255, 255, 255, 0.1);
        animation: pulse-chat 2s infinite;
        user-select: none;
        -webkit-touch-callout: none;
      }

      .float-chat-bubble:hover,
      .float-chat-bubble:focus {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(37, 99, 235, 0.5);
        outline: none;
      }

      @keyframes pulse-chat {
        0%, 100% { box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3); }
        50% { box-shadow: 0 8px 24px rgba(37, 99, 235, 0.6); }
      }

      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        border: 2px solid white;
        animation: badge-bounce 0.5s ease;
      }

      @keyframes badge-bounce {
        0% { transform: scale(0); }
        75% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      .float-chat-window {
        position: absolute;
        bottom: 90px;
        right: 0;
        width: 360px;
        height: 500px;
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: none;
        flex-direction: column;
        animation: slideUp 0.4s ease;
        overflow: hidden;
        will-change: transform;
        backface-visibility: hidden;
      }

      .float-chat-window.active {
        display: flex;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .float-chat-header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #2563eb, #0284c7);
        color: white;
        font-weight: 700;
        border-radius: 20px 20px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      .float-chat-header .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        font-size: 1.2rem;
        transition: background 0.2s;
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
      }

      .float-chat-header .close-btn:hover,
      .float-chat-header .close-btn:focus {
        background: rgba(255, 255, 255, 0.4);
        outline: none;
      }

      .float-chat-messages {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .float-chat-input {
        padding: 12px;
        border-top: 1px solid #1e293b;
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .float-chat-input input {
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #1e293b;
        padding: 10px 12px;
        border-radius: 12px;
        color: white;
        outline: none;
        transition: border-color 0.2s;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
      }

      .float-chat-input input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      .float-chat-input input:focus {
        border-color: #2563eb;
        background: rgba(255, 255, 255, 0.08);
      }

      .float-chat-input button {
        background: #2563eb;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        color: white;
        cursor: pointer;
        transition: background 0.2s;
        font-weight: 700;
        font-family: 'Poppins', sans-serif;
        flex-shrink: 0;
      }

      .float-chat-input button:hover:not(:disabled),
      .float-chat-input button:focus {
        background: #0284c7;
        outline: none;
      }

      .float-chat-input button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .float-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 0.85rem;
        line-height: 1.4;
        word-wrap: break-word;
        animation: msgFadeIn 0.3s ease-out;
      }

      @keyframes msgFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .float-bot-msg {
        background: rgba(255, 255, 255, 0.08);
        color: white;
        border-left: 3px solid #2563eb;
        align-self: flex-start;
      }

      .float-user-msg {
        background: #2563eb;
        color: white;
        align-self: flex-end;
      }

      @media (max-width: 480px) {
        .float-chat-window {
          width: calc(100vw - 30px);
          height: 400px;
          bottom: 80px;
        }

        .float-chat-bubble {
          width: 50px;
          height: 50px;
          font-size: 1.5rem;
        }
      }

      ::-webkit-scrollbar {
        width: 6px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: #1e293b;
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #334155;
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    styleEl.media = 'all';
    document.head.appendChild(styleEl);

    document.body.appendChild(widget);

    // Attach event listeners with proper cleanup
    const bubble = document.getElementById('chatBubble');
    const closeBtn = document.getElementById('closeBtn');
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('floatChatInput');

    bubble.addEventListener('click', window.toggleFloatChat);
    bubble.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.toggleFloatChat();
    });

    closeBtn.addEventListener('click', window.toggleFloatChat);
    sendBtn.addEventListener('click', window.sendFloatMessage);
    input.addEventListener('keypress', window.handleFloatChatEnter);
  };

  // Toggle chat window
  window.toggleFloatChat = function() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow?.classList.toggle('active');
    
    const badge = document.getElementById('chatBadge');
    if (badge && chatWindow?.classList.contains('active')) {
      badge.style.display = 'none';
    }

    // Focus input when opening
    if (chatWindow?.classList.contains('active')) {
      const input = document.getElementById('floatChatInput');
      input?.focus();
    }
  };

  // Handle Enter key
  window.handleFloatChatEnter = function(event) {
    if (event.key === 'Enter' && !event.shiftKey && !isProcessing) {
      event.preventDefault();
      window.sendFloatMessage();
    }
  };

  // Send message to chat with optimization
  window.sendFloatMessage = async function() {
    if (isProcessing) return;

    const input = document.getElementById('floatChatInput');
    const messagesDiv = document.getElementById('floatMessages');
    const sendBtn = document.getElementById('sendBtn');
    const text = input.value.trim();

    if (!text) return;

    // Check cache first
    if (messageCache.has(text)) {
      const cachedReply = messageCache.get(text);
      addBotMessage(messagesDiv, cachedReply);
      input.value = '';
      return;
    }

    isProcessing = true;
    sendBtn.disabled = true;
    input.disabled = true;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'float-msg float-user-msg';
    userMsg.textContent = text;
    userMsg.setAttribute('role', 'article');
    messagesDiv.appendChild(userMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    input.value = '';

    // Add thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'float-msg float-bot-msg';
    thinkingMsg.id = 'think-' + Date.now();
    thinkingMsg.textContent = '⏳ Inafikiri...';
    thinkingMsg.setAttribute('role', 'status');
    messagesDiv.appendChild(thinkingMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`/api/chat?text=${encodeURIComponent(text)}`, {
        signal: controller.signal,
        credentials: 'same-origin'
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const reply = data.reply || 'Samahani, simu inauma sasa.';
      
      // Cache the reply
      messageCache.set(text, reply);
      
      // Keep cache size manageable (max 50 messages)
      if (messageCache.size > 50) {
        const firstKey = messageCache.keys().next().value;
        messageCache.delete(firstKey);
      }

      thinkingMsg.textContent = reply;
      thinkingMsg.setAttribute('role', 'article');
    } catch (err) {
      console.error('Chat error:', err);
      thinkingMsg.textContent = 'Kosa la mtandao. Jaribu tena.';
      thinkingMsg.setAttribute('role', 'alert');
    } finally {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      isProcessing = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  };

  function addBotMessage(messagesDiv, text) {
    const msg = document.createElement('div');
    msg.className = 'float-msg float-bot-msg';
    msg.textContent = text;
    msg.setAttribute('role', 'article');
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Initialize on DOM ready with error handling
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatChatWidget);
  } else {
    createFloatChatWidget();
  }
})();
