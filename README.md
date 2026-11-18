# TikTok Validator Kacery

Aplikasi otomatis (Progressive Web App & Standalone Desktop Windows) khusus dirancang untuk mempermudah dan mempercepat pekerjaan **Kacery** dalam memeriksa serta memvalidasi kepatuhan video TikTok affiliate secara instan, akurat, dan profesional.

Dibuat oleh **Danial Gobel** & **Jorje Asisten AI** menggunakan **Google Antigravity IDE**.

---

## Fitur Utama

1. **3 Tab Navigasi Terstruktur**
   - **🏠 Beranda:** Ruang kerja utama untuk memeriksa link video TikTok secara instan, memutar audio asli video, dan mengunduh laporan.
   - **📜 Riwayat (IndexedDB Lokal):** Arsip riwayat otomatis yang dikelompokkan berdasarkan tanggal (`Hari Ini`, `Kemarin`, `Kemarin Lusa`), lengkap dengan fitur cari kreator dan ekspor ulang.
   - **⚖️ Lisensi & Hak Cipta:** Informasi hak cipta orisinal Danial Gobel & AI Jorje serta jaminan keamanan privasi tanpa pihak ketiga.

2. **Ekstraksi Data Video TikTok Publik (Tanpa Login & Cepat)**
   - Mendukung tautan video standar (`tiktok.com/@user/video/...`) dan tautan pendek (`vt.tiktok.com`, `vm.tiktok.com`).
   - Ekstraksi langsung metrik publik: Followers akun pengunggah, Views, Likes, Komentar, Share, dan Saves.
   - Dilengkapi pemecah tantangan Proof-of-Work (PoW) SlardarWAF lokal (~1 ms) serta fallback TikWM API.

3. **Pemutar Audio Asli Video (Direct Video Audio Demux)**
   - Mengekstrak audio asli omongan kreator langsung dari file video menggunakan multi-tier FFmpeg resolver, bukan sekadar musik latar tren TikTok.

4. **Tag Adder Interaktif (Input Satu per Satu)**
   - Input Hashtag (`#`), Mention (`@`), dan Kata Kunci Brand dimasukkan satu per satu dengan tombol **`+ Tambah`** (atau tekan Enter).
   - Dilengkapi chip badge interaktif yang mudah dihapus (`✕`).

5. **Verifikasi Konten Cerdas AI Jorje**
   - Menganalisis konteks video dan teks caption untuk memastikan brand yang diwajibkan benar-benar dipromosikan.
   - Memberikan stempel verifikasi ramah dalam bahasa Indonesia dari asisten AI Jorje.

6. **Pemeriksaan Banyak Video Sekaligus (Batch Mode)**
   - Mendukung puluhan tautan sekaligus (satu baris per link) dengan progress bar waktu nyata.

7. **Laporan & Ekspor Lengkap**
   - Status terstruktur: **Sudah Sesuai**, **Belum Sesuai**, atau **Perlu Cek**.
   - **Salin Rekap WhatsApp:** Teks rapi siap tempel ke grup WhatsApp klien.
   - **Unduh CSV:** Ekspor ke format Excel CSV.
   - **Unduh Gambar Laporan (PNG Neobrutalism):** Infografis beresolusi tinggi (Hi-DPI) dengan desain Neobrutalism pastel modern dan stempel verifikasi resmi.

8. **Dua Format Aplikasi (Web PWA & Desktop Windows .exe)**
   - **Web / PWA:** Buka di browser atau pasang di HP Android / iOS.
   - **Desktop Windows (.exe):** File executable murni (Setup Installer & Portable) dengan fitur **Auto-Updater via GitHub Releases**.

---

## 📚 Dokumentasi Teknis Lengkap (`docs/`)

Seluruh catatan teknis, arsitektur, panduan rilis, dan dokumentasi operasional tersedia di folder `docs/`:

* [01. Arsitektur & Desain Sistem](file:///c:/Users/acer/.gemini/antigravity-ide/scratch/tiktok-affiliate-validator/docs/01_ARSITEKTUR_DAN_DESAIN_SISTEM.md)
* [02. Hal Sulit & Celah Rawan Bug](file:///c:/Users/acer/.gemini/antigravity-ide/scratch/tiktok-affiliate-validator/docs/02_HAL_SULIT_DAN_RAWAN_BUGS.md)
* [03. Panduan Desktop & Auto-Update GitHub](file:///c:/Users/acer/.gemini/antigravity-ide/scratch/tiktok-affiliate-validator/docs/03_PANDUAN_DESKTOP_DAN_AUTO_UPDATE.md)
* [04. Panduan Operasional Kacery](file:///c:/Users/acer/.gemini/antigravity-ide/scratch/tiktok-affiliate-validator/docs/04_PANDUAN_OPERASIONAL_KACERY.md)
* [05. Standar Koding & Aturan Kritis](file:///c:/Users/acer/.gemini/antigravity-ide/scratch/tiktok-affiliate-validator/docs/05_STANDAR_KODING_DAN_ATURAN_KRITIS.md)

---

## Menjalankan di Komputer Lokal

1. **Instalasi Dependensi**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**
   Salin `.env.example` menjadi `.env` dan masukkan `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```

3. **Jalankan Aplikasi Web Lokal**
   ```bash
   npm start
   # Buka http://localhost:3000
   ```

4. **Jalankan Aplikasi Desktop (Electron)**
   ```bash
   npm run desktop
   ```

5. **Build Executable Windows (.exe)**
   ```bash
   npm run build:exe
   # File installer dan portable akan muncul di folder dist/
   ```

6. **Uji Logika (Unit & Integration Test)**
   ```bash
   npm test
   ```
   Buka di browser: `http://localhost:3000`

4. **Uji Logika (Unit & Integration Test)**
   ```bash
   npm test
   ```

---

## Panduan Deploy ke Vercel (Gratis & Otomatis)

Aplikasi ini sudah dilengkapi `vercel.json` dan `api/index.js` sehingga dapat langsung di-deploy dari repository GitHub ke Vercel:

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New...** > **Project**.
2. Pilih repository: `danialgobel/tiktok-Scraping-kacery`.
3. Pada bagian **Environment Variables**, tambahkan:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `(Masukkan API Key Google Gemini)`
4. Klik **Deploy**.
5. Vercel akan otomatis membangun aplikasi dan memberikan URL publik HTTPS gratis (misal: `https://tiktok-scraping-kacery.vercel.app`).
6. **Pembaruan Otomatis:** Setiap kali Anda melakukan `git push` ke branch utama di GitHub, Vercel akan otomatis melakukan build ulang dan pengguna yang membuka web app akan langsung menikmati versi terbaru secara otomatis!

---

## Memasang Web App di HP (Add to Home Screen)

### Di Android (Google Chrome)
1. Buka tautan Vercel di browser Google Chrome ponsel.
2. Ketuk ikon titik tiga di kanan atas.
3. Pilih **"Tambahkan ke Layar Utama"** / **"Pasang Aplikasi"**.

### Di iPhone (Safari)
1. Buka tautan Vercel di browser Safari.
2. Ketuk tombol **Share** (kotak panah ke atas) di menu bawah.
3. Pilih **"Add to Home Screen"** (*Tambahkan ke Layar Utama*).
