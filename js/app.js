// App entry untuk login.html dan kanban.html
import { db, auth, serverTimestamp, GoogleAuthProvider } from './firebase.js';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import {
  signInWithPopup, onAuthStateChanged, signOut, signInWithCredential,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';

// Simple application versioning
const APP_VERSION = '0.2.0';
window.__APP_VERSION__ = APP_VERSION;

const STATUS = {
  open: 'OPEN',
  in_progress: 'ON PROGRESS',
  done: 'DONE'
};

const colorByStatus = (s) => {
  switch (s) {
    case 'open': return 'border-sky-300 bg-sky-50';
    case 'in_progress': return 'border-amber-300 bg-amber-50';
    case 'done': return 'border-emerald-300 bg-emerald-50';
    default: return 'border-neutral-200 bg-white';
  }
};

function $(sel, root=document) { return root.querySelector(sel); }
function $all(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

// ---------------- Login Page -----------------
async function initLoginPage() {
  injectVersionBadge();
  // Fallback button login Google
  const provider = new GoogleAuthProvider();
  const btn = $('#googleSignIn');
  btn?.addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
      window.location.href = 'kanban.html';
    } catch (e) {
      console.error(e);
      alert('Login gagal');
    }
  });

  // Google One Tap
  initGoogleOneTap();

  // Passwordless Email (send link)
  initPasswordlessEmail();

  // Jika membuka dari magic link, selesaikan login
  completeEmailLinkIfPresent();

  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = 'kanban.html';
  });
}

// ---------------- Kanban Page -----------------
function initKanbanPage() {
  injectVersionBadge();
  const logoutBtn = $('#logoutBtn');
  if (!logoutBtn) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = 'login.html';
  });

  logoutBtn.addEventListener('click', () => signOut(auth));

  // Add Task buttons
  $all('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => showInlineForm(btn.getAttribute('data-add')));
  });

  subscribeTasks();
  setupDnDColumns();
}

function showInlineForm(status) {
  const container = $(`[data-form="${status}"]`);
  if (!container) return;
  container.innerHTML = renderFormHTML(status);

  const form = container.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    const content = form.content.value.trim();
    const deadline = form.deadline.value ? new Date(form.deadline.value) : null;
    if (!title) { alert('Title wajib diisi'); return; }
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        content,
        deadline,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      container.innerHTML = '';
    } catch (e) {
      console.error(e);
      alert('Gagal membuat task');
    }
  });

  // Cancel button
  container.querySelector('[data-cancel]')?.addEventListener('click', () => {
    container.innerHTML = '';
  });
}

function renderFormHTML(status) {
  const accent = status === 'open' ? 'focus:ring-sky-400' : status === 'in_progress' ? 'focus:ring-amber-400' : 'focus:ring-emerald-400';
  return `
    <form class="rounded-md border border-neutral-200 p-3 bg-neutral-50 space-y-2">
      <input name="title" type="text" placeholder="Title" class="w-full text-sm px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring ${accent}" />
      <textarea name="content" rows="3" placeholder="Content" class="w-full text-sm px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring ${accent}"></textarea>
      <div class="flex items-center gap-2">
        <input name="deadline" type="date" class="text-sm px-3 py-2 rounded border border-neutral-300 focus:outline-none focus:ring ${accent}" />
        <div class="flex-1"></div>
        <button type="button" data-cancel class="text-xs px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-100">Cancel</button>
        <button type="submit" class="text-xs px-3 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-700">Save</button>
      </div>
    </form>
  `;
}

function subscribeTasks() {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'asc'));
  onSnapshot(q, (snap) => {
    // clear lists
    ['open','in_progress','done'].forEach(s => {
      const list = $(`[data-list="${s}"]`);
      if (list) list.innerHTML = '';
    });

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const card = renderTaskCard(docSnap.id, data);
      const list = $(`[data-list="${data.status}"]`);
      if (list) list.appendChild(card);
    });
  });
}

function renderTaskCard(id, data) {
  const card = document.createElement('article');
  card.className = `relative rounded-md border p-3 pt-6 pr-8 ${colorByStatus(data.status)} cursor-move`;
  card.setAttribute('draggable', 'true');
  card.dataset.id = id;
  card.innerHTML = `
    <div class="w-full">
      <h2 class="text-base font-semibold w-full">${escapeHTML(data.title || '')}</h2>
    </div>
    ${data.content ? `<p class="mt-1 text-xs text-neutral-700 leading-5">${escapeHTML(data.content)}</p>` : ''}
    ${data.deadline ? `<p class="mt-2 text-[11px] text-neutral-600">Due: ${formatDate(data.deadline)}</p>` : ''}
  `;

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', id);
  });

  // Delete button (top-right), minimalist SVG icon
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.className = 'absolute top-2 right-2 p-1 rounded hover:bg-neutral-200 text-red-600 hover:text-red-700';
  // Font Awesome trash icon (tanpa SVG) dengan ukuran kecil
  delBtn.innerHTML = `<i class="fa-solid fa-trash text-sm" aria-hidden="true"></i>`;
  delBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const confirmed = await showConfirmDialog({
      title: 'Hapus task?',
      message: `Task \"${escapeHTML(data.title || 'tanpa judul')}\" akan dihapus.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    try {
      // Soft-delete: salin dokumen ke deleted_tasks, kemudian hapus dari tasks
      const deletedRef = doc(collection(db, 'deleted_tasks'), id);
      await setDoc(deletedRef, { ...data, deletedAt: serverTimestamp() });
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus task');
    }
  });
  card.appendChild(delBtn);

  // Status label: di bawah ikon delete, tetap rata kanan
  const statusLabel = document.createElement('span');
  statusLabel.className = 'absolute right-2 top-8 text-[11px] text-neutral-500';
  statusLabel.textContent = STATUS[data.status] || '';
  card.appendChild(statusLabel);

  return card;
}

// Minimal Tailwind confirm dialog (Promise<boolean>)
function showConfirmDialog({ title = 'Confirm', message = '', confirmText = 'OK', cancelText = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-[1px]';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const box = document.createElement('div');
    box.className = 'w-[92%] max-w-sm rounded-lg border border-neutral-200 bg-white shadow-lg p-4';
    box.innerHTML = `
      <div class="flex items-start justify-between">
        <h3 class="text-sm font-medium text-neutral-900">${escapeHTML(title)}</h3>
      </div>
      ${message ? `<p class="mt-2 text-xs text-neutral-700">${escapeHTML(message)}</p>` : ''}
      <div class="mt-4 flex items-center justify-end gap-2">
        <button data-cancel class="text-sm px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-100">${escapeHTML(cancelText)}</button>
        <button data-confirm class="text-sm px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700">${escapeHTML(confirmText)}</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const cleanup = () => {
      window.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { cleanup(); resolve(false); }
    };
    window.addEventListener('keydown', onKeyDown);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { cleanup(); resolve(false); }
    });
    box.querySelector('[data-cancel]')?.addEventListener('click', () => { cleanup(); resolve(false); });
    box.querySelector('[data-confirm]')?.addEventListener('click', () => { cleanup(); resolve(true); });
  });
}

// Inject small version badge in header's right block
function injectVersionBadge() {
  try {
    const header = document.querySelector('header');
    const right = header?.lastElementChild || header;
    const badge = document.createElement('span');
    badge.className = 'text-[11px] text-neutral-500';
    badge.textContent = `v${APP_VERSION}`;
    right.appendChild(badge);
  } catch {}
}

function setupDnDColumns() {
  $all('section[data-status]').forEach(col => {
    col.addEventListener('dragover', (e) => e.preventDefault());
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const newStatus = col.getAttribute('data-status');
      try {
        await updateDoc(doc(db, 'tasks', id), { status: newStatus, updatedAt: serverTimestamp() });
      } catch (err) {
        console.error(err);
        alert('Gagal memindahkan task');
      }
    });
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>"]+/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function formatDate(val) {
  // Firestore bisa mengembalikan Timestamp, Date, atau string ISO
  try {
    let d;
    if (val && typeof val.toDate === 'function') d = val.toDate();
    else d = new Date(val);
    return d.toLocaleDateString('id-ID');
  } catch { return ''; }
}

// Bootstrapping per page
const page = document.body.getAttribute('data-page');
if (page === 'login') initLoginPage();
if (page === 'kanban') initKanbanPage();
if (page === 'trash') initTrashPage();
function initGoogleOneTap() {
  const clientId = (window.firebaseConfig && window.firebaseConfig.googleClientId) || '';
  if (!clientId) {
    console.warn('googleClientId belum diisi; One Tap akan dilewati dan gunakan popup sebagai fallback.');
    return;
  }
  // Pastikan GIS sudah tersedia
  const init = () => {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const cred = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, cred);
            window.location.href = 'kanban.html';
          } catch (err) {
            console.error(err);
            alert('Google One Tap gagal');
          }
        },
        auto_select: true,
        cancel_on_tap_outside: false,
        context: 'signin'
      });
      window.google.accounts.id.prompt();
    } catch (e) {
      console.error('Gagal inisialisasi One Tap', e);
    }
  };
  if (window.google && window.google.accounts && window.google.accounts.id) init();
  else window.addEventListener('load', init);
}

function initPasswordlessEmail() {
  const sendBtn = $('#sendEmailLink');
  const emailInput = $('#emailInput');
  sendBtn?.addEventListener('click', async () => {
    const email = (emailInput?.value || '').trim();
    if (!email) { alert('Email wajib diisi'); return; }
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login.html`,
        handleCodeInApp: true
        // Jika menggunakan Firebase Dynamic Links, tambahkan: dynamicLinkDomain: 'example.page.link'
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
      $('#emailInfo').textContent = 'Link terkirim. Cek email Anda dan buka tautan dari perangkat ini.';
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim magic link');
    }
  });
}

function completeEmailLinkIfPresent() {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    const savedEmail = localStorage.getItem('emailForSignIn');
    if (savedEmail) {
      signInWithEmailLink(auth, savedEmail, window.location.href)
        .then(() => { localStorage.removeItem('emailForSignIn'); window.location.href = 'kanban.html'; })
        .catch((e) => { console.error(e); alert('Gagal menyelesaikan login email'); });
    } else {
      // Tampilkan form untuk melengkapi email
      const wrapper = $('#completeEmailContainer');
      wrapper?.classList.remove('hidden');
      $('#completeEmailBtn')?.addEventListener('click', async () => {
        const email = ($('#completeEmailInput')?.value || '').trim();
        if (!email) { alert('Email wajib diisi'); return; }
        try {
          await signInWithEmailLink(auth, email, window.location.href);
          window.location.href = 'kanban.html';
        } catch (e) {
          console.error(e);
          alert('Gagal menyelesaikan login email');
        }
      });
    }
  }
}

// ---------------- Trash Page -----------------
function initTrashPage() {
  injectVersionBadge();
  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = 'login.html';
  });

  subscribeDeletedTasks();
}

function subscribeDeletedTasks() {
  const q = query(collection(db, 'deleted_tasks'), orderBy('deletedAt', 'desc'));
  onSnapshot(q, (snap) => {
    const list = document.querySelector('[data-deleted-list]');
    if (list) list.innerHTML = '';
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const card = renderDeletedTaskCard(docSnap.id, data);
      list?.appendChild(card);
    });
  });
}

function renderDeletedTaskCard(id, data) {
  const card = document.createElement('article');
  card.className = 'relative rounded-md border border-neutral-200 bg-neutral-50 p-3 pr-8';
  card.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-neutral-800">${escapeHTML(data.title || '')}</h3>
    </div>
    ${data.content ? `<p class="mt-1 text-xs text-neutral-700 leading-5">${escapeHTML(data.content)}</p>` : ''}
    ${data.deadline ? `<p class="mt-2 text-[11px] text-neutral-600">Due: ${formatDate(data.deadline)}</p>` : ''}
    <p class="mt-2 text-[11px] text-neutral-500">Original status: ${STATUS[data.status] || ''}</p>
    ${data.deletedAt ? `<p class="mt-1 text-[11px] text-neutral-500">Deleted: ${formatDate(data.deletedAt)}</p>` : ''}
  `;
  return card;
}