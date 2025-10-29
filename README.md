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
- Delete task dengan ikon Font Awesome dan dialog konfirmasi minimalis.
- Soft-delete: saat menghapus, task dipindah ke koleksi `deleted_tasks` dengan seluruh field tetap ada, plus `deletedAt`.
- Halaman Trash: melihat task yang dihapus secara realtime, terproteksi guard login, tombol Logout tersedia.
- Badge versi kecil ditampilkan di header halaman.

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
    └── trash.html     # halaman melihat task yang dihapus (deleted_tasks)
```

Catatan Versi
-------------
- Variabel versi aplikasi: `APP_VERSION` tersimpan di `js/app.js` dan ditampilkan sebagai badge kecil di header halaman `login.html` dan `kanban.html`.
- Untuk menaikkan versi, ubah nilai `APP_VERSION` dan deploy ulang.

Changelog
---------
- 0.3.0
  - Implementasi soft-delete: pindahkan dokumen ke `deleted_tasks` sebelum dihapus dari `tasks`.
  - Tambah halaman `trash.html` untuk melihat task yang dihapus.
  - Proteksi akses Trash dengan guard login dan tombol Logout.
  - Dokumentasi Hosting diperbarui.
- 0.2.0
  - Ganti ikon delete ke Font Awesome (`fa-solid fa-trash`) via CDN.
  - Tambah modal konfirmasi Tailwind sebelum penghapusan task.
  - Tampilkan badge versi di header (login & kanban).
  - Perapihan kecil dan pembersihan kode tidak terpakai.
- 0.1.0
  - Rilis awal: kanban 3 kolom dengan Firestore realtime.
  - Autentikasi Google One Tap dan email link (passwordless).

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
- Proyek ini sudah disiapkan untuk Firebase Hosting (`.firebaserc` dan `firebase.json`).
- Langkah-langkah deployment:
  - Instal CLI: `npm i -g firebase-tools` (atau gunakan `npx firebase-tools ...` di bawah).
  - Login: `firebase login`
  - Pastikan project: `firebase use learn-with-ai-4f0d7` (sudah terpasang di `.firebaserc`).
  - Deploy: `firebase deploy --only hosting`

Catatan:
- Jika ingin tanpa instal global: 
  - `npx firebase-tools login`
  - `npx firebase-tools use learn-with-ai-4f0d7`
  - `npx firebase-tools deploy --only hosting`
- Domain default Hosting (web.app dan firebaseapp.com) sudah terlihat di Firebase Console; pastikan keduanya ada di Authorized domains (Firebase Auth > Settings).
- Alur email link memakai `actionCodeSettings.url = window.location.origin + '/login.html'` sehingga otomatis bekerja di domain produksi.

Lisensi
-------
- Proyek ini bersifat contoh pendidikan; sesuaikan dan gunakan sesuai kebutuhan Anda.