# 01. Arsitektur & Desain Sistem — TikTok Validator Kacery

Dokumen ini mendokumentasikan arsitektur teknis lengkap aplikasi **TikTok Validator Kacery**, baik versi Progressive Web App (PWA) di Vercel maupun versi Desktop Executable (.exe) untuk Windows.

---

## 1. Ikhtisar Arsitektur

Aplikasi ini mengadopsi pola **Unified Codebase**: satu repositori yang dapat berjalan di dua lingkungan berbeda tanpa mengubah logika bisnis inti:

```
                          ┌─────────────────────────────┐
                          │     User Input (Kacery)     │
                          │   (Links / Campaign Rules)  │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
       [ Lingkungan Web / PWA ]                       [ Lingkungan Desktop .exe ]
       • Vercel Edge / CDN                            • Electron Main Process (CJS)
       • Serverless Function (api/index.js)           • Internal Express Server (ESM)
       • Service Worker Network-First                 • Auto-Updater (electron-updater)
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                          ┌─────────────────────────────┐
                          │    Data Extraction Layer    │
                          │ • TikTok Web SlardarWAF     │
                          │ • TikWM API (Fallback)      │
                          │ • Stream Audio Demux        │
                          └──────────────┬──────────────┘
                                         ▼
                          ┌─────────────────────────────┐
                          │   Campaign Validator Core   │
                          │ • Metrics (Views/Likes/Foll)│
                          │ • Word-Boundary Tags/Ment   │
                          │ • Yellow Cart Extraction    │
                          │ • AI Jorje (Gemini Vision)  │
                          └──────────────┬──────────────┘
                                         ▼
                          ┌─────────────────────────────┐
                          │     Client Presentation     │
                          │ • UI Neobrutalism Pastel    │
                          │ • IndexedDB Batch History   │
                          │ • High-DPI Canvas PNG       │
                          └─────────────────────────────┘
```

---

## 2. Rincian Komponen Utama

### A. Frontend PWA (`public/`)
* **Arsitektur:** Vanilla JavaScript (ES Modules), Modern CSS dengan variabel kustom, dan HTML5 semantik.
* **Tidak Menggunakan Framework Berat:** Menghindari React/Vue/Angular untuk menjaga performa tetap instan, konsumsi memori minim (<100MB), dan waktu muat di bawah 1 detik.
* **Gaya Visual:** **Modern Neobrutalism Pastel** dengan palet pink-putih khas Kacery:
  * Border tegas (`#0f172a`, tebal 2px - 2.5px).
  * Bayangan solid offset (*hard drop-shadow* tanpa blur).
  * Tipografi: `Plus Jakarta Sans` dan `Quicksand`.
  * Bebas dari AI-slop emoji generik, mengutamakan ikon SVG monoline bersih.
* **State Management:**
  * `currentConfig`: Konfigurasi syarat campaign aktif (tersimpan di `localStorage`).
  * `sessionReports`: Array hasil validasi di sesi kerja saat ini.
  * `kacery_validator_db` (IndexedDB): Penyimpanan arsip jangka panjang untuk Tab Riwayat.

### B. Backend API (`server.js` & `api/index.js`)
* **Express.js:** Menangani endpoint REST API:
  * `POST /api/extract`: Mengambil data mentah video TikTok publik.
  * `POST /api/validate`: Memvalidasi video terhadap kriteria campaign.
  * `POST /api/batch-validate`: Memproses hingga puluhan link dalam antrean chunk konkuren.
  * `GET /api/proxy-image`: Bypass proteksi hotlink CDN TikTok/Tokopedia.
  * `GET /api/proxy-audio`: Streaming audio asli dari video TikTok secara aman.
  * `GET /api/system-status`: Telemetri runtime (status ffmpeg, platform, memori).
* **Dual-Entry Point:**
  * Untuk Vercel: Diekspor melalui `api/index.js` sebagai Serverless Function.
  * Untuk Desktop: Dijalankan lokal via `startDesktopServer(preferredPort)` pada IP `127.0.0.1`.

### C. Desktop Wrapper (`electron-main.cjs`)
* **Runtime:** Electron v45+ (Chromium + Node.js internal).
* **Single Instance Lock:** Menggunakan `app.requestSingleInstanceLock()` agar aplikasi tidak terbuka ganda jika user mengklik icon shortcut berulang kali.
* **Auto-Port Collision Handling:** Jika port default 3000 sedang terpakai software lain, server otomatis beralih ke port acak `0` yang bebas tanpa membuat aplikasi gagal terbuka.
* **External Link Sandbox:** Link keluar (TikTok video, Tokopedia product) dicegat oleh `webContents.setWindowOpenHandler` dan dialihkan ke browser bawaan Windows (Edge/Chrome).

### D. Auto-Updater Engine (`electron-updater`)
* Terhubung langsung dengan repositori GitHub `danialgobel/tiktok-Scraping-kacery`.
* Bekerja secara senyap di background: memeriksa tag rilis baru, mengunduh delta patch, dan menerapkan instalasi otomatis saat aplikasi ditutup (`autoInstallOnAppQuit = true`).

---

## 3. Sistem Database Lokal (IndexedDB)

Untuk fitur **Tab Riwayat**, aplikasi menggunakan database peramban `IndexedDB` bernama `kacery_validator_db` (versi 1) dengan struktur:
* **Object Store:** `batches` (KeyPath: `id`).
* **Index:** `timestamp` (untuk pengurutan kronologis terbalik).
* **Skema Data Tiap Batch:**
  ```typescript
  interface HistoryBatch {
    id: string;               // e.g. "batch-1773829102-abc12"
    timestamp: number;        // Epoch timestamp (ms)
    campaignName: string;     // Nama campaign saat batch dijalankan
    configSnapshot: object;   // Snapshot syarat campaign saat validasi
    summary: {
      total: number;
      pass: number;
      fail: number;
      review: number;
    };
    reports: ValidationReport[]; // Array lengkap kartu video
  }
  ```
* **Auto-Rollover Label Relatif:**
  Sistem menghitung label tanggal secara dinamis setiap kali tab dibuka:
  * Tanggal hari ini $\rightarrow$ `Hari Ini — [Hari, DD Bulan YYYY]`
  * Tanggal kemarin $\rightarrow$ `Kemarin — [Hari, DD Bulan YYYY]`
  * Tanggal kemarin lusa $\rightarrow$ `Kemarin Lusa — [Hari, DD Bulan YYYY]`
  * Sebelum itu $\rightarrow$ `[Hari, DD Bulan YYYY]`
  Ketika jam berganti melewati 00:00 WIB, pengelompokan batch otomatis berpindah ke kelompok hari sebelumnya secara otomatis.

