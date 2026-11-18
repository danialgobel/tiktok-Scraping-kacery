# 02. Hal Sulit & Celah Rawan Bug — Catatan Pengalaman Teknis

Dokumen ini adalah kompilasi masalah teknis paling kompleks, "jebakan" tak terduga, dan solusi arsitektur yang ditemukan selama proses riset dan pengembangan **TikTok Validator Kacery**.

---

## 1. Tantangan Ekstraksi Data Publik TikTok & SlardarWAF PoW

### Masalah:
TikTok menerapkan sistem proteksi anti-scraping berlapis menggunakan **SlardarWAF** dan tantangan **Proof of Work (PoW)** berbasis JavaScript obfuskasi. Jika diakses dengan HTTP GET biasa, respons yang kembali sering berupa halaman HTML kosong atau kode captcha.

### Solusi & Implementasi:
* Di `lib/tiktok-extractor.js`, dibangun logika pemecah algoritma PoW ringan yang mengevaluasi parameter challenge dari header respons TikTok secara lokal.
* **Dual-Tier Resilient Fallback:**
  1. *Tier 1 (Direct Extract):* Membaca tag `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` langsung dari halaman video publik TikTok dengan User-Agent Chrome Windows modern dan cookie sesi anonim.
  2. *Tier 2 (TikWM API Fallback):* Jika Tier 1 mengalami timeout atau terdeteksi oleh WAF TikTok, sistem otomatis beralih dalam hitungan milidetik ke endpoint TikWM publik tanpa menghentikan proses validasi user.
* **Penyelamatan Metadata Creator:** Jika API eksternal hanya mengembalikan username tanpa follower count, sistem menjalankan secondary probe ke endpoint publik `@username` untuk mengambil data statistik kreator secara akurat.

---

## 2. Jebakan Audio Asli Video vs Musik Latar TikTok

### Masalah:
Pada versi awal, tombol "Putar Suara Video" memutar link audio dari `itemInfo.itemStruct.music.playUrl`.
* **Fakta Lapangan:** Di TikTok, banyak kreator yang merekam suara mereka sendiri saat review produk, namun memilih background sound yang sedang tren di TikTok. Akibatnya, `music.playUrl` hanya memutar lagu latar tersebut, **bukan suara asli omongan kreator** yang menyebutkan nama brand! Selain itu, URL video mentah dari TikTok web JSON (`v16-webapp-prime`) sering kali berupa Akamai Edgesuite URL yang terkunci sesi (memberikan *403 Access Denied* jika diakses tanpa cookie sesi).
* **Solusi & Arsitektur Definitif:**
  1. *Haramkan fallback BGM:* Properti `media.audioUrl` wajib 100% menunjuk ke stream video mentah yang dapat diakses publik (`v16m.tiktokcdn-us.com` / TikWM CDN), bukan `music.playUrl`.
  2. *FFmpeg MP3 Demux On-the-Fly:* Endpoint `/api/stream-audio` menyuntikkan header `Referer: https://www.tiktok.com/` ke FFmpeg dan melakukan transcoding instan ke MP3 (`-vn -acodec libmp3lame -ab 128k -f mp3`), mencabut saluran audio dialog riil kreator dalam <200ms.
  3. *Video Proxy dengan Range Support (`/api/proxy-video`):* Menghindari pemblokiran CORS & hotlink CDN TikTok pada tag `<video>` browser dengan proxy lokal yang meneruskan header Range (`206 Partial Content`) untuk scrubbing/seeking video yang mulus.

---

## 3. Jebakan Terminal Windows: `ELECTRON_RUN_AS_NODE=1`

### Masalah:
Saat menguji binary `.exe` atau menjalankan skrip Electron di terminal IDE (VS Code atau Antigravity IDE), executable tiba-tiba melempar error aneh:
```
TypeError: Cannot read properties of undefined (reading 'requestSingleInstanceLock')
atau
bad option: --enable-logging
```

### Akar Penyebab:
Subshell terminal bawaan IDE secara otomatis menyetel variabel lingkungan:
```powershell
$env:ELECTRON_RUN_AS_NODE = 1
```
Jika variabel ini aktif di lingkungan PowerShell, file executable Electron dipaksa berjalan sebagai CLI Node.js biasa, bukan sebagai runtime aplikasi desktop grafis. Akibatnya, modul native Electron (`app`, `BrowserWindow`) menjadi `undefined`.

### Cara Penanganan Wajib:
Dalam setiap skrip pengujian terminal, variabel ini harus dihapus terlebih dahulu:
```powershell
$env:ELECTRON_RUN_AS_NODE = $null
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
```
*Catatan: Pengguna akhir (Kacery) yang membuka aplikasi via klik ganda di Windows Explorer tidak terpengaruh oleh isu ini.*

---

## 4. Tabrakan Port Internal (`EADDRINUSE`)

### Masalah:
Aplikasi desktop menjalankan server lokal Express pada port 3000. Jika Kacery atau pengguna lain sedang membuka software lain yang menggunakan port 3000, aplikasi Electron biasanya akan crash seketika karena `Error: listen EADDRINUSE: address already in use :::3000`.

### Solusi:
Di `server.js`, fungsi `startDesktopServer` dilengkapi mekanisme deteksi port otomatis:
```javascript
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Port 3000 penuh, minta sistem operasi memilihkan port bebas apa pun (port 0)
    const fallbackServer = app.listen(0, '127.0.0.1', () => {
      const freePort = fallbackServer.address().port;
      resolve({ server: fallbackServer, port: freePort });
    });
  }
});
```
Jendela Electron kemudian membaca nilai `freePort` hasil alokasi dinamis tersebut, sehingga aplikasi tetap terbuka mulus 100% tanpa peduli port 3000 sedang terpakai atau tidak.

---

## 5. Larangan Duplikasi Deklarasi Fungsi di ES Modules

### Masalah:
Frontend PWA dimuat sebagai JavaScript ES Module (`type="module"`). Dalam standar ES Modules, deklarasi fungsi atau variabel dengan nama ganda di scope yang sama:
```javascript
function renderCards() { ... }
// ... baris lain ...
function renderCards() { ... } // Duplikasi!
```
Akan memicu **fatal error:** `Uncaught SyntaxError: Identifier 'renderCards' has already been declared`.
Error ini terjadi saat kompilasi skrip awal sebelum kode dieksekusi, yang menyebabkan **seluruh file `app.js` mogok total dan tombol apa pun di layar tidak bisa diklik**.

### Aturan Baku:
Selalu lakukan audit pencarian fungsi sebelum menambahkan logika baru. Jangan pernah menulis ulang fungsi yang sudah ada. Jika ingin memodifikasi, lakukan edit langsung pada fungsi aslinya.

---

## 6. Jebakan Cache Usang (Stale-Cache) PWA & CDN

### Masalah:
Setelah kode dideploy ke Vercel, browser pengguna sering kali masih menampilkan versi lama karena Service Worker atau browser cache menyimpan file statis `app.js` dan `style.css`.

### Strategi Mitigasi Berlapis:
1. **Cache Buster Query String:** Setiap ada pembaruan kode, versi di `public/index.html` dan `public/sw.js` wajib dinaikkan:
   ```html
   <link rel="stylesheet" href="/style.css?v=5.1">
   <script src="/app.js?v=5.1" type="module"></script>
   ```
2. **Anti-Cache Headers di `vercel.json`:**
   Diterapkan header khusus untuk file HTML dan JS:
   ```json
   "headers": [
     {
       "source": "/(.*)",
       "headers": [
         { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
       ]
     }
   ]
   ```
3. **Auto-Skip Waiting di Service Worker:** Service worker baru otomatis mengklaim klien saat aktif tanpa menunggu browser ditutup.

---

## 7. Ketelitian Pencocokan Hashtag & Mention (Word-Boundary Regex)

### Masalah:
Jika campaign mewajibkan hashtag `#Vape`, pencocokan substring sederhana (`includes('#Vape')`) akan salah menganggap valid hashtag lain seperti `#VapeCuanAntiNyamuk` atau `#Vapemurah`.

### Solusi:
Di `lib/validator.js`, validasi teks menggunakan batas kata (*word-boundary regex*):
```javascript
const regex = new RegExp(`(^|\\s|[.,!?;:])${escaped}(\\s|[.,!?;:]|$)`, 'i');
```
Dengan regex ini, hanya `#Vape` yang berdiri sendiri (atau diikuti tanda baca/spasi) yang dianggap sah. Hashtag turunan yang lebih panjang akan ditolak dengan benar.

---

## 8. Video Keranjang Kuning (E-Commerce) Menghapus `playAddr` & Solusi Multi-Tier

### Masalah:
Pada video affiliate TikTok Shop (`isECVideo: true`), TikTok secara sengaja mengosongkan `item.video.playAddr` pada data HTML publik. Jika backend hanya mengandalkan TikWM dan TikWM terkena Cloudflare atau rate-limit, nilai `videoUrl` menjadi kosong. Jika frontend membungkus bagian media dengan aturan kaku `${report.media?.videoUrl ? ... : ''}`, maka seluruh kartu media (audio dan video) akan hilang total dari tampilan.

### Solusi Definitif:
1. **Multi-Tier CDN Stream Resolvers:**
   - **Tier 1:** Scraper langsung web JSON TikTok.
   - **Tier 2:** TikWM API dengan pembersihan parameter tracking URL (`?_r=1&...`).
   - **Tier 3:** TikMate API (`https://api.tikmate.app/api/lookup`) sebagai cadangan independen berkecepatan tinggi yang mendukung Range request (206).
   - **Tier 4:** Fallback audio darurat menggunakan `music.playUrl` jika seluruh stream video eksternal dibatasi.
2. **Frontend Resilience:**
   Frontend tidak boleh menyembunyikan media block jika audio atau video tersedia (`${(report.media?.videoUrl || report.media?.audioUrl) ? ... : ''}`).

---

## 9. Icon Taskbar Windows Berubah Menjadi Icon Default (Kabel)

### Masalah:
Saat dijalankan di Windows, icon pada taskbar kadang menampilkan icon dialog default Win32 (jendela dengan kabel kecil), bukan logo Kacery.

### Akar Penyebab & Solusi:
1. **AppUserModelID:** Wajib memanggil `app.setAppUserModelId('com.danialgobel.tiktokvalidatorkacery')` di baris pertama `electron-main.cjs` agar Windows Explorer mengenali identitas grup jendela.
2. **Native ICO File:** Jendela Electron Windows wajib memanggil file `.ico`, bukan `.png`.
3. **Multi-Resolution ICO:** File `public/icons/kacery-logo.ico` wajib memiliki layer 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, dan 256x256 agar sistem operasi tidak gagal melakukan *downsampling*.

---

## 10. Tata Letak Layar Penuh Desktop (Widescreen Dashboard)

### Masalah:
Batas lebar awal `max-width: 1180px` dirancang untuk layar web lama, sehingga saat aplikasi dibuka di monitor 1080p (1920x1080), terdapat ~740px ruang kosong terbuang di sisi kiri dan kanan.

### Solusi:
Batas kontainer diperlebar menjadi `max-width: min(96vw, 1640px)`. Sidebar diperlebar menjadi 380px–420px, dan workspace kerja menjadi 1100px–1200px. Grid rincian kriteria dan pemutar media diperbesar dengan padding serta font yang proporsional sehingga terlihat megah dan nyaman dioperasikan sebagai software desktop profesional.


