// Simple admin portal script
// Auth: shared secret password stored on server env; client sends once to obtain a session token (demo: localStorage)
// Backend API expected: /api/login (POST), /api/items (GET, POST), /api/items/:id (PATCH, DELETE)

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const loginBox = $('#loginBox');
const app = $('#app');
const addForm = $('#addForm');
const rows = $('#rows');
const count = $('#count');

const TOKEN_KEY = 'lf_admin_token';

function setError(id, msg) { const el = document.getElementById('err-'+id); if (el) el.textContent = msg || ''; }

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(tok) { localStorage.setItem(TOKEN_KEY, tok); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function api(path, opts={}) {
  const base = window.API_BASE || '';
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(base + path, { ...opts, headers });
  if (res.status === 401) { clearToken(); location.reload(); }
  if (!res.ok) throw new Error('API ' + res.status);
  if (res.status === 204) return null;
  return await res.json();
}

async function tryLogin(password) {
  const res = await api('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
  if (!res?.token) throw new Error('No token');
  setToken(res.token);
}

function showApp() {
  loginBox.classList.add('hidden');
  app.classList.remove('hidden');
}

function hideApp() {
  app.classList.add('hidden');
  loginBox.classList.remove('hidden');
}

async function loadItems() {
  const data = await api('/api/items');
  renderRows(data.items || []);
}

function renderRows(items) {
  count.textContent = `${items.length} item${items.length!==1?'s':''}`;
  rows.innerHTML = items.map(i => `
    <tr data-id="${i._id}">
      <td>${i.title}</td>
      <td>${i.category}</td>
      <td>${i.dateFound}</td>
      <td>${i.location}</td>
      <td><span class="pill">${i.status}</span></td>
      <td class="row-actions">
        <button class="tiny" data-act="toggle">${i.status==='claimed'?'Unclaim':'Claim'}</button>
        <button class="tiny secondary" data-act="delete">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function toDataUrl(file) {
  return new Promise((resolve,reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject('read error');
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(file);
  });
}

$('#loginBtn')?.addEventListener('click', async () => {
  setError('password');
  const pw = $('#password').value;
  if (!pw) { setError('password', 'Password required'); return; }
  try {
    await tryLogin(pw);
    showApp();
    await loadItems();
  } catch {
    setError('password', 'Invalid password');
  }
});

addForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(addForm);
  const title = (fd.get('title')||'').toString().trim();
  const category = (fd.get('category')||'').toString();
  const location = (fd.get('location')||'').toString().trim();
  const dateFound = (fd.get('dateFound')||'').toString();
  const description = (fd.get('description')||'').toString().trim();
  const image = fd.get('image');
  let ok = true;
  for (const k of ['title','category','location','dateFound','description']) { setError(k); }
  if (!title) { setError('title','Required'); ok=false; }
  if (!category) { setError('category','Required'); ok=false; }
  if (!location) { setError('location','Required'); ok=false; }
  if (!dateFound) { setError('dateFound','Required'); ok=false; }
  if (!description) { setError('description','Required'); ok=false; }
  if (!ok) return;
  let imageData;
  if (image && image instanceof File && image.size) {
    imageData = await toDataUrl(image);
  }
  await api('/api/items', { method: 'POST', body: JSON.stringify({ title, category, location, dateFound, description, imageData }) });
  addForm.reset();
  await loadItems();
});

rows?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tr = btn.closest('tr');
  const id = tr?.getAttribute('data-id');
  if (!id) return;
  const act = btn.getAttribute('data-act');
  if (act === 'delete') {
    if (!confirm('Delete this item?')) return;
    await api(`/api/items/${id}`, { method: 'DELETE' });
    await loadItems();
  }
  if (act === 'toggle') {
    await api(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify({ toggleStatus: true }) });
    await loadItems();
  }
});

// Auto-login if token exists
(async function init(){
  if (getToken()) {
    try { showApp(); await loadItems(); } catch { hideApp(); }
  }
})();
