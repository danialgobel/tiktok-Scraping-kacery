# TikTok Validator Kacery (PWA)

Aplikasi web otomatis (Progressive Web App) khusus dirancang untuk mempermudah dan mempercepat pekerjaan **Kacery** dalam memeriksa serta memvalidasi konten video TikTok affiliate secara instan dan akurat.

---

## Fitur Utama

1. **Ekstraksi Data Video TikTok Otomatis (Tanpa Login & Cepat)**
   - Mendukung tautan video standar (`tiktok.com/@user/video/...`) dan tautan pendek (`vt.tiktok.com`, `vm.tiktok.com`).
   - Ekstraksi langsung metrik publik: Followers akun pengunggah, Views, Likes, Komentar, Share, dan Saves (Bookmarks).
   - Ekstraksi caption lengkap, hashtag, dan mention.
   - Dilengkapi pemecah tantangan Proof-of-Work (PoW) SlardarWAF lokal (~1 ms) serta fallback TikWM API.

2. **Tag Adder Interaktif (Input Satu per Satu)**
   - Input Hashtag (`#`), Mention (`@`), dan Kata Kunci Brand dapat dimasukkan satu per satu dengan tombol **`+ Tambah`** (atau tekan Enter).
   - Menghindari kesalahan format koma/spasi.
   - Dilengkapi chip badge interaktif yang mudah dihapus (`✕`).

3. **Verifikasi Konten Cerdas Berbasis Google Gemini AI**
   - Menganalisis konteks video dan teks caption untuk memastikan brand yang diwajibkan benar-benar dipromosikan (bukan video hiburan random).
   - Menampilkan skor akurasi dan ringkasan ramah dalam bahasa Indonesia.

4. **Perhitungan Engagement Rate (ER) Akurat**
   - Rumus: `ER = (Likes + Komentar + Share + Saves) / Views × 100%`.
   - Transparan jika data Saves tidak tersedia dari TikTok.

5. **Pemeriksaan Banyak Video Sekaligus (Batch Mode)**
   - Mendukung 10 hingga 20 tautan sekaligus (satu baris per link).
   - Dilengkapi progress bar waktu nyata.

6. **Laporan & Ekspor Hasil Pekerjaan**
   - Status terstruktur: **Sudah Sesuai**, **Belum Sesuai**, atau **Perlu Cek**.
   - **Salin Rekap:** Format teks rapi siap ditempel ke chat WhatsApp atau spreadsheet.
   - **Download CSV:** Ekspor seluruh laporan ke file Excel CSV dengan satu klik.

7. **Desain Responsif & Auto-Update di Vercel**
   - **Desktop:** Tampilan Dashboard Dua Kolom modern dan lega.
   - **Mobile (HP):** Tampilan Satu Kolom vertikal yang nyaman dioperasikan satu tangan.
   - **Auto-Update PWA:** Jika ada pembaruan kode di GitHub yang ter-deploy di Vercel, pengguna (Kacery) yang membuka link web atau menginstal PWA akan otomatis menerima versi terbaru tanpa perlu membersihkan cache browser secara manual.

---

## Menjalankan di Komputer Lokal

1. **Instalasi Dependensi**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**
   Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi `GEMINI_API_KEY` jika ingin mengaktifkan fitur analisis AI lokal.

3. **Jalankan Aplikasi**
   ```bash
   npm start
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
