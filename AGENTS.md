# AGENTS.md — Panduan Pengembangan untuk AI Agent & Asisten Masa Depan

Dokumen ini berisi arsitektur, panduan desain, aturan kritis, dan alur kerja pengembangan untuk proyek **TikTok Validator Kacery**.
Setiap AI agent (Antigravity, Gemini, Claude, Cursor, Copilot, dll.) yang bekerja pada repositori ini **WAJIB** membaca dan mematuhi panduan ini sebelum melakukan perubahan kode.

---

## 1. Ikhtisar Proyek (Project Overview)

* **Nama Proyek:** TikTok Validator Kacery
* **Tujuan Utama:** Aplikasi web otomatis (Progressive Web App / PWA) untuk membantu **Kacery** memeriksa dan memvalidasi kelayakan puluhan video TikTok affiliate secara instan tanpa perlu membuka video satu per satu secara manual.
* **Target Pengguna:** **Kacery** (Harap perhatikan: nama panggilan resmi adalah **"Kacery"**, BUKAN "Kak Cherry").
* **Asisten AI Terintegrasi:** **AI Jorje** (Didukung oleh Google Gemini API melalui `GEMINI_API_KEY`).

---

## 2. Struktur Direktori & Arsitektur Kode

```
tiktok-affiliate-validator/
├── api/
│   └── index.js             # Entry point Vercel Serverless Function (import express app)
├── lib/
│   ├── gemini-analyzer.js   # Integrasi Google Gemini API (AI Jorje) untuk verifikasi brand
│   ├── tiktok-extractor.js  # Ekstraksi data publik TikTok (PoW SlardarWAF solver & TikWM fallback)
│   └── validator.js         # Logika validasi campaign (metrik, hashtag, mention, ER)
├── public/                  # Frontend PWA (Vanilla JS, CSS modern, no bloated framework)
│   ├── icons/
│   │   ├── kacery-logo.png  # Logo resmi huruf 'C' pink berpita
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── app.js               # Logika antarmuka, event listeners, state, dan Tag Adder
│   ├── favicon.png          # Tab browser favicon
│   ├── index.html           # Struktur HTML responsif
│   ├── manifest.json        # Konfigurasi PWA (Add to Home Screen)
│   ├── style.css            # Tema pink-putih modern, responsif desktop & mobile
│   └── sw.js                # Service Worker Network-First dengan auto-update
├── test/
│   └── test_core.js         # Test suite: 30 pengujian unit & integrasi ekstraksi TikTok
├── .env.example             # Template konfigurasi environment (tanpa secret key)
├── .gitignore               # Menjaga .env, node_modules, dan log tidak bocor ke Git
├── package.json             # Konfigurasi dependensi (express, cors) & scripts
├── README.md                # Dokumentasi publik & panduan deploy Vercel
├── server.js                # Express server lokal & handler API backend
└── vercel.json              # Konfigurasi deploy Vercel, rewrites API, & header anti-stale cache
```

---

## 3. Aturan Kritis (Non-Negotiable Rules)

### A. Penamaan & Panggilan Pengguna
* Nama pengguna adalah **"Kacery"**.
* **JANGAN PERNAH** mengubah atau menuliskan namanya menjadi "Kak Cherry", "Cherry", atau sebutan lain.

### B. Penamaan Asisten AI
* Nama asisten kecerdasan buatan di aplikasi ini adalah **"AI Jorje"** / **"Analisis Jorje"**.
* Jangan menggantinya kembali menjadi "Analisis Gemini" di antarmuka publik, meskipun di belakang layar memanfaatkan model Google Gemini.

### C. Desain & Estetika Antarmuka (UI/UX)
* **Warna & Gaya:** Perpaduan warna pink dan putih pastel yang bersih, elegan, dan estetik (khusus wanita / feminin profesional).
* **Logo:** Gunakan selalu logo huruf 'C' warna pink dengan hiasan pita (`public/icons/kacery-logo.png`). Jangan menggantinya dengan ikon generik atau emoji hati.
* **Label Status Bahasa Indonesia yang Ramah:**
  * Status lulus: **"Sudah Sesuai"** (jangan gunakan kata "Pass").
  * Status tidak lulus: **"Belum Sesuai"** (jangan gunakan kata "Fail").
  * Status butuh perhatian: **"Perlu Cek"** (jangan gunakan kata "Need Review").
* **Tag Adder (Input Satu per Satu):**
  * Input hashtag, mention, brand keywords, dan affiliate usernames **HARUS** menggunakan sistem **Tag Adder interaktif** (+ Tambah button dan chip badge dengan tombol hapus `✕`).
  * **JANGAN PERNAH** mengembalikan input menjadi textarea format koma/spasi, karena membingungkan user dan rawan salah ketik.
* **Teks Lengkap & Tidak Boleh Terpotong:**
  * Jangan gunakan `text-overflow: ellipsis` agresif yang memotong nama atau bukti evaluasi. Semua kartu harus membungkus teks (*word-wrap: break-word*) dengan jelas.

### D. Responsivitas (Desktop & Mobile)
* **Desktop (≥ 960px):** Layout Dashboard Dua Kolom lebar (hingga 1180px). Kolom kiri berisi identitas Kacery, ringkasan syarat campaign aktif, dan status AI Jorje. Kolom kanan berisi kotak link, progress, rekap, dan kartu hasil.
* **Mobile (< 960px):** Aliran satu kolom vertikal yang pas di layar smartphone, dengan header solid (putih bersih) agar konten yang di-scroll tidak tembus pandang.

---

## 4. Mekanisme Auto-Update & Anti-Cache (Vercel & PWA)

Ketika melakukan perubahan pada file di folder `public/`:
1. **Naikkan Versi Cache Buster di `public/index.html`:**
   ```html
   <link rel="stylesheet" href="/style.css?v=X.X">
   <script src="/app.js?v=X.X" type="module"></script>
   ```
2. **Naikkan Versi di `public/sw.js`:**
   ```javascript
   const APP_VERSION = 'vX.X.0';
   const CACHE_NAME = `kacery-validator-${APP_VERSION}`;
   ```
3. **Penyebab Bug Sebelumnya (PENTING DIPERHATIKAN):**
   * Jangan pernah mendeklarasikan fungsi atau variabel dengan nama yang sama lebih dari satu kali di `app.js`. Dalam ES Modules, browser akan melempar `SyntaxError` dan mematikan seluruh interaksi tombol.
   * `vercel.json` sudah dikonfigurasikan dengan `Cache-Control: no-cache, no-store, must-revalidate` untuk file HTML, JS, dan CSS agar CDN dan browser tidak mengunci versi usang.

---

## 5. Keamanan & Secret Management

* **File `.env` TIDAK BOLEH di-push ke Git.**
* API key Google Gemini disimpan secara aman di:
  * Lokal: File `.env` (`GEMINI_API_KEY=...`)
  * Vercel: Masuk ke **Project Settings** > **Environment Variables** > `GEMINI_API_KEY`.
* Kode membaca kunci dari `process.env.GEMINI_API_KEY`. Jika kunci tidak ada, aplikasi tetap berfungsi untuk validasi metrik/hashtag biasa dengan pesan ramah bahwa AI sedang tidak aktif.

---

## 6. Perintah Standar (Commands)

* **Jalankan Aplikasi Lokal:**
  ```bash
  npm start
  # Aplikasi berjalan di http://localhost:3000
  ```
* **Jalankan Uji Otomatis (Wajib sebelum push):**
  ```bash
  npm test
  # Menjalankan 30 test case di test/test_core.js (100% PASS)
  ```
* **Deploy ke Vercel:**
  Cukup lakukan `git push origin main`. Vercel otomatis melakukan build dan deploy.
