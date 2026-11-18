const { app, BrowserWindow, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;
let serverInstance = null;
let currentPort = 3000;

// Inisialisasi Auto-Updater resmi via GitHub Releases
function initAutoUpdater(win) {
  if (!app.isPackaged) {
    console.log('[AutoUpdater] Aplikasi running in dev mode, melewati auto-updater.');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Memeriksa rilis baru di GitHub...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[AutoUpdater] Versi baru terdeteksi: v${info.version}`);
    if (win && !win.isDestroyed()) {
      win.webContents.executeJavaScript(`
        if (typeof showToast === 'function') {
          showToast('Pembaruan baru v${info.version} sedang diunduh di latar belakang... 🚀', 6000);
        }
      `).catch(() => {});
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Aplikasi sudah versi terbaru.');
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Cek update dilewati (offline atau repo private):', err?.message || err);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[AutoUpdater] Versi v${info.version} selesai diunduh.`);
    if (win && !win.isDestroyed()) {
      win.webContents.executeJavaScript(`
        if (typeof showToast === 'function') {
          showToast('Pembaruan v${info.version} siap! Aplikasi otomatis diperbarui saat ditutup. ✨', 10000);
        }
      `).catch(() => {});
    }
  });

  // Tunggu 5 detik setelah aplikasi stabil baru lakukan pengecekan
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((e) => {
      console.warn('[AutoUpdater] checkForUpdatesAndNotify ditolak:', e?.message);
    });
  }, 5000);
}

// Registrasi AppUserModelId resmi untuk Windows Taskbar & Shortcut grouping
if (process.platform === 'win32') {
  app.setAppUserModelId('com.danialgobel.tiktokvalidatorkacery');
}

// Single Instance Lock: Mencegah aplikasi dibuka dobel
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => {
    // Jika user mengklik icon lagi, fokuskan atau munculkan kembali jendela
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow(currentPort);
    }
  });
}

async function createWindow(serverPort) {
  currentPort = serverPort;
  const appIconPath = process.platform === 'win32'
    ? path.join(__dirname, 'public', 'icons', 'kacery-logo.ico')
    : path.join(__dirname, 'public', 'icons', 'kacery-logo.png');

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 920,
    minHeight: 640,
    title: 'TikTok Validator Kacery',
    icon: appIconPath,
    backgroundColor: '#fff5f7',
    autoHideMenuBar: true,
    show: true, // Wajib TRUE agar jendela langsung tampil di monitor tanpa terjebak race condition
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Daftarkan listener sebelum memuat URL untuk keamanan rendering
  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  const appUrl = `http://127.0.0.1:${serverPort}`;
  try {
    await mainWindow.loadURL(appUrl);
  } catch (loadErr) {
    console.warn('[Desktop Window] Peringatan memuat URL:', loadErr.message);
  }

  // Jaminan pasti tampil setelah load selesai
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }

  // Buka link luar di browser default Windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Saat jendela mau ditutup oleh user (tombol [X])
  mainWindow.on('close', () => {
    console.log('[Desktop Window] Event: close terpanggil');
    if (serverInstance) {
      try {
        if (typeof serverInstance.closeAllConnections === 'function') {
          serverInstance.closeAllConnections();
        }
        serverInstance.close();
      } catch (e) {}
    }
  });

  // Saat jendela ditutup oleh user (tombol [X]): MATIKAN TOTAL TANPA MENYISAKAN ZOMBIE PROCESS
  mainWindow.on('closed', () => {
    console.log('[Desktop Window] Event: closed terpanggil - mematikan aplikasi total');
    mainWindow = null;
    if (serverInstance) {
      try {
        if (typeof serverInstance.closeAllConnections === 'function') {
          serverInstance.closeAllConnections();
        }
        serverInstance.close();
      } catch (e) {}
    }
    app.exit(0); // Jaminan 100% proses mati total dari Task Manager
  });

  // Mode pengujian otomatis jika dipanggil dengan --test-quit
  if (process.argv.includes('--test-quit')) {
    setTimeout(() => {
      console.log('[TestMode] Menutup mainWindow otomatis untuk verifikasi lifecycle...');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
    }, 3500);
  }
}

// Inisialisasi Aplikasi Desktop
app.whenReady().then(async () => {
  try {
    // Import server.js dynamically (ESM)
    const { startDesktopServer } = await import('./server.js');
    const { server, port } = await startDesktopServer(3000);
    serverInstance = server;
    currentPort = port;

    await createWindow(port);
    initAutoUpdater(mainWindow);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(port);
      }
    });
  } catch (err) {
    console.error('Fatal error saat memulai desktop application:', err);
    app.quit();
    process.exit(1);
  }
});

// Bersih saat keluar: Matikan server lokal
app.on('window-all-closed', () => {
  if (serverInstance) {
    try {
      if (typeof serverInstance.closeAllConnections === 'function') {
        serverInstance.closeAllConnections();
      }
      serverInstance.close();
    } catch (e) {}
  }
  app.exit(0);
});

app.on('before-quit', () => {
  if (serverInstance) {
    try {
      if (typeof serverInstance.closeAllConnections === 'function') {
        serverInstance.closeAllConnections();
      }
      serverInstance.close();
    } catch (e) {}
  }
  app.exit(0);
});

