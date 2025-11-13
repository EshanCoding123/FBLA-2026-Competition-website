//Lost & Found demo app (no backend). Data persists in localStorage.
//Focus: accessibility, performance, and clear UX.

const STORE_KEY = 'lf_items_v1';
const ADMIN_KEY = 'lf_admin';

/** Data shape
 * {
 *   id: string, title: string, category: 'Clothing'|'Electronics'|'Accessories'|'Academic'|'Other',
 *   location: string, dateFound: 'YYYY-MM-DD', description: string,
 *   imageData?: string (DataURL), status: 'unclaimed'|'claimed', createdAt: number,
 *   claimer?: { name: string, email: string, details?: string }
 * }
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function loadItems() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function seedDemoData() {
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0,10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate()-n); return fmt(d); };
  const sample = [
    { title: 'Blue Nike Hoodie', category: 'Clothing', location: 'Library', dateFound: daysAgo(2), description: 'Blue pullover, size M, white swoosh logo', status: 'unclaimed' },
    { title: 'TI-84 Calculator', category: 'Academic', location: 'Room 204', dateFound: daysAgo(1), description: 'Name sticker partially peeled, scratches on back', status: 'unclaimed' },
    { title: 'AirPods Case', category: 'Electronics', location: 'Gym bleachers', dateFound: daysAgo(5), description: 'White case, no earbuds, small crack', status: 'unclaimed' },
    { title: 'Water Bottle', category: 'Accessories', location: 'Cafeteria', dateFound: daysAgo(3), description: 'Hydro Flask, teal, stickers on side', status: 'claimed' },
    { title: 'Geometry Notebook', category: 'Academic', location: 'Bus #12', dateFound: daysAgo(7), description: 'Graph-ruled, label: "Geo"', status: 'unclaimed' },
    { title: 'Black Scarf', category: 'Clothing', location: 'Auditorium', dateFound: daysAgo(4), description: 'Soft knit scarf', status: 'unclaimed' },
    { title: 'Chromebook Charger', category: 'Electronics', location: 'Hallway C', dateFound: daysAgo(2), description: 'USB-C 65W', status: 'unclaimed' },
    { title: 'Car Keys', category: 'Other', location: 'Parking Lot B', dateFound: daysAgo(6), description: 'Key fob with red tag', status: 'unclaimed' }
  ].map(i => ({ id: uid(), createdAt: Date.now(), ...i }));
  saveItems(sample);
  return sample;
}

let state = {
  items: loadItems(),
  admin: localStorage.getItem(ADMIN_KEY) === '1'
};
if (!state.items.length) state.items = seedDemoData();

// Elements
const itemsGrid = $('#itemsGrid');
const resultsMeta = $('#resultsMeta');
const controls = $('#controls');
const reportForm = $('#reportForm');
const itemDialog = $('#itemDialog');
const dialogContent = $('#dialogContent');
const yearEl = $('#year');

yearEl.textContent = new Date().getFullYear();

$('#seedData')?.addEventListener('click', () => {
  if (confirm('Reset demo data? This will overwrite current items.')) {
    state.items = seedDemoData();
    render();
  }
});

$('#toggleAdmin')?.addEventListener('click', () => {
  state.admin = !state.admin;
  localStorage.setItem(ADMIN_KEY, state.admin ? '1' : '0');
  render();
});

function applyFilters(items) {
  const fd = new FormData(controls);
  const q = (fd.get('q') || '').toString().trim().toLowerCase();
  const category = (fd.get('category') || '').toString();
  const status = (fd.get('status') || '').toString();
  const sort = (fd.get('sort') || 'recent').toString();
  const from = (fd.get('from') || '').toString();
  const to = (fd.get('to') || '').toString();

  let out = items.filter(i => {
    if (category && i.category !== category) return false;
    if (status && i.status !== status) return false;
    if (from && i.dateFound < from) return false;
    if (to && i.dateFound > to) return false;
    if (!q) return true;
    const t = (i.title + ' ' + i.description + ' ' + i.location + ' ' + i.category).toLowerCase();
    return t.includes(q);
  });

  out.sort((a,b) => {
    if (sort === 'recent') return (b.dateFound.localeCompare(a.dateFound));
    if (sort === 'oldest') return (a.dateFound.localeCompare(b.dateFound));
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'category') return a.category.localeCompare(b.category) || b.dateFound.localeCompare(a.dateFound);
    return 0;
  });

  return out;
}

function itemCard(item) {
  const claimed = item.status === 'claimed';
  const img = item.imageData ? `<img src="${item.imageData}" alt="${item.title} photo">` : `<svg width="96" height="96" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 5-6 4 5"/></svg>`;
  return `
    <article class="card item" role="listitem" aria-labelledby="item-${item.id}-title">
      <div class="thumb">${img}</div>
      <div class="content">
        <div class="title" id="item-${item.id}-title">${item.title}</div>
        <div class="meta">${item.category} · Found ${item.dateFound} · ${item.location}</div>
        <div>${claimed ? '<span class="badge" aria-label="Claimed">Claimed</span>' : '<span class="badge" aria-label="Unclaimed">Unclaimed</span>'}</div>
        <div class="actions">
          <button class="secondary" data-act="view" data-id="${item.id}">Details</button>
          ${claimed ? '' : `<button data-act="claim" data-id="${item.id}">Claim</button>`}
          ${state.admin ? `<button class="secondary" data-act="mark" data-id="${item.id}">${claimed ? 'Mark unclaimed' : 'Mark claimed'}</button>` : ''}
          ${state.admin ? `<button class="secondary" data-act="delete" data-id="${item.id}">Delete</button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function render() {
  const filtered = applyFilters(state.items);
  itemsGrid.innerHTML = filtered.map(itemCard).join('');
  resultsMeta.textContent = `${filtered.length} item${filtered.length!==1?'s':''} shown${filtered.length !== state.items.length ? ` (of ${state.items.length})` : ''}`;
}

controls?.addEventListener('input', (e) => {
  if (e.target.matches('input, select')) render();
});

$('#resetFilters')?.addEventListener('click', () => {
  controls.reset();
  render();
});

itemsGrid?.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const act = btn.getAttribute('data-act');
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  if (act === 'view') openDialog(item);
  if (act === 'claim') openClaim(item);
  if (act === 'mark') toggleClaim(item);
  if (act === 'delete') deleteItem(item);
});

function openDialog(item) {
  const img = item.imageData ? `<img src="${item.imageData}" alt="${item.title}">` : '';
  dialogContent.innerHTML = `
    <div style="display:grid; gap:.5rem;">
      <h3 style="margin:.25rem 0;">${item.title}</h3>
      <div class="meta">${item.category} · Found ${item.dateFound} · ${item.location}</div>
      ${img}
      <p>${item.description}</p>
      ${item.status === 'claimed' ? '<p><strong>Status:</strong> Claimed</p>' : '<p><strong>Status:</strong> Unclaimed</p>'}
      ${item.status !== 'claimed' ? `<div class="actions"><button data-dact="claim" class="button">Claim this item</button></div>` : ''}
    </div>
  `;
  itemDialog.showModal();
  dialogContent.querySelector('[data-dact="claim"]')?.addEventListener('click', () => {
    itemDialog.close();
    openClaim(item);
  });
}

function openClaim(item) {
  dialogContent.innerHTML = `
    <h3>Claim: ${item.title}</h3>
    <form id="claimForm" class="form" novalidate>
      <div class="field">
        <label for="name">Your name</label>
        <input id="name" name="name" required maxlength="60" />
        <div class="error" id="err-name"></div>
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required />
        <div class="error" id="err-email"></div>
      </div>
      <div class="field">
        <label for="details">Prove it’s yours</label>
        <textarea id="details" name="details" rows="3" placeholder="Unique marks, stickers, contents, etc." required></textarea>
        <div class="error" id="err-details"></div>
      </div>
      <div class="actions">
        <button type="submit">Submit claim</button>
        <button type="button" class="secondary" data-dact="cancel">Cancel</button>
      </div>
    </form>
  `;
  itemDialog.showModal();
  $('#claimForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const details = (fd.get('details')||'').toString().trim();
    let ok = true;
    const setErr = (id, msg) => { const el = document.getElementById('err-'+id); if (el) el.textContent = msg||''; };
    setErr('name'); setErr('email'); setErr('details');
    if (!name) { setErr('name','Name is required'); ok=false; }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('email','Valid email required'); ok=false; }
    if (!details || details.length < 8) { setErr('details','Add a few details to verify ownership'); ok=false; }
    if (!ok) return;
    item.status = 'claimed';
    item.claimer = { name, email, details };
    saveItems(state.items);
    itemDialog.close();
    render();
    alert('Claim submitted. In a real deployment, staff would review and contact you.');
  });
  dialogContent.querySelector('[data-dact="cancel"]').addEventListener('click', () => itemDialog.close());
}

function toggleClaim(item) {
  item.status = item.status === 'claimed' ? 'unclaimed' : 'claimed';
  if (item.status === 'unclaimed') delete item.claimer;
  saveItems(state.items);
  render();
}

function deleteItem(item) {
  if (!confirm('Delete this item?')) return;
  state.items = state.items.filter(i => i.id !== item.id);
  saveItems(state.items);
  render();
}

reportForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(reportForm);
  const data = {
    id: uid(),
    title: (fd.get('title')||'').toString().trim(),
    category: (fd.get('category2')||'').toString(),
    location: (fd.get('location')||'').toString().trim(),
    dateFound: (fd.get('dateFound')||'').toString(),
    description: (fd.get('description')||'').toString().trim(),
    status: 'unclaimed',
    createdAt: Date.now()
  };
  const errs = {};
  if (!data.title) errs.title = 'Required';
  if (!data.category) errs.category2 = 'Required';
  if (!data.location) errs.location = 'Required';
  if (!data.dateFound) errs.dateFound = 'Required';
  if (!data.description) errs.description = 'Required';
  ['title','category2','location','dateFound','description'].forEach(k => {
    const el = document.getElementById('err-'+k);
    if (el) el.textContent = errs[k] || '';
  });
  if (Object.keys(errs).length) return;

  const file = fd.get('image');
  if (file && file instanceof File && file.size) {
    data.imageData = await fileToDataURL(file);
  }

  state.items.unshift(data);
  saveItems(state.items);
  reportForm.reset();
  render();
  alert('Thanks! Your item has been added to the list.');
});

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej('Failed to read file');
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(file);
  });
}

//Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Initial render
render();

//Dialog close controls (X button and backdrop click)
itemDialog?.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('.close');
  if (closeBtn) {
    itemDialog.close();
  }
});
itemDialog?.addEventListener('mousedown', (e) => {
  // close when clicking backdrop (outside inner content)
  const rect = itemDialog.querySelector('.dialog-inner')?.getBoundingClientRect();
  if (!rect) return;
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) {
    itemDialog.close();
  }
});
