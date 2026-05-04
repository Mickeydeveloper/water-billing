const installButtonId = 'installBtn';
let deferredInstallPrompt = null;

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered with scope:', registration.scope);
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
}

function setupInstallPrompt() {
  const installBtn = document.getElementById(installButtonId);
  if (!installBtn) return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn.style.display = 'inline-flex';
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      installBtn.textContent = 'Installed';
    } else {
      installBtn.textContent = 'Install App';
    }

    deferredInstallPrompt = null;
    installBtn.style.display = 'none';
  });

  window.addEventListener('appinstalled', () => {
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  });
}

async function checkStatus() {
  const display = document.getElementById('user-display');
  const badge = document.getElementById('status-badge');
  const desc = document.getElementById('status-desc');
  const btn = document.getElementById('req-btn');

  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = '/login.html';
      }
      return;
    }

    const data = await res.json();
    if (!data?.user) {
      window.location.href = '/login.html';
      return;
    }

    display.innerText = `Logged in: ${data.user.name || data.user.email}`;

    const sStatus = data.user.serverStatus || 'none';
    btn.disabled = false;
    btn.style.display = 'inline-flex';
    btn.innerText = 'Request Server Activation';

    if (sStatus === 'active') {
      badge.innerHTML = '<span class="status-dot dot-active"></span>ACTIVE';
      badge.style.color = 'var(--success)';
      desc.innerText = 'Server yako ipo active! Bot yako inafanya kazi.';
      btn.style.display = 'none';
    } else if (sStatus === 'pending') {
      badge.innerHTML = '<span class="status-dot dot-pending"></span>PENDING';
      badge.style.color = 'var(--warning)';
      desc.innerText = 'Malipo yanahakikiwa na Admin. Subiri kidogo...';
      btn.disabled = true;
      btn.innerText = 'Waiting for Approval...';
    } else {
      badge.innerHTML = '<span class="status-dot dot-pending"></span>OFFLINE';
      badge.style.color = '#f8fafc';
      desc.innerText = 'Huna server iliyopitishwa. Lipia kisha bonyeza request.';
    }
  } catch (err) {
    console.error('Session error:', err);
    badge.innerHTML = '<span class="status-dot dot-pending"></span>OFFLINE';
    badge.style.color = '#f8fafc';
    desc.innerText = 'Unable to check server status. Check your connection.';
    btn.disabled = false;
  }
}

async function requestHosting() {
  if (!confirm('Umeshalipia? Bonyeza OK kutuma ombi kwa Admin.')) return;

  const btn = document.getElementById('req-btn');
  btn.disabled = true;
  btn.innerText = 'Sending request...';

  try {
    const res = await fetch('/api/server/request', {
      method: 'POST',
      credentials: 'same-origin'
    });

    const data = await res.json();
    alert(data.message || 'Request Sent!');
    await checkStatus();
  } catch (err) {
    console.error('Error sending request:', err);
    alert('Error sending request. Tafadhali jaribu tena baadaye.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Request Server Activation';
  }
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  const chatWindow = document.getElementById('chat-window');
  const userDiv = document.createElement('div');
  userDiv.className = 'msg user-msg';
  userDiv.textContent = text;
  chatWindow.appendChild(userDiv);
  input.value = '';
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const tempId = 'bot-' + Date.now();
  const botDiv = document.createElement('div');
  botDiv.className = 'msg mickey-msg';
  botDiv.id = tempId;
  botDiv.textContent = '...';
  chatWindow.appendChild(botDiv);

  try {
    const response = await fetch(`/api/chat?text=${encodeURIComponent(text)}`, { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error('Chat request failed');
    }
    const data = await response.json();
    document.getElementById(tempId).innerText = data.reply || 'Mickey AI is not available right now.';
  } catch (err) {
    console.error('Chat error:', err);
    document.getElementById(tempId).innerText = 'Mickey AI is sleepy. Try again!';
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setupAudioUploader() {
  const audioUpload = document.getElementById('audioUpload');
  const audioPlayer = document.getElementById('audioPlayer');
  if (!audioUpload || !audioPlayer) return;

  audioUpload.addEventListener('change', function () {
    if (this.files[0]) {
      audioPlayer.src = URL.createObjectURL(this.files[0]);
      audioPlayer.play().catch(() => {
        console.warn('Audio autoplay blocked by browser.');
      });
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  setupInstallPrompt();
  setupAudioUploader();
  checkStatus();
});
