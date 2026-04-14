// Float Chat Widget - Available on ALL Pages
// Include this in every page: <script src="/float-chat.js"></script>

(function() {
  'use strict';

  // Create float chat widget HTML
  const createFloatChatWidget = () => {
    const widget = document.createElement('div');
    widget.className = 'float-chat-widget';
    widget.id = 'floatChatWidget';
    widget.innerHTML = `
      <div class="float-chat-bubble" id="chatBubble" title="Njia ya Haraka - Fast Support">
        💬
        <span class="notification-badge" id="chatBadge" style="display: none;">1</span>
      </div>
      <div class="float-chat-window" id="chatWindow">
        <div class="float-chat-header">
          <span>🤖 Mickey Support</span>
          <button class="close-btn" onclick="toggleFloatChat()">✕</button>
        </div>
        <div class="float-chat-messages" id="floatMessages">
          <div class="float-msg float-bot-msg">
            Habari! 👋 Karibu! Kami kutusaidia kuhusu malipo ya maji.
          </div>
        </div>
        <div class="float-chat-input">
          <input type="text" id="floatChatInput" placeholder="Andika ujumbe..." onkeypress="handleFloatChatEnter(event)">
          <button onclick="sendFloatMessage()">↑</button>
        </div>
      </div>
    `;
    
    // Add CSS styles
    const styles = `
      /* Float Chat Widget - Global */
      .float-chat-widget {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
        font-family: 'Poppins', sans-serif;
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
      }

      .float-chat-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(37, 99, 235, 0.5);
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
      }

      .float-chat-header .close-btn:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      .float-chat-messages {
        flex: 1;
        overflow-y: auto;
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
      }

      .float-chat-input input:focus {
        border-color: #2563eb;
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
      }

      .float-chat-input button:hover {
        background: #0284c7;
      }

      .float-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 0.85rem;
        line-height: 1.4;
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
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    document.body.appendChild(widget);
  };

  // Toggle chat window
  window.toggleFloatChat = function() {
    const chatWindow = document.getElementById('chatWindow');
    const bubble = document.getElementById('chatBubble');
    chatWindow.classList.toggle('active');
    
    // Clear badge when opened
    const badge = document.getElementById('chatBadge');
    if (badge) badge.style.display = 'none';
  };

  // Handle Enter key
  window.handleFloatChatEnter = function(event) {
    if (event.key === 'Enter') {
      window.sendFloatMessage();
    }
  };

  // Send message to chat
  window.sendFloatMessage = async function() {
    const input = document.getElementById('floatChatInput');
    const messagesDiv = document.getElementById('floatMessages');
    const text = input.value.trim();

    if (!text) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'float-msg float-user-msg';
    userMsg.textContent = text;
    messagesDiv.appendChild(userMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    input.value = '';

    // Add thinking indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'float-msg float-bot-msg';
    thinkingMsg.id = 'think-' + Date.now();
    thinkingMsg.textContent = '⏳ Inafikiri...';
    messagesDiv.appendChild(thinkingMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const response = await fetch(`/api/chat?text=${encodeURIComponent(text)}`);
      const data = await response.json();
      thinkingMsg.textContent = data.reply || 'Samahani, simu inauma sasa.';
    } catch (err) {
      thinkingMsg.textContent = 'Kosa la mtandao. Jaribu tena.';
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  // Add click handler to bubble
  window.addEventListener('DOMContentLoaded', function() {
    createFloatChatWidget();
    
    const bubble = document.getElementById('chatBubble');
    if (bubble) {
      bubble.addEventListener('click', window.toggleFloatChat);
    }
  });
})();
