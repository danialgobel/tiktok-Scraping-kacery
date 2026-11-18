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
├── docs/                    # Dokumentasi Teknis & Operasional Lengkap
│   ├── 01_ARSITEKTUR_DAN_DESAIN_SISTEM.md
│   ├── 02_HAL_SULIT_DAN_RAWAN_BUGS.md
│   ├── 03_PANDUAN_DESKTOP_DAN_AUTO_UPDATE.md
│   ├── 04_PANDUAN_OPERASIONAL_KACERY.md
│   └── 05_STANDAR_KODING_DAN_ATURAN_KRITIS.md
├── electron-main.cjs        # Main process Electron Desktop (Single instance, auto-updater)
├── lib/
│   ├── discord-logger.js    # Logger aktivitas ke Discord webhook (opsional)
│   ├── ffmpeg-resolver.js   # Multi-tier FFmpeg resolver untuk demuxing audio video asli
│   ├── gemini-analyzer.js   # Integrasi Google Gemini API (AI Jorje) untuk verifikasi brand
│   ├── tiktok-extractor.js  # Ekstraksi data publik TikTok (PoW SlardarWAF solver & TikWM fallback)
│   └── validator.js         # Logika validasi campaign (metrik, hashtag, mention, keranjang kuning)
├── public/                  # Frontend PWA (Vanilla JS, CSS modern Neobrutalism, no bloated framework)
│   ├── icons/
│   │   ├── antigravity-logo.svg # Logo resmi Google Antigravity IDE
│   │   ├── kacery-logo.ico  # Icon resmi Windows desktop app
│   │   ├── kacery-logo.png  # Logo resmi huruf 'C' pink berpita
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── app.js               # Logika antarmuka, event listeners, state, Tag Adder, & Canvas PNG
│   ├── favicon.png          # Tab browser favicon
│   ├── index.html           # Struktur HTML responsif (3 Tab: Beranda, Riwayat, Lisensi)
│   ├── manifest.json        # Konfigurasi PWA (Add to Home Screen)
│   ├── style.css            # Tema pink-putih Neobrutalism, responsif desktop & mobile
│   └── sw.js                # Service Worker Network-First dengan auto-update
├── test/
│   ├── test_core.js         # Test suite: 35 pengujian unit & integrasi ekstraksi TikTok
│   └── test_desktop_runtime.ps1 # Skrip verifikasi otomasi runtime desktop Windows
├── .env.example             # Template konfigurasi environment (tanpa secret key)
├── .gitignore               # Menjaga .env, node_modules, dan dist tidak bocor ke Git
├── package.json             # Konfigurasi dependensi, scripts, electron-builder, & auto-updater
├── README.md                # Dokumentasi publik & panduan deploy Vercel / Desktop
├── server.js                # Express server lokal & handler API backend (dynamic port fallback)
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

## 4. Mekanisme Auto-Update & Anti-Cache (Vercel, PWA, & Desktop)

### A. Untuk Web Vercel & PWA (Otomatis via Git Push)
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
3. **Push ke GitHub:** Cukup `git push origin main`, Vercel otomatis melakukan build dan deploy.

### B. ATURAN WAJIB SETIAP ADA UPDATE DESKTOP (.EXE)
> **PERINGATAN UNTUK SEMUA AI AGENT (Antigravity, Claude, Cursor, dll.):**  
> Setiap kali kamu selesai memperbaiki bug atau menambahkan fitur baru, kamu **WAJIB** mengingatkan Bel untuk merilis update aplikasi desktop ke **GitHub Releases**. Jika hanya di-push ke git tanpa diunggah ke GitHub Releases, aplikasi di laptop Kacery **TIDAK AKAN** terupdate otomatis!

**Langkah Standar Rilis Update Desktop (.exe):**
1. **Naikkan Versi di `package.json`:**  
   Ubah `"version": "X.X.X"` ke versi berikutnya (misal `1.1.2` -> `1.1.3`).
2. **Kompilasi Binary Desktop Baru:**  
   ```bash
   npm run build:exe
   ```
3. **Ambil 4 File dari Folder `dist/`:**  
   * `latest.yml` *(WAJIB: Manifest berisi versi dan checksum sha512 untuk auto-updater)*
   * `TikTok Validator Kacery Setup X.X.X.exe` *(WAJIB: Installer NSIS)*
   * `TikTok Validator Kacery Setup X.X.X.exe.blockmap` *(WAJIB: File delta agar download hemat kuota)*
   * `TikTok Validator Kacery X.X.X.exe` *(Opsional: Versi Portable)*
4. **Unggah ke GitHub Releases:**  
   * Buka browser ke: `https://github.com/danialgobel/tiktok-Scraping-kacery/releases`
   * Klik **"Draft a new release"** (atau "Create a new release").
   * Isi **Tag**: `vX.X.X` (misal `v1.1.3`).
   * Isi **Title**: `TikTok Validator Kacery vX.X.X`.
   * Drag & drop ke-4 file dari `dist/` ke kotak attachment file rilis.
   * Klik **"Publish release"**.
5. **Hasil di Laptop Kacery:**  
   Begitu release di-publish, saat Kacery membuka aplikasinya, sistem auto-updater akan membaca `latest.yml` di GitHub, mengunduh pembaruan di latar belakang, dan otomatis memperbarui aplikasi saat ditutup. Pengguna (Kacery) tidak perlu instal ulang manual!

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
  # Menjalankan 35 test case di test/test_core.js (100% PASS)
  ```
* **Jalankan Aplikasi Desktop:**
  ```bash
  npm run desktop
  ```
* **Build File Executable Desktop Windows (.exe):**
  ```bash
  npm run build:exe
  # Menghasilkan NSIS Installer & Portable exe di folder dist/
  ```
* **Deploy ke Vercel:**
  Cukup lakukan `git push origin main`. Vercel otomatis melakukan build dan deploy.
