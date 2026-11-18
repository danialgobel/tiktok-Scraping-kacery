# 05. Standar Koding & Aturan Kritis — TikTok Validator Kacery

Dokumen ini memuat aturan-aturan absolut (*non-negotiable rules*) yang **WAJIB** ditaati oleh setiap pengembang, kontributor, dan AI agent yang bekerja pada repositori ini.

---

## 1. Aturan Penamaan Resmi (Naming Conventions)

### A. Pengguna Utama (Client)
* Nama panggilan resmi adalah **"Kacery"**.
* **DILARANG KERAS** menuliskan namanya menjadi *"Kak Cherry"*, *"Cherry"*, *"Kak Cery"*, atau sebutan lainnya. Selalu gunakan penulisan satu kata: **Kacery**.

### B. Asisten AI Terintegrasi
* Nama asisten kecerdasan buatan dalam aplikasi ini adalah **"AI Jorje"** atau **"Analisis Jorje"**.
* Jangan menampilkannya sebagai *"Analisis Gemini"* di antarmuka publik, meskipun di balik layar memanfaatkan Google Gemini API.

### C. Hak Cipta & Kredit Orisinalitas
* Pembuat perangkat lunak: **Danial Gobel** (`danialgobel`) dan **Jorje Asisten AI**.
* Lingkungan Rekayasa: **Google Antigravity IDE**.
* Format Hak Cipta Resmi:
  ```
  Hak Cipta © 2026 Danial Gobel & Jorje Asisten AI. Seluruh Hak Cipta Dilindungi Undang-Undang.
  Dibangun dengan Google Antigravity IDE.
  ```

---

## 2. Standar Desain & Estetika Antarmuka (UI/UX)

### A. Gaya Neobrutalism Pastel
* **Warna Dasar:** Pink lembut (`#fff5f7`, `#ffe4ec`), Rose (`#e11d48`, `#be123c`), Putih bersih (`#ffffff`), dan Slate gelap (`#0f172a`).
* **Batas & Bayangan:** Garis solid 2px - 2.5px (`#0f172a`), bayangan tajam (*hard offset shadow* tanpa blur: `box-shadow: 4px 4px 0px #0f172a`).
* **Sudut:** Rounded sudut modern (`border-radius: 10px - 16px`).

### B. Larangan Keras Terhadap "AI-Slop Emojis"
* **Dilarang** menyematkan emoji generik yang memberi kesan murahan atau AI-generated (seperti 🌸, 🤖, 🚀, 💡 secara serampangan di dalam label sistem).
* Gunakan selalu **ikon SVG monoline clean** dengan garis tegas dan `stroke-width: 2px`.
* Satu-satunya logo resmi adalah **huruf 'C' warna pink berhias pita** (`public/icons/kacery-logo.png` dan `kacery-logo.ico`).

### C. Label Status Ramah Berbahasa Indonesia
Dalam antarmuka pengguna, dilarang memakai istilah teknis bahasa Inggris:
* `PASS` $\rightarrow$ **"Sudah Sesuai"**
* `FAIL` $\rightarrow$ **"Belum Sesuai"**
* `NEED REVIEW` $\rightarrow$ **"Perlu Cek"**

### D. Input Interaktif Tag Adder
* Input hashtag, mention, kata kunci brand, dan affiliate usernames **WAJIB** menggunakan komponen **Tag Adder**:
  * Kotak teks tunggal + tombol **+ Tambah**.
  * Chip badge yang bisa dihapus satu per satu dengan tanda silang `✕`.
* **Dilarang keras** mengembalikan input menjadi textarea format koma/spasi yang rawan kesalahan ketik.

---

## 3. Keamanan, Rahasia & Privasi Data

* **File `.env` TIDAK BOLEH di-commit ke Git:**
  * File `.gitignore` harus selalu mengecualikan `.env`, `.env.local`, dan file credential lainnya.
  * API key Google Gemini disimpan di Vercel Environment Variables (`GEMINI_API_KEY`) atau di `.env` lokal komputer Bel.
* **Privasi Penuh untuk Kacery:**
  * Seluruh data riwayat validasi video tersimpan di dalam **IndexedDB lokal di harddisk laptop Kacery**.
  * Tidak ada data link video, username affiliate, ataupun catatan hasil validasi yang dikirimkan ke server analytics atau pihak ketiga mana pun.

---

## 4. Disiplin Koding & Pengujian Otomatis

1. **Pengujian Sebelum Rilis:**
   Sebelum melakukan git commit atau push, seluruh test suite wajib dijalankan dan harus lulus 100%:
   ```bash
   npm test
   # Memastikan 35 test case di test/test_core.js lulus 100%
   ```
2. **Kerapian Modul ES:**
   Sebelum menambahkan fungsi baru di `public/app.js`, lakukan pengecekan nama fungsi agar tidak ada deklarasi ganda yang merusak kompilasi modul browser.
3. **Penyelarasan Cache Buster:**
   Setiap kali memodifikasi file statis di `public/` (`app.js`, `style.css`), selalu naikkan versi cache buster di `public/index.html` dan `public/sw.js`.

