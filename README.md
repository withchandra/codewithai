Trello Clone Minimal (HTML/CSS/JS + Tailwind CDN)
================================================

Aplikasi kanban sederhana yang terhubung ke Firebase (Auth + Firestore).
Board memiliki 3 kolom: OPEN, ON PROGRESS, DONE. Task dapat dibuat inline di
masing‑masing kolom dan di-drag & drop antar kolom dengan status otomatis
terupdate di Firestore. Login mendukung Google SSO (One Tap) dan passwordless
email (magic link).

Fitur Utama
-----------
- Kanban 3 kolom: `open`, `in_progress`, `done`.
- Tambah task inline tanpa popup: title, content, deadline.
- Drag & drop antar kolom; warna kartu mengikuti status.
- Realtime update dari Firestore (onSnapshot).
- Autentikasi: Google One Tap + fallback popup, passwordless email link.

Tech Stack & Struktur
---------------------
- Frontend: HTML, CSS via Tailwind CDN (4.x), JavaScript murni.
- Firebase SDK Modular via CDN.
- Struktur folder:

```
c:\Workspace\codewithai
├── index.html          # landing & link ke halaman lain
├── login.html          # halaman login One Tap + email link
├── kanban.html         # kanban board
└── js\
    ├── app.js         # logic auth, kanban, Firestore
    ├── firebase.js    # init Firebase (app, db, auth)
    └── firebase-config.js # konfigurasi project & googleClientId
```

Prasyarat
---------
- Node.js 18+ untuk menjalankan preview lokal (`npx serve`).
- Project Firebase siap pakai (Firestore + Authentication).
- Authentication:
  - Google: Enabled.
  - Email/Password: Enabled.
  - Email link (passwordless): aktifkan opsi “Email link (passwordless sign‑in)”.
- Google One Tap membutuhkan OAuth Web Client ID (Google Identity Services):
  - Buat di Google Cloud Console > Credentials > OAuth 2.0 Client IDs (type: Web).
  - Tambahkan domain `localhost` dan domain produksi Anda ke “Authorized domains” di Firebase Authentication > Settings.

Konfigurasi
-----------
Edit `js/firebase-config.js` dan isi konfigurasi Firebase serta `googleClientId`:

```js
window.firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  googleClientId: "YOUR_OAUTH_WEB_CLIENT_ID" // untuk One Tap
};
```

Menjalankan Secara Lokal
------------------------
- Di root proyek jalankan: `npx serve -p 3000`
- Buka: `http://localhost:3000/login.html`
- One Tap akan muncul; jika tidak, gunakan tombol fallback “Login dengan Google”.
- Setelah login, Anda diarahkan ke `kanban.html`.

Model Data Firestore
--------------------
- Koleksi: `tasks`
- Contoh dokumen:

```json
{
  "title": "Design landing page",
  "content": "Rough wireframe + hero copy",
  "deadline": "2025-09-30T20:58:00.000Z", // atau Timestamp
  "status": "open" | "in_progress" | "done",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

Rules Firestore (Contoh)
------------------------
Pastikan hanya user terautentikasi yang dapat mengakses koleksi `tasks`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Tailwind CDN
------------
- Proyek memuat Tailwind melalui CDN: `<script src="https://cdn.tailwindcss.com"></script>`.
- CDN memuat versi terbaru (4.x). Jika ingin mengunci versi tertentu, ikuti
  petunjuk resmi Tailwind untuk CDN; saat ini CDN tidak menyediakan parameter
  versi yang stabil seperti paket npm.

Troubleshooting
---------------
- One Tap tidak muncul:
  - `googleClientId` belum diisi atau salah.
  - Domain belum terdaftar di Authorized domains (Firebase Auth Settings).
  - Peramban memblokir third‑party cookies/iframe; coba izinkan.
- Gagal kirim magic link:
  - Pastikan Email link (passwordless) diaktifkan.
  - `actionCodeSettings.url` mengarah ke `login.html` dan `handleCodeInApp: true`.
- Tidak bisa baca/tulis Firestore:
  - Rules tidak mengizinkan akses; gunakan aturan di atas.
  - Cek apakah user sudah login.

Deployment
----------
- Bisa dipublikasikan ke hosting statis (mis. Firebase Hosting):
  - `firebase init hosting`
  - `firebase deploy`

Lisensi
-------
- Proyek ini bersifat contoh pendidikan; sesuaikan dan gunakan sesuai kebutuhan Anda.