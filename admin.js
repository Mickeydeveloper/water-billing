const adminEmails = ['mickidadyhamza@gmail.com'];
let currentEditingUserId = null;
let currentEditingRecordId = null;

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => console.log('Admin SW registered:', registration.scope))
      .catch((error) => console.warn('Admin SW registration failed:', error));
  }
}

function showNotification(message, type = 'info', duration = 4000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    max-width: 400px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

function updateNavbar() {
  const navbarUser = document.getElementById('navbarUser');
  const navbarGuest = document.getElementById('navbarGuest');
  const navbarUserName = document.getElementById('navbarUserName');
  const storedUser = localStorage.getItem('user');

  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      navbarUserName.textContent = userData.name || userData.email || 'User';
      navbarUser.style.display = 'flex';
      navbarGuest.style.display = 'none';
      return;
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
  }

  navbarGuest.style.display = 'flex';
  navbarUser.style.display = 'none';
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('loginTime');
  fetch('/logout', { method: 'GET', credentials: 'same-origin' }).finally(() => {
    window.location.href = '/login.html';
  });
}

window.logout = logout;

async function checkAuth() {
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }

    const data = await res.json();
    if (!data?.user || !adminEmails.includes(data.user.email)) {
      throw new Error('Access denied');
    }

    showNotification(`✅ Admin authenticated: ${data.user.email}`, 'success', 2500);
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    alert('Access denied. Admin only.');
    window.location.href = '/login.html';
    return false;
  }
}

async function loadStats() {
  try {
    const [users, records, payments, resets] = await Promise.all([
      authFetch('/api/users/count'),
      authFetch('/api/records/count'),
      authFetch('/api/payments/stats'),
      authFetch('/api/password-reset-requests')
    ]);

    document.getElementById('totalUsers').textContent = users.count || 0;
    document.getElementById('totalRecords').textContent = records.count || 0;
    document.getElementById('totalPayments').textContent = payments.totalPayments || 0;
    document.getElementById('totalAmount').textContent = (payments.totalAmount || 0).toLocaleString('en-TZ', { style: 'currency', currency: 'TZS' }).replace('TZS', '').trim();
    document.getElementById('usersCount').textContent = users.count || 0;
    document.getElementById('resetRequestsCount').textContent = (resets.requests || []).length || 0;
  } catch (err) {
    console.error('Error loading stats:', err);
    showNotification('Unable to load stats right now', 'error');
  }
}

function showEditUserModal() {
  const modal = document.getElementById('editUserModal');
  if (modal) modal.style.display = 'flex';
}

function closeEditUserModal() {
  const modal = document.getElementById('editUserModal');
  if (modal) modal.style.display = 'none';
  currentEditingUserId = null;
  const form = document.getElementById('editUserForm');
  if (form) form.reset();
}

function showEditRecordModal() {
  const modal = document.getElementById('editRecordModal');
  if (modal) modal.style.display = 'flex';
}

function closeEditRecordModal() {
  const modal = document.getElementById('editRecordModal');
  if (modal) modal.style.display = 'none';
  currentEditingRecordId = null;
  const form = document.getElementById('editRecordForm');
  if (form) form.reset();
}

function closeApprovePasswordResetModal() {
  const modal = document.getElementById('approvePasswordResetModal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('approvePasswordResetForm');
  if (form) form.reset();
}

async function loadUsersList() {
  const card = document.getElementById('usersListCard');
  if (!card) return;
  const isVisible = card.style.display !== 'none';
  card.style.display = isVisible ? 'none' : 'block';

  if (isVisible) return;

  const body = document.getElementById('usersTableBody');
  if (!body) return;

  body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Loading...</td></tr>';

  try {
    const data = await authFetch('/api/users/list');
    if (!data.success || !Array.isArray(data.users)) {
      body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">No users found</td></tr>';
      return;
    }

    const rows = data.users.map((user) => {
      const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
      const safeName = JSON.stringify(user.name || '');
      const safeEmail = JSON.stringify(user.email || '');
      const safeProvider = JSON.stringify(user.provider || '');

      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px;">${user.name || 'N/A'}</td>
          <td style="padding: 12px;">${user.email || 'N/A'}</td>
          <td style="padding: 12px;">${user.provider || 'N/A'}</td>
          <td style="padding: 12px;">${createdDate}</td>
          <td style="padding: 12px; text-align: center;">
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; margin-right: 6px;" onclick="editUser('${user._id}', ${safeName}, ${safeEmail}, ${safeProvider})">Edit</button>
            <button class="btn" style="padding: 6px 12px; font-size: 0.85rem; background: #dc2626; color: white;" onclick="deleteUser('${user._id}', ${safeEmail})">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    body.innerHTML = rows || '<tr><td colspan="5" style="padding: 20px; text-align: center;">No users found</td></tr>';
  } catch (err) {
    console.error('Error loading users:', err);
    body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Error loading users</td></tr>';
  }
}

function editUser(userId, name, email, provider) {
  if (!userId) {
    showNotification('Invalid user data', 'error');
    return;
  }
  currentEditingUserId = userId;
  document.getElementById('editUserName').value = name || '';
  document.getElementById('editUserEmail').value = email || '';
  document.getElementById('editUserProvider').value = provider || '';
  showEditUserModal();
}

async function deleteUser(userId, email) {
  if (!userId) {
    showNotification('Invalid user ID', 'error');
    return;
  }

  if (!confirm(`⚠️ Delete user: ${email || 'User'}? This will also delete all their billing records.`)) {
    return;
  }

  try {
    const data = await authFetch(`/api/users/${userId}`, { method: 'DELETE' });
    showNotification(data.message || 'User deleted', 'success');
    loadUsersList();
    loadStats();
  } catch (err) {
    console.error('Error deleting user:', err);
    showNotification(err.message, 'error');
  }
}

async function submitEditUserForm(event) {
  event.preventDefault();
  if (!currentEditingUserId) {
    showNotification('No user selected', 'error');
    return;
  }

  const name = document.getElementById('editUserName').value.trim();
  const email = document.getElementById('editUserEmail').value.trim();

  if (!name || !email) {
    showNotification('Name and email are required', 'error');
    return;
  }

  try {
    const data = await authFetch(`/api/users/${currentEditingUserId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    });
    showNotification('✅ User updated successfully', 'success');
    closeEditUserModal();
    loadUsersList();
  } catch (err) {
    console.error('Error updating user:', err);
    showNotification(err.message, 'error');
  }
}

async function loadPasswordResetRequests() {
  const card = document.getElementById('resetRequestsCard');
  if (!card) return;
  const isVisible = card.style.display !== 'none';
  card.style.display = isVisible ? 'none' : 'block';

  if (isVisible) return;

  const body = document.getElementById('resetRequestsTableBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Loading...</td></tr>';

  try {
    const data = await authFetch('/api/password-reset-requests');
    if (!data.success || !Array.isArray(data.requests)) {
      body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">No requests found</td></tr>';
      return;
    }

    body.innerHTML = data.requests.map((req) => {
      const requestedDate = req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A';
      const expiresDate = req.expiresAt ? new Date(req.expiresAt).toLocaleString() : 'N/A';
      const statusColor = req.status === 'pending' ? '#d97706' : req.status === 'completed' ? '#059669' : '#6b7280';
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px;">${req.userName || 'N/A'}</td>
          <td style="padding: 12px;">${req.email || 'N/A'}</td>
          <td style="padding: 12px;">${requestedDate}</td>
          <td style="padding: 12px;">${expiresDate}</td>
          <td style="padding: 12px; color: ${statusColor}; font-weight: 600;">${(req.status || 'unknown').toUpperCase()}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading password reset requests:', err);
    body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Error loading requests</td></tr>';
  }
}

async function loadRecordsList() {
  const card = document.getElementById('recordsListCard');
  if (!card) return;
  const isVisible = card.style.display !== 'none';
  card.style.display = isVisible ? 'none' : 'block';

  if (isVisible) return;

  const body = document.getElementById('recordsTableBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="8" style="padding: 20px; text-align: center;">Loading...</td></tr>';

  try {
    const data = await authFetch('/api/records/all');
    if (!data.success || !Array.isArray(data.records)) {
      body.innerHTML = '<tr><td colspan="8" style="padding: 20px; text-align: center;">No records found</td></tr>';
      return;
    }

    body.innerHTML = data.records.map((record) => {
      const createdDate = record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A';
      const recordName = JSON.stringify(record.name || '');
      const recordPhone = JSON.stringify(record.phone || '');
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 10px;">${record.name || 'N/A'}</td>
          <td style="padding: 10px;">${record.phone || 'N/A'}</td>
          <td style="padding: 10px; text-align: right;">${record.prev || 0}</td>
          <td style="padding: 10px; text-align: right;">${record.curr || 0}</td>
          <td style="padding: 10px; text-align: right;">${record.usage || 0}</td>
          <td style="padding: 10px; text-align: right; font-weight: 600;">${(record.total || 0).toLocaleString()}</td>
          <td style="padding: 10px;">${createdDate}</td>
          <td style="padding: 10px; text-align: center;">
            <button class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem; margin-right: 6px;" onclick="editRecord('${record._id}', ${recordName}, ${recordPhone}, ${record.prev || 0}, ${record.curr || 0}, ${record.total || 0})">Edit</button>
            <button class="btn" style="padding: 6px 10px; font-size: 0.8rem; background: #dc2626; color: white;" onclick="deleteRecord('${record._id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading records:', err);
    body.innerHTML = '<tr><td colspan="8" style="padding: 20px; text-align: center;">Error loading records</td></tr>';
  }
}

function editRecord(recordId, name, phone, prev, curr, total) {
  if (!recordId) {
    showNotification('Invalid record', 'error');
    return;
  }

  currentEditingRecordId = recordId;
  document.getElementById('editRecordName').value = name || '';
  document.getElementById('editRecordPhone').value = phone || '';
  document.getElementById('editRecordPrev').value = prev || 0;
  document.getElementById('editRecordCurr').value = curr || 0;
  document.getElementById('editRecordTotal').value = total || 0;
  showEditRecordModal();
}

async function deleteRecord(recordId) {
  if (!recordId) {
    showNotification('Invalid record', 'error');
    return;
  }

  if (!confirm('Delete this record? This cannot be undone.')) {
    return;
  }

  try {
    const data = await authFetch(`/api/records/${recordId}`, { method: 'DELETE' });
    showNotification(data.message || 'Record deleted', 'success');
    loadRecordsList();
    loadStats();
  } catch (err) {
    console.error('Error deleting record:', err);
    showNotification(err.message, 'error');
  }
}

async function submitEditRecordForm(event) {
  event.preventDefault();
  if (!currentEditingRecordId) {
    showNotification('No record selected', 'error');
    return;
  }

  const name = document.getElementById('editRecordName').value.trim();
  const phone = document.getElementById('editRecordPhone').value.trim();
  const prev = parseFloat(document.getElementById('editRecordPrev').value);
  const curr = parseFloat(document.getElementById('editRecordCurr').value);
  const total = parseFloat(document.getElementById('editRecordTotal').value);

  if (!name || !phone || Number.isNaN(prev) || Number.isNaN(curr) || Number.isNaN(total)) {
    showNotification('Please fill all fields correctly', 'error');
    return;
  }

  try {
    const data = await authFetch(`/api/records/${currentEditingRecordId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, phone, prev, curr, total })
    });
    showNotification('✅ Record updated', 'success');
    closeEditRecordModal();
    loadRecordsList();
    loadStats();
  } catch (err) {
    console.error('Error updating record:', err);
    showNotification(err.message, 'error');
  }
}

async function loadPasswordResetUsers() {
  const card = document.getElementById('passwordResetUsersCard');
  if (!card) return;
  const isVisible = card.style.display !== 'none';
  card.style.display = isVisible ? 'none' : 'block';

  if (isVisible) return;

  const body = document.getElementById('passwordResetUsersTableBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Loading...</td></tr>';

  try {
    const data = await authFetch('/api/users/list');
    if (!data.success || !Array.isArray(data.users)) {
      body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">No users found</td></tr>';
      return;
    }

    body.innerHTML = data.users.map((user) => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
      const safeName = JSON.stringify(user.name || '');
      const safeEmail = JSON.stringify(user.email || '');
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px;">${user.name || 'N/A'}</td>
          <td style="padding: 12px;">${user.email || 'N/A'}</td>
          <td style="padding: 12px;">${user.provider || 'N/A'}</td>
          <td style="padding: 12px;">${lastLogin}</td>
          <td style="padding: 12px; text-align: center;">
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="resetUserPassword('${user._id}', ${safeName}, ${safeEmail}, event)">Reset Password</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading users:', err);
    body.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Error loading users</td></tr>';
  }
}

async function resetUserPassword(userId, name, email, event) {
  if (!userId) {
    showNotification('Invalid user', 'error');
    return;
  }

  const button = event?.target;
  if (button) {
    button.disabled = true;
    button.textContent = 'Resetting...';
  }

  try {
    const data = await authFetch('/api/admin/reset-user-password', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    showNotification(`✅ Password reset email sent to ${email}`, 'success');
    loadPasswordResetUsers();
  } catch (err) {
    console.error('Error:', err);
    showNotification(err.message, 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Reset Password';
    }
  }
}

async function submitNotificationForm(event) {
  event.preventDefault();
  const btn = document.getElementById('sendBtn');
  const title = document.getElementById('notificationTitle').value.trim();
  const bodyText = document.getElementById('notificationBody').value.trim();
  const url = document.getElementById('notificationUrl').value.trim() || '/records.html';

  if (!title || !bodyText) {
    showNotification('Title and message are required', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '📤 Sending...';

  try {
    const data = await authFetch('/api/send-notification', {
      method: 'POST',
      body: JSON.stringify({ title, body: bodyText, url })
    });
    showNotification(data.message || 'Notification sent', 'success');
    document.getElementById('notificationForm').reset();
    document.getElementById('notificationUrl').value = '/records.html';
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Send to All Subscribers';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  registerServiceWorker();
  checkAuth();
  loadStats();

  const editUserForm = document.getElementById('editUserForm');
  if (editUserForm) {
    editUserForm.addEventListener('submit', submitEditUserForm);
  }

  const editRecordForm = document.getElementById('editRecordForm');
  if (editRecordForm) {
    editRecordForm.addEventListener('submit', submitEditRecordForm);
  }

  const notificationForm = document.getElementById('notificationForm');
  if (notificationForm) {
    notificationForm.addEventListener('submit', submitNotificationForm);
  }
});
