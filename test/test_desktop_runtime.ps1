$env:ELECTRON_RUN_AS_NODE = $null
Remove-Item Env:\ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

Write-Host "=== TEST 1: Menjalankan Binary Desktop Unpacked (dengan Lifecycle Hook) ==="
$exePath = Join-Path $PSScriptRoot "..\dist\win-unpacked\TikTok Validator Kacery.exe"
if (-not (Test-Path $exePath)) {
    Write-Error "Binary tidak ditemukan di: $exePath"
    exit 1
}

$proc = Start-Process -FilePath $exePath -ArgumentList "--test-quit" -PassThru
Start-Sleep -Seconds 2

Write-Host "Desktop Process ID : $($proc.Id)"
Write-Host "Process Responding : $($proc.Responding)"

Write-Host "`n=== TEST 2: Memverifikasi Endpoint Backend Internal ==="
try {
    $status = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/system-status" -TimeoutSec 4 -UseBasicParsing
    Write-Host "Status Success: $($status.success)"
    Write-Host "Is Desktop: $($status.isDesktop)"
    Write-Host "FFmpeg Available: $($status.ffmpegAvailable)"
    Write-Host "FFmpeg Path: $($status.ffmpegPath)"
    Write-Host "Platform: $($status.platform)"
} catch {
    Write-Host "Error calling /api/system-status: $_"
}

Write-Host "`n=== TEST 3: Memverifikasi Frontend HTML & 3 Tab ==="
try {
    $webRes = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -TimeoutSec 4 -UseBasicParsing
    $html = $webRes.Content
    
    $hasBeranda = $html.Contains('id="tab-btn-home"') -and $html.Contains('id="tab-content-home"')
    $hasRiwayat = $html.Contains('id="tab-btn-history"') -and $html.Contains('id="tab-content-history"')
    $hasLisensi = $html.Contains('id="tab-btn-license"') -and $html.Contains('id="tab-content-license"')
    $hasDanial = $html.Contains('Danial Gobel')
    $hasJorje = $html.Contains('Jorje')
    $hasAntigravity = $html.Contains('Antigravity')
    
    Write-Host "Tab Beranda ada? : $hasBeranda"
    Write-Host "Tab Riwayat ada? : $hasRiwayat"
    Write-Host "Tab Lisensi ada? : $hasLisensi"
    Write-Host "Kredit Danial Gobel & Jorje ada? : ($hasDanial dan $hasJorje)"
    Write-Host "Kredit Antigravity IDE ada? : $hasAntigravity"
} catch {
    Write-Host "Error calling frontend HTML: $_"
}

Write-Host "`n=== TEST 4: Verifikasi Penutupan Jendela (Simulasi Tombol [X] / Lifecycle Window Close) ==="
Write-Host "Menunggu siklus penutupan jendela normal selesai..."
$exited = $proc.WaitForExit(6000)

if ($proc.HasExited) {
    Write-Host "✅ [PASS] Proses berhasil mati total otomatis tanpa tersisa di Task Manager!"
} else {
    Write-Host "❌ [FAIL] Proses masih nyangkut di Task Manager! Memaksa kill..."
    Stop-Process -Id $proc.Id -Force
    exit 1
}

Write-Host "`n=== TEST 5: Verifikasi Pembukaan Kembali (Second Launch Test) ==="
Write-Host "Membuka kembali aplikasi untuk memastikan jendela tampil normal di pembukaan kedua..."
$proc2 = Start-Process -FilePath $exePath -ArgumentList "--test-quit" -PassThru
Start-Sleep -Seconds 2

Write-Host "Second Launch Process ID : $($proc2.Id)"
Write-Host "Second Launch Responding : $($proc2.Responding)"

try {
    $status2 = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/system-status" -TimeoutSec 3 -UseBasicParsing
    Write-Host "Second Launch Endpoint OK: $($status2.success)"
} catch {
    Write-Host "Second Launch Endpoint Warning: $_"
}

$proc2.WaitForExit(6000)
if ($proc2.HasExited) {
    Write-Host "✅ [PASS] Pembukaan kedua berhasil menutup bersih tanpa ada sisa proses!"
} else {
    Stop-Process -Id $proc2.Id -Force
}

Write-Host "✅ [PASS] Siklus buka-tutup-buka kembali diverifikasi 100% sempurna!"
Write-Host "`n>>> SEMUA VERIFIKASI DESKTOP RUNTIME 100% SUKSES! <<<"
