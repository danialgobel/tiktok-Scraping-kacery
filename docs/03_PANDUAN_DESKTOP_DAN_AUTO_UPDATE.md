# 03. Panduan Desktop & Auto-Update GitHub — TikTok Validator Kacery

Dokumen ini menjelaskan alur kerja pembangunan file executable Windows (.exe), konfigurasi pembaruan otomatis (*Auto-Updater*) berbasis GitHub Releases, dan panduan instalasi untuk pengguna akhir.

---

## 1. Spesifikasi File Distribusi Windows

Hasil kompilasi menggunakan `electron-builder` menghasilkan dua file di folder `dist/`:

| Format | Nama File | Ukuran | Kegunaan |
| :--- | :--- | :---: | :--- |
| **Setup Installer** | `TikTok Validator Kacery Setup X.X.X.exe` | ~119 MB | Installer satu klik resmi (NSIS). Otomatis memasang shortcut di Desktop & Start Menu. Mendukung auto-update. |
| **Portable** | `TikTok Validator Kacery X.X.X.exe` | ~108 MB | Standalone portable. Bisa dijalankan langsung dari USB Flashdisk / folder unduhan tanpa instalasi. |

---

## 2. Perintah Pembangunan Executable (Build Commands)

Pastikan dependensi sudah terpasang, lalu jalankan di terminal:

```bash
# Build kedua target (Installer NSIS + Portable .exe):
npm run build:exe

# Atau build hanya versi Portable:
npm run build:portable
```

> **PENTING (Untuk Terminal Antigravity / VS Code):**
> Jika menjalankan pengujian script terminal, pastikan variabel lingkungan subshell dibersihkan:
> ```powershell
> $env:ELECTRON_RUN_AS_NODE = $null
> npm run build:exe
> ```

---

## 3. Mekanisme Auto-Updater via GitHub Releases

Aplikasi desktop dilengkapi modul `electron-updater` yang terintegrasi langsung dengan repositori GitHub:
* **Target Repositori:** `danialgobel/tiktok-Scraping-kacery`
* **Penyedia:** GitHub Releases (publik)

### Cara Kerja di Laptop Pengguna (Kacery):
1. Saat aplikasi dibuka, sistem menunggu 5 detik hingga startup selesai, lalu mengirim pengecekan senyap ke endpoint GitHub API:
   ```
   GET https://api.github.com/repos/danialgobel/tiktok-Scraping-kacery/releases/latest
   ```
2. Jika ada versi lebih baru daripada versi yang terpasang di laptop:
   * Aplikasi menampilkan notifikasi toast ramah: *"Pembaruan baru vX.X.X sedang diunduh di latar belakang... 🚀"*.
   * File pembaruan diunduh secara inkremental tanpa mengunci antarmuka.
3. Setelah unduhan selesai:
   * Muncul notifikasi toast: *"Pembaruan vX.X.X siap! Aplikasi otomatis diperbarui saat ditutup. ✨"*.
4. Saat Kacery menutup jendela aplikasi, installer NSIS secara otomatis menimpa file lama dengan versi baru.
5. Saat dibuka kembali keesokan harinya, aplikasi sudah berada pada versi terbaru tanpa Kacery perlu mengunduh file `.exe` manual lagi.

---

## 4. SOP Merilis Versi Baru (Release Workflow)

Jika Bel telah melakukan penambahan fitur atau perbaikan bug dan ingin merilisnya ke seluruh pengguna:

### Langkah 1: Naikkan Nomor Versi
Buka `package.json` dan ubah nilai `"version"`, misalnya dari `"1.1.2"` menjadi `"1.1.3"`.

### Langkah 2: Build Executable Terbaru
Jalankan perintah:
```powershell
$env:ELECTRON_RUN_AS_NODE = $null
npm run build:exe
```
Perintah ini akan menghasilkan file baru di folder `dist/`:
* `latest.yml` *(WAJIB: Manifest pembaca versi & checksum sha512)*
* `TikTok Validator Kacery Setup 1.1.3.exe` *(WAJIB: Installer NSIS)*
* `TikTok Validator Kacery Setup 1.1.3.exe.blockmap` *(WAJIB: File delta agar download hanya selisihnya saja)*
* `TikTok Validator Kacery 1.1.3.exe` *(Opsional: Versi portable)*

### Langkah 3: Buat Release di GitHub
1. Masuk ke halaman repositori: `https://github.com/danialgobel/tiktok-Scraping-kacery/releases`
2. Klik tombol **Draft a new release**.
3. Isi tag versi: `v1.1.3` (pilih target branch `main`).
4. Judul Release: `TikTok Validator Kacery v1.1.3`.
5. Tuliskan ringkasan pembaruan (*release notes*).
6. **Unggah file-file berikut dari folder `dist/` ke kotak Release:**
   * `latest.yml`
   * `TikTok Validator Kacery Setup 1.1.3.exe`
   * `TikTok Validator Kacery Setup 1.1.3.exe.blockmap`
   * `TikTok Validator Kacery 1.1.3.exe`
7. Klik **Publish release**.

*Selesai! Seluruh laptop pengguna yang membuka aplikasi akan otomatis menerima pembaruan tersebut di latar belakang saat aplikasi dibuka, dan langsung terpasang saat aplikasi ditutup.*

---

## 5. Panduan Menangani Peringatan Windows SmartScreen

Karena file executable ini dibuat secara independen dan belum dibeli sertifikat digital berbayar (*Code Signing Certificate* seperti DigiCert/Sectigo yang berharga jutaan rupiah per tahun), Windows Defender SmartScreen mungkin menampilkan layar biru:

> **"Windows protected your PC" (Windows melindungi PC Anda)**

### Cara Menjelaskan ke Pengguna (Kacery):
Beri tahu Kacery bahwa ini adalah hal yang wajar untuk software kustom/eksklusif:
1. Klik teks kecil bertuliskan **"More info" (Info selengkapnya)** di bawah kalimat peringatan.
2. Tombol kedua akan muncul: klik **"Run anyway" (Tetap jalankan)**.
3. Tindakan ini hanya perlu dilakukan **SATU KALI** saat instalasi pertama. Setelah itu aplikasi akan terbuka lancar selamanya.

