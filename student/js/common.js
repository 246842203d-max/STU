const TOKEN_KEY = 'sis_token';
const USER_KEY = 'sis_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function logout(redirect = 'index.html') {
  clearSession();
  location.href = redirect;
}

function requireRole(role, redirect = 'index.html') {
  const token = getToken();
  const user = getUser();
  if (!token || !user || user.role !== role) {
    clearSession();
    location.href = redirect;
    return null;
  }
  return user;
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: '响应解析失败' };
  }

  if (res.status === 401) {
    clearSession();
  }

  return { ok: res.ok, status: res.status, data };
}

function showMsg(el, text, type = 'error') {
  if (!el) return;
  el.textContent = text;
  el.className = `msg show ${type}`;
}

function hideMsg(el) {
  if (!el) return;
  el.className = 'msg';
  el.textContent = '';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
