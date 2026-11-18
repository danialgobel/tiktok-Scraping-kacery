// TikTok Affiliate Content Validator - Client Application (Khusus Kacery)

const STORAGE_KEY = 'tt_affiliate_validator_config_v3';
const TOUR_STORAGE_KEY = 'tt_kacery_tour_completed_v3';

const DEFAULT_CONFIG = {
  name: 'Campaign Vape Fumakilla',
  minFollowers: 600,
  minViews: 300,
  minLikes: 50,
  requiredMentions: ['@vape.antinyamuk.idn'],
  requiredHashtags: [
    '#VapeCuanAntiNyamuk',
    '#VapeMAT',
    '#TanpaAsapTanpaAbu'
  ],
  expectedUsernames: [],
};

// Application State
let currentConfig = loadCampaignConfig();
let sessionReports = [];
let activeFilter = 'ALL';
let isRunning = false;

// Tag Adder in-memory state for Config Modal
let tempHashtags = [];
let tempMentions = [];
let tempBrands = [];
let tempUsernames = [];

// DOM Elements
const urlsInput = document.getElementById('tiktok-urls-input');
const inputCountBadge = document.getElementById('input-count-badge');
const btnStartValidation = document.getElementById('btn-start-validation');
const btnStartText = document.getElementById('btn-start-text');
const btnClearInput = document.getElementById('btn-clear-input');
const btnPasteClipboard = document.getElementById('btn-paste-clipboard');
const btnDemoLink = document.getElementById('btn-demo-link');

const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressDetail = document.getElementById('progress-detail');

const resultsSection = document.getElementById('results-section');
const emptyState = document.getElementById('empty-state');
const videoCardsList = document.getElementById('video-cards-list');
const filterStatus = document.getElementById('filter-status');
const btnCopyAllReport = document.getElementById('btn-copy-all-report');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnExportImage = document.getElementById('btn-export-image');
const boardCampaignInfo = document.getElementById('board-campaign-info');
const boardReportDate = document.getElementById('board-report-date');
const verticalCardsContainer = document.getElementById('vertical-cards-container');
const btnModeCards = document.getElementById('btn-mode-cards');
const btnModeTable = document.getElementById('btn-mode-table');
const infographicBoard = document.getElementById('infographic-board');
let currentViewMode = 'CARDS';

const statTotal = document.getElementById('stat-total');
const statPass = document.getElementById('stat-pass');
const statFail = document.getElementById('stat-fail');
const statReview = document.getElementById('stat-review');

// Config Modal Elements
const configModal = document.getElementById('config-modal');
const btnOpenConfig = document.getElementById('btn-open-config');
const btnQuickEdit = document.getElementById('btn-quick-edit');
const btnCloseConfig = document.getElementById('btn-close-config');
const btnCancelConfig = document.getElementById('btn-cancel-config');
const btnSaveConfig = document.getElementById('btn-save-config');
const btnResetConfig = document.getElementById('btn-reset-config');
const btnExportConfig = document.getElementById('btn-export-config');
const btnImportConfig = document.getElementById('btn-import-config');
const fileImportConfig = document.getElementById('file-import-config');

const cfgName = document.getElementById('cfg-name');
const cfgFollowers = document.getElementById('cfg-followers');
const cfgViews = document.getElementById('cfg-views');
const cfgLikes = document.getElementById('cfg-likes');

// Tag Adder Inputs & Containers
const inputNewHashtag = document.getElementById('input-new-hashtag');
const btnAddHashtag = document.getElementById('btn-add-hashtag');
const hashtagChipsContainer = document.getElementById('hashtag-chips-container');

const inputNewMention = document.getElementById('input-new-mention');
const btnAddMention = document.getElementById('btn-add-mention');
const mentionChipsContainer = document.getElementById('mention-chips-container');

const inputNewUsername = document.getElementById('input-new-username');
const btnAddUsername = document.getElementById('btn-add-username');
const usernameChipsContainer = document.getElementById('username-chips-container');

// Tour Elements
const btnStartTour = document.getElementById('btn-start-tour');
const tourOverlay = document.getElementById('tour-overlay');
const tourStepBadge = document.getElementById('tour-step-badge');
const tourTitle = document.getElementById('tour-title');
const tourDesc = document.getElementById('tour-desc');
const tourTipText = document.getElementById('tour-tip-text');
const btnTourClose = document.getElementById('btn-tour-close');
const btnTourSkip = document.getElementById('btn-tour-skip');
const btnTourPrev = document.getElementById('btn-tour-prev');
const btnTourNext = document.getElementById('btn-tour-next');

// Toast
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');

// Tab Navigation Elements
const tabBtnHome = document.getElementById('tab-btn-home');
const tabBtnHistory = document.getElementById('tab-btn-history');
const tabBtnLicense = document.getElementById('tab-btn-license');
const tabContentHome = document.getElementById('tab-content-home');
const tabContentHistory = document.getElementById('tab-content-history');
const tabContentLicense = document.getElementById('tab-content-license');

// History Elements
const historyGroupsContainer = document.getElementById('history-groups-container');
const historyEmptyState = document.getElementById('history-empty-state');
const historySearchInput = document.getElementById('history-search-input');
const btnClearHistory = document.getElementById('btn-clear-history');
let activeTab = 'home';
let historySearchTerm = '';
let historySearchDebounceTimer = null;

/**
 * Clean & Friendly Panduan Steps for Kacery
 */
const TOUR_STEPS = [
  {
    badge: 'Langkah 1 dari 5',
    title: 'Input Link Video TikTok',
    desc: 'Kacery bisa tempel link video TikTok pada kotak utama. Bisa 1 video atau 10 hingga 20 link sekaligus (satu link per baris). Mendukung link pendek vt.tiktok.com maupun link panjang www.tiktok.com.',
    tip: 'Gunakan tombol Tempel Link untuk menempel langsung dari clipboard secara instan!'
  },
  {
    badge: 'Langkah 2 dari 5',
    title: 'Pengaturan Syarat Campaign (Satu per Satu)',
    desc: 'Kacery bisa menentukan target followers, views, likes, hashtag wajib, dan mention. Kacery bisa menambahkan hashtag dan mention satu per satu dengan tombol Tambah tanpa khawatir salah koma atau spasi!',
    tip: 'Pengaturan otomatis tersimpan di browser Kacery, tidak perlu diatur ulang setiap kali buka web.'
  },
  {
    badge: 'Langkah 3 dari 5',
    title: 'Pemeriksaan Video Otomatis',
    desc: 'Setelah link ditempel, klik tombol merah "Periksa Video Sekarang". Sistem otomatis membaca jumlah followers, views, likes, serta mencocokkan tagar dan mention secara instan.',
    tip: 'Pemeriksaan berjalan cepat dan tidak membedakan huruf besar/kecil pada hashtag.'
  },
  {
    badge: 'Langkah 4 dari 5',
    title: 'Pemutar Audio MP3 & Video Langsung',
    desc: 'Kacery bisa memutar audio (suara saja) secara ringan untuk hemat kuota, menonton video langsung di web app, atau membuka aplikasi TikTok dengan satu klik.',
    tip: 'Gunakan pemutar audio untuk cek suara kreator secara cepat tanpa buffering!'
  },
  {
    badge: 'Langkah 5 dari 5',
    title: 'Rekap Hasil & Ekspor Gambar / Excel',
    desc: 'Semua hasil pemeriksaan disajikan dalam tabel rapi dengan caption lengkap. Kacery bisa menyalin laporan WhatsApp, mengunduh file CSV Excel, atau mengunduh Gambar Laporan (PNG).',
    tip: 'Kacery juga bisa memfilter video yang Sudah Sesuai atau Belum Sesuai saja.'
  }
];

let currentTourStep = 0;

/**
 * Discord Activity Logger & Client Telemetry
 */
function getClientTelemetry() {
  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const device = isMobile ? (/(iPad|tablet)/i.test(ua) ? 'Tablet' : 'Smartphone') : 'Desktop';
  const screen = `${window.screen?.width || window.innerWidth || 0}x${window.screen?.height || window.innerHeight || 0}`;
  const isPwa = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  return { device, os, browser, screen, isPwa };
}

let lastLoggedUrlsText = '';
let inputDebounceTimer = null;

function logDiscordActivity(type, action, details = {}) {
  try {
    const payload = {
      type,
      action,
      clientInfo: getClientTelemetry(),
      details
    };
    fetch('/api/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (err) {
    // Non-blocking: never disrupt the app
  }
}

/**
 * Initialize Application
 */
function init() {
  updateSummaryStrip();
  registerServiceWorker();

  // Send Session Start notification to Discord
  logDiscordActivity('SESSION_OPEN', 'Web App Dibuka', {
    campaignName: currentConfig.name,
    campaignConfig: currentConfig
  });

  // Input counter listener with debounced activity logger
  urlsInput.addEventListener('input', () => {
    updateInputCounter();
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
      const currentVal = urlsInput.value.trim();
      if (currentVal && currentVal !== lastLoggedUrlsText) {
        lastLoggedUrlsText = currentVal;
        const detectedUrls = parseUrlsFromInput();
        logDiscordActivity('INPUT_CHANGE', 'Input Link Diperbarui', {
          totalLinks: detectedUrls.length,
          sampleUrls: detectedUrls.slice(0, 8)
        });
      }
    }, 1200);
  });

  // Quick Action Buttons
  btnClearInput.addEventListener('click', () => {
    urlsInput.value = '';
    lastLoggedUrlsText = '';
    updateInputCounter();
    showToast('Kotak input telah dikosongkan.');
    logDiscordActivity('BUTTON_CLICK', 'Kosongkan Input', { info: 'User membersihkan seluruh isi kotak input' });
  });

  btnDemoLink.addEventListener('click', () => {
    urlsInput.value = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
    lastLoggedUrlsText = urlsInput.value;
    updateInputCounter();
    showToast('Link demo berhasil dimasukkan.');
    logDiscordActivity('BUTTON_CLICK', 'Coba Link Demo', {
      value: urlsInput.value,
      info: 'User memasukkan contoh link video demo scout2015'
    });
  });

  btnPasteClipboard.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlsInput.value = (urlsInput.value ? urlsInput.value + '\n' : '') + text.trim();
        lastLoggedUrlsText = urlsInput.value;
        updateInputCounter();
        const urls = parseUrlsFromInput();
        showToast('Link berhasil ditempel dari clipboard.');
        logDiscordActivity('BUTTON_CLICK', 'Tempel dari Clipboard', {
          info: `Berhasil menempel dari clipboard (${urls.length} link terdeteksi)`,
          sampleUrls: urls.slice(0, 8)
        });
      }
    } catch (err) {
      showToast('Harap izinkan akses clipboard browser ya Kacery.');
    }
  });

  // Start validation
  btnStartValidation.addEventListener('click', handleStartValidation);

  // Results controls
  filterStatus.addEventListener('change', (e) => {
    activeFilter = e.target.value;
    renderCards();
    logDiscordActivity('BUTTON_CLICK', 'Ganti Filter Status', {
      info: `Filter disetel ke: ${activeFilter}`,
      filter: activeFilter
    });
  });

  btnCopyAllReport.addEventListener('click', () => {
    copyAllReportsToClipboard();
    logDiscordActivity('BUTTON_CLICK', 'Salin Semua Laporan', {
      info: `User menyalin rangkuman ${sessionReports.length} laporan video ke clipboard`
    });
  });

  if (btnModeCards && btnModeTable) {
    btnModeCards.addEventListener('click', () => {
      currentViewMode = 'CARDS';
      btnModeCards.classList.add('active');
      btnModeTable.classList.remove('active');
      if (verticalCardsContainer) verticalCardsContainer.style.display = 'flex';
      if (infographicBoard) infographicBoard.style.display = 'none';
    });
    btnModeTable.addEventListener('click', () => {
      currentViewMode = 'TABLE';
      btnModeTable.classList.add('active');
      btnModeCards.classList.remove('active');
      if (verticalCardsContainer) verticalCardsContainer.style.display = 'none';
      if (infographicBoard) infographicBoard.style.display = 'block';
    });
  }

  btnExportCsv.addEventListener('click', () => {
    exportReportsToCsv();
    logDiscordActivity('BUTTON_CLICK', 'Ekspor CSV', {
      info: `User mengunduh rekap CSV untuk ${sessionReports.length} video`
    });
  });

  if (btnExportImage) {
    btnExportImage.addEventListener('click', () => {
      exportReportAsImage();
      logDiscordActivity('BUTTON_CLICK', 'Unduh Gambar Laporan (PNG)', {
        info: `User mengunduh gambar laporan infografis untuk ${sessionReports.length} video`
      });
    });
  }

  // Config Modal Handlers
  btnOpenConfig.addEventListener('click', () => {
    openConfigModal();
    logDiscordActivity('BUTTON_CLICK', 'Buka Pengaturan Campaign', { info: 'User membuka dialog pengaturan campaign' });
  });
  btnQuickEdit.addEventListener('click', () => {
    openConfigModal();
    logDiscordActivity('BUTTON_CLICK', 'Buka Pengaturan Campaign (Quick Edit)', { info: 'User membuka dialog pengaturan campaign dari summary strip' });
  });
  btnCloseConfig.addEventListener('click', closeConfigModal);
  btnCancelConfig.addEventListener('click', closeConfigModal);
  btnSaveConfig.addEventListener('click', saveConfigFromForm);
  btnResetConfig.addEventListener('click', resetConfigToDefault);
  btnExportConfig.addEventListener('click', exportConfigFile);
  btnImportConfig.addEventListener('click', () => fileImportConfig.click());
  fileImportConfig.addEventListener('change', importConfigFile);

  // Tag Adder Handlers
  setupTagAdders();

  // Close modals on outside backdrop click
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) closeConfigModal();
  });
  tourOverlay.addEventListener('click', (e) => {
    if (e.target === tourOverlay) closeTour();
  });

  const imageModal = document.getElementById('modal-image-preview');
  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeImagePreviewModal();
    });
    const btnCloseImg1 = document.getElementById('btn-close-image-modal');
    if (btnCloseImg1) btnCloseImg1.addEventListener('click', closeImagePreviewModal);
    const btnCloseImg2 = document.getElementById('btn-close-image-modal-2');
    if (btnCloseImg2) btnCloseImg2.addEventListener('click', closeImagePreviewModal);
  }

  // Tour Handlers
  btnStartTour.addEventListener('click', () => {
    startTour(true);
    logDiscordActivity('BUTTON_CLICK', 'Buka Panduan / Tour', { info: 'User membuka panduan penggunaan aplikasi' });
  });
  btnTourClose.addEventListener('click', closeTour);
  btnTourSkip.addEventListener('click', closeTour);
  btnTourPrev.addEventListener('click', prevTourStep);
  btnTourNext.addEventListener('click', nextTourStep);

  // Global ESC key listener to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!tourOverlay.classList.contains('is-hidden')) closeTour();
      if (!configModal.classList.contains('is-hidden')) closeConfigModal();
      const imgModal = document.getElementById('modal-image-preview');
      if (imgModal && !imgModal.classList.contains('is-hidden')) closeImagePreviewModal();
    }
  });

  // Tab Navigation Listeners
  if (tabBtnHome) tabBtnHome.addEventListener('click', () => switchTab('home'));
  if (tabBtnHistory) tabBtnHistory.addEventListener('click', () => switchTab('history'));
  if (tabBtnLicense) tabBtnLicense.addEventListener('click', () => switchTab('license'));

  // History Actions Listeners
  if (historySearchInput) {
    historySearchInput.addEventListener('input', (e) => {
      historySearchTerm = e.target.value;
      clearTimeout(historySearchDebounceTimer);
      historySearchDebounceTimer = setTimeout(() => {
        loadAndRenderHistory(historySearchTerm);
      }, 250);
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
      if (confirm('Kacery yakin ingin mengosongkan seluruh riwayat pemeriksaan video?')) {
        await clearAllHistoryBatches();
        showToast('Seluruh riwayat berhasil dibersihkan.');
        loadAndRenderHistory('');
        logDiscordActivity('BUTTON_CLICK', 'Bersihkan Seluruh Riwayat');
      }
    });
  }

  // Button Nav to Home from Empty State
  const btnNavToHome = document.querySelector('.btn-nav-to-home');
  if (btnNavToHome) {
    btnNavToHome.addEventListener('click', () => switchTab('home'));
  }

  // Auto-start tour only if never completed
  checkAutoStartTour();
}

/**
 * Auto-start tutorial on first visit
 */
function checkAutoStartTour() {
  try {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY) || sessionStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour(false);
      }, 500);
    }
  } catch (err) {
    console.warn('Storage read warning:', err);
  }
}

function startTour(isManual = false) {
  currentTourStep = 0;
  tourOverlay.classList.remove('is-hidden');
  tourOverlay.removeAttribute('hidden');
  tourOverlay.style.setProperty('display', 'flex', 'important');
  renderTourStep();
}

function closeTour() {
  tourOverlay.classList.add('is-hidden');
  tourOverlay.setAttribute('hidden', '');
  tourOverlay.style.setProperty('display', 'none', 'important');

  try {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    sessionStorage.setItem(TOUR_STORAGE_KEY, 'true');
  } catch (e) {
    console.warn('Storage save warning:', e);
  }

  showToast('Panduan selesai. Selamat bekerja Kacery!');
}

function renderTourStep() {
  const step = TOUR_STEPS[currentTourStep];
  if (!step) return;

  tourStepBadge.textContent = step.badge;
  tourTitle.textContent = step.title;
  tourDesc.textContent = step.desc;
  tourTipText.textContent = step.tip;

  btnTourPrev.style.display = currentTourStep > 0 ? 'inline-flex' : 'none';
  btnTourNext.textContent = currentTourStep === TOUR_STEPS.length - 1 ? 'Mulai Pakai' : 'Lanjut';
}

function nextTourStep() {
  if (currentTourStep < TOUR_STEPS.length - 1) {
    currentTourStep++;
    renderTourStep();
  } else {
    closeTour();
  }
}

function prevTourStep() {
  if (currentTourStep > 0) {
    currentTourStep--;
    renderTourStep();
  }
}


/**
 * Toast Notification
 */
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toastMsg.textContent = message;
  toastEl.style.display = 'block';
  toastTimeout = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 3200);
}

/**
 * Campaign Config Management
 */
function loadCampaignConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load campaign config from localStorage:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveCampaignConfig(newConfig) {
  currentConfig = { ...newConfig };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  } catch (e) {
    console.warn('Failed to save campaign config to localStorage:', e);
  }
  updateSummaryStrip();
}

function updateSummaryStrip() {
  const badgeName = document.getElementById('badge-campaign-name');
  const badgeMin = document.getElementById('badge-min-metrics');
  const badgeHash = document.getElementById('badge-hashtags');
  const badgeMent = document.getElementById('badge-mentions');
  const badgeUsers = document.getElementById('badge-usernames');

  if (badgeName) badgeName.textContent = currentConfig.name || 'Campaign Default';
  if (badgeMin) {
    badgeMin.textContent = `Followers > ${formatNum(currentConfig.minFollowers)} • Views >= ${formatNum(currentConfig.minViews)} • Likes >= ${formatNum(currentConfig.minLikes)}`;
  }
  if (badgeHash) {
    const list = currentConfig.requiredHashtags || [];
    badgeHash.textContent = list.length ? list.join(' ') : 'Tidak ada tagar wajib';
  }
  if (badgeMent) {
    const mentions = (currentConfig.requiredMentions || []).join(', ');
    badgeMent.textContent = mentions || 'Tidak ada mention wajib';
  }
  if (badgeUsers) {
    const users = (currentConfig.expectedUsernames || []).join(', ');
    badgeUsers.textContent = users || 'Semua Akun Diterima';
  }
}

/**
 * TAG ADDER COMPONENT LOGIC
 * Allows Kacery to add hashtags, mentions, brands, and usernames one by one
 */
function setupTagAdders() {
  // 1. Hashtag Adder
  const addHashtag = () => {
    let val = inputNewHashtag.value.trim();
    if (!val) return;
    if (!val.startsWith('#')) val = '#' + val;
    if (!tempHashtags.some(h => h.toLowerCase() === val.toLowerCase())) {
      tempHashtags.push(val);
      renderHashtagChips();
      logDiscordActivity('BUTTON_CLICK', 'Tambah Tagar Campaign', { value: val, info: `Menambahkan tagar: ${val}` });
    }
    inputNewHashtag.value = '';
    inputNewHashtag.focus();
  };
  btnAddHashtag.addEventListener('click', addHashtag);
  inputNewHashtag.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  });

  // 2. Mention Adder
  const addMention = () => {
    let val = inputNewMention.value.trim();
    if (!val) return;
    if (!val.startsWith('@')) val = '@' + val;
    if (!tempMentions.some(m => m.toLowerCase() === val.toLowerCase())) {
      tempMentions.push(val);
      renderMentionChips();
      logDiscordActivity('BUTTON_CLICK', 'Tambah Mention Campaign', { value: val, info: `Menambahkan mention: ${val}` });
    }
    inputNewMention.value = '';
    inputNewMention.focus();
  };
  btnAddMention.addEventListener('click', addMention);
  inputNewMention.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMention();
    }
  });

  // 3. Expected Username Adder
  const addUsername = () => {
    let val = inputNewUsername.value.trim();
    if (!val) return;
    if (val.startsWith('@')) val = val.substring(1);
    if (!tempUsernames.some(u => u.toLowerCase() === val.toLowerCase())) {
      tempUsernames.push(val);
      renderUsernameChips();
      logDiscordActivity('BUTTON_CLICK', 'Tambah Username Affiliate', { value: val, info: `Menambahkan username affiliate: ${val}` });
    }
    inputNewUsername.value = '';
    inputNewUsername.focus();
  };
  btnAddUsername.addEventListener('click', addUsername);
  inputNewUsername.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUsername();
    }
  });
}

function renderTagChipsHelper(container, list, onRemove) {
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = `<span class="field-hint" style="padding: 0.35rem 0;">Belum ada item ditambahkan.</span>`;
    return;
  }
  list.forEach((item, index) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `
      <span>${escapeHtml(item)}</span>
      <button type="button" class="tag-chip-remove" aria-label="Hapus ${escapeHtml(item)}">✕</button>
    `;
    chip.querySelector('.tag-chip-remove').addEventListener('click', () => {
      onRemove(index);
    });
    container.appendChild(chip);
  });
}

function renderHashtagChips() {
  renderTagChipsHelper(hashtagChipsContainer, tempHashtags, (index) => {
    const removed = tempHashtags.splice(index, 1)[0];
    renderHashtagChips();
    if (removed) logDiscordActivity('BUTTON_CLICK', 'Hapus Tagar Campaign', { value: removed, info: `Menghapus tagar: ${removed}` });
  });
}

function renderMentionChips() {
  renderTagChipsHelper(mentionChipsContainer, tempMentions, (index) => {
    const removed = tempMentions.splice(index, 1)[0];
    renderMentionChips();
    if (removed) logDiscordActivity('BUTTON_CLICK', 'Hapus Mention Campaign', { value: removed, info: `Menghapus mention: ${removed}` });
  });
}

function renderUsernameChips() {
  renderTagChipsHelper(usernameChipsContainer, tempUsernames, (index) => {
    const removed = tempUsernames.splice(index, 1)[0];
    renderUsernameChips();
    if (removed) logDiscordActivity('BUTTON_CLICK', 'Hapus Username Affiliate', { value: removed, info: `Menghapus username: ${removed}` });
  });
}

/**
 * Open Config Modal and populate values
 */
function openConfigModal() {
  cfgName.value = currentConfig.name || '';
  cfgFollowers.value = currentConfig.minFollowers ?? 600;
  cfgViews.value = currentConfig.minViews ?? 300;
  cfgLikes.value = currentConfig.minLikes ?? 50;

  // Load tag arrays from config
  tempHashtags = [...(currentConfig.requiredHashtags || [])];
  tempMentions = [...(currentConfig.requiredMentions || [])];
  tempUsernames = [...(currentConfig.expectedUsernames || [])];

  renderHashtagChips();
  renderMentionChips();
  renderUsernameChips();

  inputNewHashtag.value = '';
  inputNewMention.value = '';
  inputNewUsername.value = '';

  configModal.classList.remove('is-hidden');
  configModal.removeAttribute('hidden');
  configModal.style.setProperty('display', 'flex', 'important');
}

function closeConfigModal() {
  configModal.classList.add('is-hidden');
  configModal.setAttribute('hidden', '');
  configModal.style.setProperty('display', 'none', 'important');
}

/**
 * Image Preview Modal (Lightbox Zoom)
 */
function openImagePreviewModal({ src, title, seller, productUrl }) {
  const modal = document.getElementById('modal-image-preview');
  if (!modal) return;
  const imgEl = document.getElementById('modal-image-src');
  const titleEl = document.getElementById('modal-image-title');
  const sellerEl = document.getElementById('modal-image-seller');
  const linkEl = document.getElementById('modal-image-link');

  if (imgEl) {
    imgEl.src = src || '';
    imgEl.alt = title || 'Gambar Produk Keranjang Kuning';
  }
  if (titleEl) titleEl.textContent = title || 'Produk Keranjang Kuning';
  if (sellerEl) sellerEl.textContent = seller ? `🏪 ${seller}` : '🏪 Tokopedia / TikTok Shop';
  if (linkEl) {
    if (productUrl) {
      linkEl.href = productUrl;
      linkEl.style.display = 'inline-flex';
    } else {
      linkEl.style.display = 'none';
    }
  }

  modal.classList.remove('is-hidden');
  modal.removeAttribute('hidden');
  modal.style.setProperty('display', 'flex', 'important');
  logDiscordActivity('BUTTON_CLICK', 'Buka Zoom Gambar Keranjang Kuning', { title, seller });
}

function closeImagePreviewModal() {
  const modal = document.getElementById('modal-image-preview');
  if (!modal) return;
  modal.classList.add('is-hidden');
  modal.setAttribute('hidden', '');
  modal.style.setProperty('display', 'none', 'important');
}

function saveConfigFromForm() {
  const updated = {
    name: cfgName.value.trim() || 'Campaign Vape Fumakilla',
    minFollowers: parseInt(cfgFollowers.value, 10) || 0,
    minViews: parseInt(cfgViews.value, 10) || 0,
    minLikes: parseInt(cfgLikes.value, 10) || 0,
    requiredMentions: [...tempMentions],
    requiredHashtags: [...tempHashtags],
    expectedUsernames: [...tempUsernames],
  };

  saveCampaignConfig(updated);
  closeConfigModal();
  showToast('Pengaturan campaign berhasil disimpan untuk Kacery.');
  logDiscordActivity('CONFIG_UPDATE', 'Pengaturan Campaign Disimpan', updated);

  if (sessionReports.length > 0) {
    revalidateExistingReports();
  }
}

function resetConfigToDefault() {
  if (confirm('Kacery yakin ingin mengembalikan syarat campaign ke setelan awal default?')) {
    saveCampaignConfig(DEFAULT_CONFIG);
    openConfigModal();
    showToast('Syarat campaign telah direset ke default.');
    logDiscordActivity('BUTTON_CLICK', 'Reset Syarat ke Default');
  }
}

function exportConfigFile() {
  const jsonStr = JSON.stringify(currentConfig, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campaign_kacery_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('File syarat berhasil diekspor.');
  logDiscordActivity('BUTTON_CLICK', 'Ekspor File Syarat JSON');
}

function importConfigFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (typeof imported === 'object') {
        saveCampaignConfig(imported);
        openConfigModal();
        showToast('Syarat campaign berhasil diimpor.');
        logDiscordActivity('BUTTON_CLICK', 'Impor File Syarat JSON', { importedName: imported.name });
      }
    } catch (err) {
      alert('File JSON tidak valid: ' + err.message);
    }
  };
  reader.readAsText(file);
  fileImportConfig.value = '';
}

/**
 * Handle Start Validation
 */
async function handleStartValidation() {
  if (isRunning) return;

  const urls = parseUrlsFromInput();
  if (urls.length === 0) {
    showToast('Harap masukkan minimal satu link video TikTok ya Kacery.');
    return;
  }

  isRunning = true;
  btnStartValidation.disabled = true;
  btnStartText.textContent = 'Sedang Memeriksa...';
  progressContainer.style.display = 'flex';

  sessionReports = [];
  renderCards();
  updateStats();

  logDiscordActivity('VALIDATION_START', 'Mulai Validasi Video', {
    totalVideos: urls.length,
    urls: urls.slice(0, 10),
    campaignName: currentConfig.name,
    aiActive: true
  });

  let completed = 0;
  const total = urls.length;
  const results = new Array(total);
  const CONCURRENCY = 3;

  let nextUrlIndex = 0;
  const runWorker = async () => {
    while (nextUrlIndex < total) {
      const i = nextUrlIndex++;
      const url = urls[i];

      progressText.textContent = `Memeriksa ${completed + 1} dari ${total} video (Mode Cepat Paralel)...`;
      progressDetail.textContent = `Mengekstrak data dari: ${url}`;

      try {
        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            campaignConfig: currentConfig,
          }),
        });
        const data = await res.json();
        results[i] = data;
      } catch (err) {
        results[i] = {
          success: false,
          videoUrl: url,
          error: `Gagal memproses video: ${err.message}`,
          overallStatus: 'FAIL',
          overallStatusLabel: 'Belum Sesuai',
          results: [],
          summary: { total: 1, pass: 0, fail: 1, needReview: 0 }
        };
      }

      completed++;
      const percent = Math.round((completed / total) * 100);
      progressPercent.textContent = `${percent}%`;
      progressFill.style.width = `${percent}%`;

      // Update sessionReports menjaga konsistensi urutan
      sessionReports = results.filter(Boolean);
      renderCards();
      updateStats();
    }
  };

  const workerCount = Math.min(CONCURRENCY, total);
  const workers = [];
  for (let w = 0; w < workerCount; w++) {
    workers.push(runWorker());
  }
  await Promise.all(workers);

  // Done
  progressText.textContent = `Selesai! Seluruh ${completed} video sudah diperiksa.`;
  progressDetail.textContent = 'Semua data telah disajikan di bawah.';
  btnStartValidation.disabled = false;
  btnStartText.textContent = 'Periksa Video Sekarang';
  isRunning = false;

  setTimeout(() => {
    progressContainer.style.display = 'none';
  }, 2000);

  showToast(`Selesai memeriksa ${completed} video untuk Kacery.`);

  const passCount = sessionReports.filter(r => r.overallStatus === 'PASS').length;
  const failCount = sessionReports.filter(r => r.overallStatus === 'FAIL').length;
  const reviewCount = sessionReports.filter(r => r.overallStatus === 'NEED REVIEW').length;

  // Simpan otomatis ke Database Riwayat Lokal (IndexedDB)
  try {
    await saveBatchToHistory({
      campaignName: currentConfig.name,
      timestamp: Date.now(),
      summary: {
        total: sessionReports.length,
        pass: passCount,
        fail: failCount,
        needReview: reviewCount
      },
      reports: sessionReports
    });
  } catch (err) {
    console.warn('Gagal menyimpan otomatis ke riwayat:', err);
  }

  logDiscordActivity('VALIDATION_FINISH', 'Validasi Video Selesai', {
    campaignName: currentConfig.name,
    summary: {
      total: sessionReports.length,
      pass: passCount,
      fail: failCount,
      needReview: reviewCount
    },
    videoResults: sessionReports.map(r => ({
      username: r.author?.username || 'unknown',
      status: r.overallStatus,
      statusLabel: r.overallStatusLabel,
      views: r.stats?.views,
      failedReasons: (r.results || []).filter(c => c.status === 'FAIL').map(c => c.name)
    })),
    aiSummary: sessionReports.some(r => r.aiAnalysis?.available)
      ? `${sessionReports.filter(r => r.aiAnalysis?.available).length} video berhasil diverifikasi AI Jorje.`
      : null
  });
}

/**
 * Update Stats Bar
 */
function updateStats() {
  const total = sessionReports.length;
  const pass = sessionReports.filter(r => r.overallStatus === 'PASS').length;
  const fail = sessionReports.filter(r => r.overallStatus === 'FAIL').length;
  const review = sessionReports.filter(r => r.overallStatus === 'NEED REVIEW').length;

  statTotal.textContent = total;
  statPass.textContent = pass;
  statFail.textContent = fail;
  statReview.textContent = review;

  if (total > 0) {
    emptyState.style.display = 'none';
    resultsSection.style.display = 'flex';
  } else {
    emptyState.style.display = 'flex';
    resultsSection.style.display = 'none';
  }
}

/**
 * Render Video Result Rows in Table (Visual Infographic View)
 */
function renderCards() {
  if (videoCardsList) videoCardsList.innerHTML = '';
  if (verticalCardsContainer) verticalCardsContainer.innerHTML = '';

  if (boardCampaignInfo) {
    boardCampaignInfo.textContent = `Campaign: ${currentConfig.name || 'Default'} • Khusus Kacery`;
  }
  if (boardReportDate) {
    try {
      const now = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta'
      }).format(new Date());
      boardReportDate.textContent = `${now} WIB`;
    } catch (e) {
      boardReportDate.textContent = 'WIB';
    }
  }

  const filtered = sessionReports.filter(report => {
    if (activeFilter === 'ALL') return true;
    return report.overallStatus === activeFilter;
  });

  if (filtered.length === 0 && sessionReports.length > 0) {
    if (videoCardsList) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="8" class="empty-table-cell"><p class="empty-paragraph">Tidak ada video dengan filter yang dipilih.</p></td>`;
      videoCardsList.appendChild(emptyRow);
    }
    if (verticalCardsContainer) {
      verticalCardsContainer.innerHTML = `<div class="card" style="text-align:center; padding: 2rem;"><p class="empty-paragraph">Tidak ada video dengan filter yang dipilih.</p></div>`;
    }
    return;
  }

  filtered.forEach((report, index) => {
    if (videoCardsList) {
      const [mainRow, detailRow] = createVideoTableRows(report, index);
      videoCardsList.appendChild(mainRow);
      videoCardsList.appendChild(detailRow);
    }
    if (verticalCardsContainer) {
      const vcard = createVerticalCard(report, index);
      verticalCardsContainer.appendChild(vcard);
    }
  });
}

function getFriendlyStatusLabel(status) {
  if (status === 'PASS') return 'Sudah Sesuai';
  if (status === 'FAIL') return 'Belum Sesuai';
  return 'Perlu Cek Manual';
}

/**
 * Create DOM Elements for a Visual Table Row and its Expandable Detail Row
 */
function createVideoTableRows(report, index) {
  const author = report.author || {};
  const stats = report.stats || {};
  const er = report.engagementRate || {};
  const username = author.username || 'Tidak diketahui';
  const videoUrl = report.videoUrl || '';
  const statusKey = (report.overallStatus || 'fail').toLowerCase().replace(/\s+/g, '-');
  const statusLabel = report.overallStatusLabel || getFriendlyStatusLabel(report.overallStatus);
  const results = report.results || [];

  // Metrics Evaluation
  const viewsTarget = currentConfig.minViews ?? 0;
  const likesTarget = currentConfig.minLikes ?? 0;
  const followersTarget = currentConfig.minFollowers ?? 0;

  let viewsHtml = '<span class="text-muted">-</span>';
  let likesHtml = '<span class="text-muted">-</span>';
  let followersHtml = '<span class="text-muted">-</span>';

  if (report.success !== false) {
    const viewsOk = (stats.views ?? 0) >= viewsTarget;
    viewsHtml = viewsOk
      ? `<span class="tbl-metric metric-ok">${formatNum(stats.views)}</span>`
      : `<span class="tbl-metric metric-fail" title="Kurang dari target minimal ${formatNum(viewsTarget)}">${formatNum(stats.views)} ⚠️</span>`;

    const likesOk = (stats.likes ?? 0) >= likesTarget;
    likesHtml = likesOk
      ? `<span class="tbl-metric metric-ok">${formatNum(stats.likes)}</span>`
      : `<span class="tbl-metric metric-fail" title="Kurang dari target minimal ${formatNum(likesTarget)}">${formatNum(stats.likes)} ⚠️</span>`;

    const followersOk = (author.followerCount ?? 0) >= followersTarget;
    followersHtml = followersOk
      ? `<span class="tbl-metric metric-ok">${formatNum(author.followerCount)}</span>`
      : `<span class="tbl-metric metric-fail" title="Kurang dari target minimal ${formatNum(followersTarget)}">${formatNum(author.followerCount)} ⚠️</span>`;
  }

  // Tagar, Mention & Keranjang Kuning Evaluation
  let tagBadges = [];
  if (report.success === false) {
    tagBadges.push(`<span class="badge-tag-fail" title="Gagal mengekstrak video">❌ Gagal Ambil Data</span>`);
  } else {
    const hashtagCheck = results.find(r => r.id === 'hashtags' || (r.name && r.name.toLowerCase().includes('hashtag')));
    const mentionCheck = results.find(r => r.id === 'mentions' || (r.name && r.name.toLowerCase().includes('mention')));
    const missingTags = hashtagCheck?.missing || [];
    const missingMentions = mentionCheck?.missing || [];

    if (missingTags.length > 0) {
      tagBadges.push(`<span class="badge-tag-fail" title="Tagar wajib tidak ditemukan">❌ Kurang: ${escapeHtml(missingTags.join(' '))}</span>`);
    } else if ((currentConfig.requiredHashtags || []).length > 0) {
      tagBadges.push(`<span class="badge-tag-pass">✅ Tagar Lengkap</span>`);
    }

    if (missingMentions.length > 0) {
      tagBadges.push(`<span class="badge-tag-fail" title="Mention wajib tidak ditemukan">❌ Kurang Mention</span>`);
    } else if ((currentConfig.requiredMentions || []).length > 0) {
      tagBadges.push(`<span class="badge-tag-pass">✅ Mention Ada</span>`);
    }

    // Badge Keranjang Kuning (TikTok Shop)
    const yCart = report.yellowCart || {};
    if (yCart.hasCart) {
      const shortTitle = yCart.name ? (yCart.name.length > 20 ? yCart.name.slice(0, 20) + '...' : yCart.name) : 'Keranjang Ada';
      tagBadges.push(`<span class="badge-cart-tag pass" title="Keranjang Kuning: ${escapeHtml(yCart.name || 'Produk TikTok Shop')}"><span class="cart-mini-icon">🛒</span> <span>${escapeHtml(shortTitle)}</span></span>`);
    } else {
      tagBadges.push(`<span class="badge-cart-tag none" title="Tidak ada keranjang kuning produk"><span class="cart-mini-icon">🛒</span> <span>Tanpa Keranjang</span></span>`);
    }

    if (tagBadges.length === 0) {
      tagBadges.push(`<span class="text-muted" style="font-size:0.75rem;">-</span>`);
    }
  }

  // 1. Create Main Row (<tr>) with Video Cover Thumbnail
  const mainRow = document.createElement('tr');
  mainRow.className = `tbl-row-main row-status-${statusKey}`;
  mainRow.setAttribute('data-index', index);

  mainRow.innerHTML = `
    <td class="td-num">${index + 1}</td>
    <td class="td-status">
      <span class="status-pill ${statusKey}">${escapeHtml(statusLabel)}</span>
      ${(report.overallStatus === 'FAIL' && report.failedReasonsSummary) ? `<span class="status-fail-reason" title="${escapeHtml(report.failedReasonsSummary)}">${escapeHtml(report.failedReasonsSummary)}</span>` : ''}
    </td>
    <td class="td-video">
      <div class="video-cell-card">
        <div class="video-cover-mini-wrap" title="Klik baris untuk lihat preview video & audio">
          ${report.media?.coverUrl ? `<img src="${escapeHtml(report.media.coverUrl)}" alt="Cover" class="video-cover-mini-img" loading="lazy" onerror="this.src='/icons/kacery-logo.png'">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:16px;">🎬</div>`}
          <span class="video-play-tag">▶</span>
        </div>
        <div class="video-meta-block">
          <div class="video-creator-row">
            <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="video-creator-link" title="Buka video di TikTok" onclick="event.stopPropagation()">@${escapeHtml(username)}</a>
          </div>
          <span class="video-creator-nickname">${escapeHtml(author.nickname || '')}</span>
          ${report.caption ? `<span class="video-caption-teaser" title="${escapeHtml(report.caption)}">${escapeHtml(report.caption)}</span>` : ''}
        </div>
      </div>
    </td>
    <td class="td-metric">${viewsHtml}</td>
    <td class="td-metric">${likesHtml}</td>
    <td class="td-metric">${followersHtml}</td>
    <td class="td-tags">
      <div class="tags-cell-wrapper">
        ${tagBadges.join('')}
      </div>
    </td>
    <td class="td-actions">
      <div class="tbl-actions-group">
        <button type="button" class="btn-tbl-action btn-copy-row" title="Salin format laporan WhatsApp" data-index="${index}" onclick="event.stopPropagation()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-tbl-action" title="Buka TikTok asli" onclick="event.stopPropagation()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
        <button type="button" class="btn-tbl-action btn-toggle-detail" title="Buka detail caption, audio & video" data-index="${index}" onclick="event.stopPropagation()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </td>
  `;

  // 2. Create Detail Row (<tr>)
  const detailRow = document.createElement('tr');
  detailRow.className = 'tbl-row-detail is-hidden';
  detailRow.id = `detail-row-${index}`;

  // Highlighted Caption
  const highlightedCaption = highlightCaption(report.caption || '');

  // Gemini AI Analysis Banner
  let geminiBanner = '';
  if (report.aiAnalysis && report.aiAnalysis.available) {
    const ai = report.aiAnalysis;
    geminiBanner = `
      <div class="gemini-analysis-badge">
        <div class="gemini-badge-header">
          <span>🤖 Analisis Jorje</span>
          <span class="gemini-score">Akurasi: ${ai.confidenceScore || 95}%</span>
        </div>
        <p class="gemini-summary-text">${escapeHtml(ai.summary || '')}</p>
      </div>
    `;
  }

  // Video & Audio streams (strictly authentic video stream or resilient fallback)
  const videoSrc = report.media?.videoUrl || '';
  const audioSrc = report.media?.audioUrl || report.media?.videoUrl || report.media?.bgmUrl || '';

  // Dual Media: Audio MP3 Card + Video Player Card + Direct TikTok Button
  const mediaBlock = `
    <div class="media-preview-block">
      <!-- 1. Pemutar Audio Asli (Suara Kreator) -->
      ${audioSrc ? `
        <div class="media-audio-card">
          <div class="media-audio-header">
            <div class="audio-title-group">
              <span class="audio-icon-badge">🎙️</span>
              <div>
                <div class="audio-card-title">Pemutar Audio Asli Video</div>
                <div class="audio-card-desc">Suara murni kreator & video (cepat & hemat kuota)</div>
              </div>
            </div>
          </div>
          <audio controls preload="none" class="kacery-audio-player">
            <source src="/api/stream-audio?url=${encodeURIComponent(audioSrc)}" type="audio/mpeg">
            <source src="/api/proxy-video?url=${encodeURIComponent(audioSrc)}" type="video/mp4">
            <source src="${escapeHtml(audioSrc)}" type="video/mp4">
            Browser tidak mendukung pemutar audio ini.
          </audio>
        </div>
      ` : ''}

      <!-- 2. Pemutar Video Langsung di Web -->
      ${videoSrc ? `
        <div class="media-video-card">
          <div class="video-card-title">
            <span>🎬 Tonton Video Langsung di Web</span>
          </div>
          <div class="video-frame-container">
            <video controls preload="metadata" playsinline poster="${escapeHtml(report.media?.coverUrl || '')}">
              <source src="/api/proxy-video?url=${encodeURIComponent(videoSrc)}" type="video/mp4">
              <source src="${escapeHtml(videoSrc)}" type="video/mp4">
              Video tidak dapat diputar langsung di browser ini.
            </video>
          </div>
        </div>
      ` : ''}

      <!-- 3. Direct Link ke Aplikasi TikTok -->
      <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-direct-tiktok" title="Buka langsung di aplikasi TikTok" onclick="event.stopPropagation()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.67 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.33V9.22a8.21 8.21 0 0 0 4.91 1.63V7.4a4.83 4.83 0 0 1-1-.71z"/>
        </svg>
        <span>Buka di Aplikasi TikTok ↗</span>
      </a>
    </div>
  `;

  const rawCaption = report.caption || '';
  const detectedHashtags = Array.isArray(report.detectedHashtags) ? report.detectedHashtags : [];
  const detectedMentions = Array.isArray(report.detectedMentions) ? report.detectedMentions : [];

  const yellowCart = report.yellowCart || {};
  const hasCart = yellowCart.hasCart === true;
  const resolvedCover = yellowCart.proxyCoverUrl || (yellowCart.coverUrl ? `/api/proxy-image?url=${encodeURIComponent(yellowCart.coverUrl)}` : '');
  const rawCover = yellowCart.coverUrl || '';

  const cartBlockHtml = `
    <div class="yellow-cart-card ${hasCart ? '' : 'empty-cart'}" onclick="event.stopPropagation()">
      <div class="yellow-cart-header">
        <div class="yellow-cart-title-wrap">
          <span>🛒</span>
          <span>Keranjang Kuning (TikTok Shop / Tokopedia)</span>
        </div>
        <span class="yellow-cart-badge-status ${hasCart ? 'pass' : 'none'}">
          ${hasCart ? '✓ Tersemat di Video' : '✕ Tidak Ada Keranjang'}
        </span>
      </div>
      ${hasCart ? `
        <div class="yellow-cart-body">
          <div class="yellow-cart-thumb-wrap"
               role="button"
               tabindex="0"
               aria-label="Lihat gambar produk"
               title="Klik untuk memperbesar gambar produk"
               data-img="${escapeHtml(resolvedCover || rawCover)}"
               data-orig-img="${escapeHtml(rawCover)}"
               data-name="${escapeHtml(yellowCart.name || 'Produk TikTok Shop')}"
               data-seller="${escapeHtml(yellowCart.seller || 'Tokopedia / TikTok Shop')}"
               data-url="${escapeHtml(yellowCart.productUrl || '')}">
            ${(resolvedCover || rawCover) ? `
              <img src="${escapeHtml(resolvedCover || rawCover)}" 
                   alt="${escapeHtml(yellowCart.name || 'Produk')}" 
                   class="yellow-cart-thumb-img" 
                   loading="lazy" 
                   onerror="if(!this.dataset.retried && '${escapeHtml(rawCover)}'){this.dataset.retried='1';this.src='/api/proxy-image?url='+encodeURIComponent('${escapeHtml(rawCover)}');}else{this.parentElement.innerHTML='<span style=\\'font-size:24px;\\'>🛍️</span>';}">
            ` : `<span style="font-size:24px;">🛍️</span>`}
          </div>
          <div class="yellow-cart-info-col">
            <div class="yellow-cart-product-name">${escapeHtml(yellowCart.name || 'Produk TikTok Shop')}</div>
            <div class="yellow-cart-seller">
              <span>🏪</span>
              <span>${escapeHtml(yellowCart.seller || 'Tokopedia / TikTok Shop')}</span>
              ${yellowCart.productId ? `<span style="opacity:0.65;font-size:0.7rem;">(ID: ${escapeHtml(yellowCart.productId)})</span>` : ''}
            </div>
            ${yellowCart.productUrl ? `
              <a href="${escapeHtml(yellowCart.productUrl)}" target="_blank" rel="noopener noreferrer" class="btn-open-shop">
                <span>Lihat Produk di Shop</span>
                <span>↗</span>
              </a>
            ` : ''}
          </div>
        </div>
      ` : `
        <p class="yellow-cart-empty-text">Video ini tidak menyematkan keranjang kuning produk TikTok Shop / Tokopedia.</p>
      `}
    </div>
  `;

  const chipsHtml = (detectedHashtags.length > 0 || detectedMentions.length > 0) ? `
    <div class="caption-chips-section" onclick="event.stopPropagation()">
      <span class="caption-chips-label">📌 Salin Cepat Tagar & Mention (Klik chip untuk salin):</span>
      <div class="caption-chips-row">
        ${detectedHashtags.map(tag => {
          const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
          return `
            <button type="button" class="btn-copy-chip" data-copy="${escapeHtml(formattedTag)}" title="Klik untuk salin ${escapeHtml(formattedTag)}">
              <span>${escapeHtml(formattedTag)}</span>
              <span class="chip-copy-icon">📋</span>
            </button>
          `;
        }).join('')}
        ${detectedMentions.map(men => {
          const formattedMention = men.startsWith('@') ? men : `@${men}`;
          return `
            <button type="button" class="btn-copy-chip btn-copy-chip-mention" data-copy="${escapeHtml(formattedMention)}" title="Klik untuk salin ${escapeHtml(formattedMention)}">
              <span>${escapeHtml(formattedMention)}</span>
              <span class="chip-copy-icon">📋</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  detailRow.innerHTML = `
    <td colspan="8" style="padding: 0;">
      <div class="detail-sub-wrapper">
        <div class="detail-left-col">
          <div class="caption-card-block">
            <div class="caption-header-row">
              <span class="caption-block-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Caption Video Lengkap (Sebelum & Sesudah Tagar)
              </span>
              ${rawCaption ? `
                <button type="button" class="btn-copy-full-caption" title="Salin seluruh isi teks caption video ini">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Salin Seluruh Caption</span>
                </button>
              ` : ''}
            </div>
            <div class="caption-content" onclick="event.stopPropagation()">${highlightedCaption || (report.error ? `<span class="text-danger">${escapeHtml(report.error)}</span>` : '<em class="text-muted">(Tidak ada caption)</em>')}</div>
            ${chipsHtml}
          </div>
          ${cartBlockHtml}
          ${report.success !== false ? `
            <div class="metrics-strip-sub" style="justify-content: flex-start; padding: 0.5rem 0;">
              <span>Komentar: <strong>${formatNum(stats.comments)}</strong></span>
              <span>•</span>
              <span>Share: <strong>${formatNum(stats.shares)}</strong></span>
              <span>•</span>
              <span>Saves: <strong>${formatNum(stats.saves)}</strong></span>
            </div>
          ` : ''}
          ${geminiBanner}
        </div>
        <div class="detail-right-col">
          ${mediaBlock}
        </div>
      </div>
    </td>
  `;

  // Toggle detail handler
  const toggleBtn = mainRow.querySelector('.btn-toggle-detail');
  const toggleDetail = () => {
    const isHidden = detailRow.classList.toggle('is-hidden');
    mainRow.classList.toggle('is-expanded', !isHidden);
    toggleBtn.classList.toggle('is-expanded', !isHidden);
  };

  mainRow.addEventListener('click', toggleDetail);
  toggleBtn.addEventListener('click', toggleDetail);

  // Copy listener baris
  const copyBtn = mainRow.querySelector('.btn-copy-row');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copySingleReport(report));
  }

  // Listener Salin Seluruh Caption
  const copyFullCaptionBtn = detailRow.querySelector('.btn-copy-full-caption');
  if (copyFullCaptionBtn) {
    copyFullCaptionBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(rawCaption);
        const originalHtml = copyFullCaptionBtn.innerHTML;
        copyFullCaptionBtn.innerHTML = `✓ <span>Tersalin!</span>`;
        copyFullCaptionBtn.style.backgroundColor = '#10b981';
        copyFullCaptionBtn.style.color = '#ffffff';
        copyFullCaptionBtn.style.borderColor = '#10b981';
        showToast('Caption lengkap video berhasil disalin!');
        setTimeout(() => {
          copyFullCaptionBtn.innerHTML = originalHtml;
          copyFullCaptionBtn.style.backgroundColor = '';
          copyFullCaptionBtn.style.color = '';
          copyFullCaptionBtn.style.borderColor = '';
        }, 1800);
      } catch (err) {
        showToast('Gagal menyalin caption.');
      }
    });
  }

  // Listener Salin Cepat Chip Tagar, Mention & Kata yang bertanda data-copy
  detailRow.querySelectorAll('[data-copy]').forEach((elem) => {
    elem.addEventListener('click', async (e) => {
      e.stopPropagation();
      const textToCopy = elem.getAttribute('data-copy');
      if (!textToCopy) return;
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast(`Tersalin: "${textToCopy}"`);
        const origOpacity = elem.style.opacity;
        elem.style.transform = 'scale(0.95)';
        elem.style.opacity = '0.6';
        setTimeout(() => {
          elem.style.transform = '';
          elem.style.opacity = origOpacity;
        }, 200);
      } catch (err) {
        showToast('Gagal menyalin teks.');
      }
    });
  });

  // Listener Zoom Gambar Keranjang Kuning (Lightbox Modal)
  const thumbWrap = detailRow.querySelector('.yellow-cart-thumb-wrap');
  if (thumbWrap) {
    const handleZoom = (e) => {
      e.stopPropagation();
      const src = thumbWrap.getAttribute('data-img') || '';
      const title = thumbWrap.getAttribute('data-name') || '';
      const seller = thumbWrap.getAttribute('data-seller') || '';
      const productUrl = thumbWrap.getAttribute('data-url') || '';
      if (src) {
        openImagePreviewModal({ src, title, seller, productUrl });
      }
    };
    thumbWrap.addEventListener('click', handleZoom);
    thumbWrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleZoom(e);
      }
    });
  }

  return [mainRow, detailRow];
}

/**
 * Create Full Vertical Detail Card for Video (Flowing downwards, zero horizontal scroll!)
 */
function createVerticalCard(report, index) {
  const author = report.author || {};
  const stats = report.stats || {};
  const er = report.engagementRate || {};
  const username = author.username || 'Tidak diketahui';
  const videoUrl = report.videoUrl || '';
  const statusKey = (report.overallStatus || 'fail').toLowerCase().replace(/\s+/g, '-');
  const statusLabel = report.overallStatusLabel || getFriendlyStatusLabel(report.overallStatus);
  const results = report.results || [];

  const viewsTarget = currentConfig.minViews ?? 0;
  const likesTarget = currentConfig.minLikes ?? 0;
  const followersTarget = currentConfig.minFollowers ?? 0;

  const viewsOk = (stats.views ?? 0) >= viewsTarget;
  const likesOk = (stats.likes ?? 0) >= likesTarget;
  const followersOk = (author.followerCount ?? 0) >= followersTarget;

  const failedReasons = report.failedReasonsSummary || '';
  const yellowCart = report.yellowCart || {};
  const hasCart = yellowCart.hasCart === true;
  const resolvedCover = yellowCart.proxyCoverUrl || (yellowCart.coverUrl ? `/api/proxy-image?url=${encodeURIComponent(yellowCart.coverUrl)}` : '');
  const rawCover = yellowCart.coverUrl || '';

  const detectedHashtags = Array.isArray(report.detectedHashtags) ? report.detectedHashtags : [];
  const detectedMentions = Array.isArray(report.detectedMentions) ? report.detectedMentions : [];
  const rawCaption = report.caption || '';
  const highlightedCaption = highlightCaption(rawCaption);

  let statusIcon = '❌';
  if (report.overallStatus === 'PASS') statusIcon = '✅';
  else if (report.overallStatus === 'NEED REVIEW') statusIcon = '⚠️';

  const card = document.createElement('div');
  card.className = `vertical-video-card status-${statusKey}`;
  card.id = `vcard-${index}`;

  card.innerHTML = `
    <!-- 1. Header Row -->
    <div class="vcard-header">
      <div class="vcard-creator-block">
        <span class="vcard-index-badge">#${index + 1}</span>
        <div class="vcard-creator-details">
          <div class="vcard-creator-name-row">
            <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="vcard-username">@${escapeHtml(username)}</a>
            ${author.isVerified ? '<span class="vcard-verified-badge" title="Akun Terverifikasi">✓</span>' : ''}
          </div>
          <span class="vcard-meta-text">ID: ${escapeHtml(report.videoId || '-')} ${author.nickname ? '• ' + escapeHtml(author.nickname) : ''}</span>
        </div>
      </div>
      <div class="vcard-status-block">
        <span class="status-pill ${statusKey}">
          <span class="pill-icon">${statusIcon}</span>
          <span>${escapeHtml(statusLabel)}</span>
        </span>
        ${failedReasons ? `<span class="vcard-fail-reason">${escapeHtml(failedReasons)}</span>` : ''}
      </div>
    </div>

    <!-- 2. Metrics Grid (Zero horizontal scroll!) -->
    <div class="vcard-metrics-grid">
      <div class="vcard-metric-box ${viewsOk ? 'metric-pass' : 'metric-fail'}">
        <span class="vcard-metric-label">Views</span>
        <strong class="vcard-metric-val">${formatNum(stats.views)}</strong>
        <span class="vcard-metric-sub">Min: ${formatNum(viewsTarget)} ${viewsOk ? '✅' : '⚠️'}</span>
      </div>
      <div class="vcard-metric-box ${likesOk ? 'metric-pass' : 'metric-fail'}">
        <span class="vcard-metric-label">Likes</span>
        <strong class="vcard-metric-val">${formatNum(stats.likes)}</strong>
        <span class="vcard-metric-sub">Min: ${formatNum(likesTarget)} ${likesOk ? '✅' : '⚠️'}</span>
      </div>
      <div class="vcard-metric-box ${followersOk ? 'metric-pass' : 'metric-fail'}">
        <span class="vcard-metric-label">Followers</span>
        <strong class="vcard-metric-val">${formatNum(author.followerCount)}</strong>
        <span class="vcard-metric-sub">Min: ${formatNum(followersTarget)} ${followersOk ? '✅' : '⚠️'}</span>
      </div>
      <div class="vcard-metric-box">
        <span class="vcard-metric-label">Komentar</span>
        <strong class="vcard-metric-val">${formatNum(stats.comments)}</strong>
        <span class="vcard-metric-sub">Interaksi</span>
      </div>
      <div class="vcard-metric-box">
        <span class="vcard-metric-label">Share</span>
        <strong class="vcard-metric-val">${formatNum(stats.shares)}</strong>
        <span class="vcard-metric-sub">Diteruskan</span>
      </div>
    </div>

    <!-- 3. Keranjang Kuning (TikTok Shop / Tokopedia) -->
    <div class="yellow-cart-card ${hasCart ? '' : 'empty-cart'}">
      <div class="yellow-cart-header">
        <div class="yellow-cart-title-wrap">
          <span>🛒</span>
          <span>Keranjang Kuning (TikTok Shop / Tokopedia)</span>
        </div>
        <span class="yellow-cart-badge-status ${hasCart ? 'pass' : 'none'}">
          ${hasCart ? '✓ Tersemat di Video' : '✕ Tidak Ada Keranjang'}
        </span>
      </div>
      ${hasCart ? `
        <div class="yellow-cart-body">
          <div class="yellow-cart-thumb-wrap"
               role="button"
               tabindex="0"
               aria-label="Lihat gambar produk"
               title="Klik untuk memperbesar gambar produk"
               data-img="${escapeHtml(resolvedCover || rawCover)}"
               data-orig-img="${escapeHtml(rawCover)}"
               data-name="${escapeHtml(yellowCart.name || 'Produk TikTok Shop')}"
               data-seller="${escapeHtml(yellowCart.seller || 'Tokopedia / TikTok Shop')}"
               data-url="${escapeHtml(yellowCart.productUrl || '')}">
            ${(resolvedCover || rawCover) ? `
              <img src="${escapeHtml(resolvedCover || rawCover)}" 
                   alt="${escapeHtml(yellowCart.name || 'Produk')}" 
                   class="yellow-cart-thumb-img" 
                   loading="lazy" 
                   onerror="if(!this.dataset.retried && '${escapeHtml(rawCover)}'){this.dataset.retried='1';this.src='/api/proxy-image?url='+encodeURIComponent('${escapeHtml(rawCover)}');}else{this.parentElement.innerHTML='<span style=\\'font-size:24px;\\'>🛍️</span>';}">
            ` : `<span style="font-size:24px;">🛍️</span>`}
          </div>
          <div class="yellow-cart-info-col">
            <div class="yellow-cart-product-name">${escapeHtml(yellowCart.name || 'Produk TikTok Shop')}</div>
            <div class="yellow-cart-seller">
              <span>🏪</span>
              <span>${escapeHtml(yellowCart.seller || 'Tokopedia / TikTok Shop')}</span>
              ${yellowCart.productId ? `<span style="opacity:0.65;font-size:0.7rem;">(ID: ${escapeHtml(yellowCart.productId)})</span>` : ''}
            </div>
            ${yellowCart.productUrl ? `
              <a href="${escapeHtml(yellowCart.productUrl)}" target="_blank" rel="noopener noreferrer" class="btn-open-shop">
                <span>Lihat Produk di Shop</span>
                <span>↗</span>
              </a>
            ` : ''}
          </div>
        </div>
      ` : `
        <p class="yellow-cart-empty-text">Video ini tidak menyematkan keranjang kuning produk TikTok Shop / Tokopedia.</p>
      `}
    </div>

    <!-- 4. Checklist Kriteria Validasi -->
    <div class="vcard-checklist-section">
      <div class="vcard-section-label">📋 Rincian Evaluasi Syarat:</div>
      <div class="vcard-checklist-grid">
        ${results.map(r => {
          const pass = r.status === 'PASS';
          const review = r.status === 'NEED REVIEW';
          const icon = pass ? '✅' : (review ? '⚠️' : '❌');
          const badgeClass = pass ? 'pass' : (review ? 'need-review' : 'fail');
          return `
            <div class="vcard-check-item ${badgeClass}">
              <div class="vcard-check-top">
                <span class="vcard-check-name">${icon} ${escapeHtml(r.name || '')}</span>
                <span class="status-pill ${badgeClass} vcard-pill-mini">${escapeHtml(r.statusLabel || r.status)}</span>
              </div>
              <div class="vcard-check-evidence">${escapeHtml(r.evidence || '')}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 5. Caption & Salin Cepat Tagar/Mention -->
    <div class="caption-card-block">
      <div class="caption-header-row">
        <span class="caption-block-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Caption Video Lengkap
        </span>
        ${rawCaption ? `
          <button type="button" class="btn-copy-full-caption" title="Salin seluruh isi teks caption video ini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Salin Caption</span>
          </button>
        ` : ''}
      </div>
      <div class="caption-content">${highlightedCaption || '<em class="text-muted">Tidak ada caption tertulis pada video ini.</em>'}</div>
      ${(detectedHashtags.length > 0 || detectedMentions.length > 0) ? `
        <div class="caption-chips-section">
          <span class="caption-chips-label">📌 Salin Cepat Tagar & Mention (Klik chip untuk salin):</span>
          <div class="caption-chips-row">
            ${detectedHashtags.map(tag => {
              const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
              return `
                <button type="button" class="btn-copy-chip" data-copy="${escapeHtml(formattedTag)}" title="Klik untuk salin ${escapeHtml(formattedTag)}">
                  <span>${escapeHtml(formattedTag)}</span>
                  <span class="chip-copy-icon">📋</span>
                </button>
              `;
            }).join('')}
            ${detectedMentions.map(men => {
              const formattedMention = men.startsWith('@') ? men : `@${men}`;
              return `
                <button type="button" class="btn-copy-chip btn-copy-chip-mention" data-copy="${escapeHtml(formattedMention)}" title="Klik untuk salin ${escapeHtml(formattedMention)}">
                  <span>${escapeHtml(formattedMention)}</span>
                  <span class="chip-copy-icon">📋</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 6. Media Section (Suara Asli Kreator & Video Langsung) -->
    ${(report.media?.videoUrl || report.media?.audioUrl) ? `
      <div class="vcard-section vcard-media-section">
        <div class="vcard-audio-label">🎙️ Suara Asli & Video Kreator:</div>
        
        <!-- Pemutar Audio Murni (Hemat Kuota & Cepat) -->
        <div class="vcard-audio-box">
          <div class="vcard-audio-subtext">🎵 Putar suara murni video (omongan kreator):</div>
          <audio controls preload="none" class="kacery-audio-player">
            <source src="/api/stream-audio?url=${encodeURIComponent(report.media.audioUrl || report.media.videoUrl)}" type="audio/mpeg">
            <source src="/api/proxy-video?url=${encodeURIComponent(report.media.audioUrl || report.media.videoUrl)}" type="video/mp4">
            <source src="${escapeHtml(report.media.audioUrl || report.media.videoUrl)}" type="video/mp4">
            Browser tidak mendukung pemutar audio ini.
          </audio>
        </div>

        <!-- Pemutar Video Langsung di Web -->
        ${report.media?.videoUrl ? `
          <div class="vcard-video-box">
            <details class="vcard-video-details" open>
              <summary class="vcard-video-summary">
                <span>🎬 Tonton Video Langsung di Web (Visual + Suara)</span>
                <span class="vcard-video-toggle-icon">▼</span>
              </summary>
              <div class="vcard-video-player-wrap">
                <video controls preload="metadata" playsinline poster="${escapeHtml(report.media?.coverUrl || '')}" class="vcard-video-player">
                  <source src="/api/proxy-video?url=${encodeURIComponent(report.media.videoUrl)}" type="video/mp4">
                  <source src="${escapeHtml(report.media.videoUrl)}" type="video/mp4">
                  Browser tidak mendukung pemutar video ini.
                </video>
              </div>
            </details>
          </div>
        ` : `
          <div class="vcard-video-box">
            <div class="video-notice-box" style="padding: 0.6rem 0.85rem; background: #fff0f5; border: 1.5px dashed #000; border-radius: 6px; font-size: 0.8rem; color: #4b5563;">
              <span>ℹ️ Visual video sedang di-streaming melalui audio di atas. Klik tombol merah di bawah untuk membuka video lengkap di aplikasi TikTok.</span>
            </div>
          </div>
        `}
      </div>
    ` : ''}

    <!-- 7. Action Footer -->
    <div class="vcard-footer">
      <button type="button" class="btn-secondary-action btn-copy-single" data-index="${index}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Salin Hasil Video Ini</span>
      </button>
      <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary-action btn-sm-action">
        <span>Buka di TikTok ↗</span>
      </a>
    </div>
  `;

  // Event handlers
  const copyBtn = card.querySelector('.btn-copy-single');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copySingleReport(index));
  }

  const copyCaptionBtn = card.querySelector('.btn-copy-full-caption');
  if (copyCaptionBtn && rawCaption) {
    copyCaptionBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(rawCaption).then(() => {
        showToast('Caption berhasil disalin ke clipboard!');
      }).catch(() => {
        showToast('Gagal menyalin caption.');
      });
    });
  }

  const chipButtons = card.querySelectorAll('.btn-copy-chip');
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Berhasil salin: ${textToCopy}`);
        }).catch(() => {
          showToast(`Gagal menyalin: ${textToCopy}`);
        });
      }
    });
  });

  const thumbWrap = card.querySelector('.yellow-cart-thumb-wrap');
  if (thumbWrap) {
    const handleZoom = () => {
      const src = thumbWrap.getAttribute('data-img') || thumbWrap.getAttribute('data-orig-img');
      const title = thumbWrap.getAttribute('data-name') || 'Produk TikTok Shop';
      const seller = thumbWrap.getAttribute('data-seller') || 'Tokopedia / TikTok Shop';
      const productUrl = thumbWrap.getAttribute('data-url') || '';
      if (src) {
        openImagePreviewModal({ src, title, seller, productUrl });
      }
    };
    thumbWrap.addEventListener('click', handleZoom);
  }

  return card;
}

/**
 * Highlight Mentions (@) and Hashtags (#) while keeping 100% of the raw caption text intact
 * Also makes each mention & hashtag clickable for instant copy
 */
function highlightCaption(caption) {
  if (!caption) return '';

  let html = escapeHtml(caption);

  // Highlight @mentions (clickable copy)
  html = html.replace(/@[\p{L}\p{N}._]+/gu, (match) => {
    return `<span class="highlight-mention chip-clickable" data-copy="${match}" title="Klik untuk salin ${match}">${match}</span>`;
  });

  // Highlight #hashtags (clickable copy)
  html = html.replace(/#[\p{L}\p{N}_]+/gu, (match) => {
    return `<span class="highlight-hashtag chip-clickable" data-copy="${match}" title="Klik untuk salin ${match}">${match}</span>`;
  });

  return html;
}

/**
 * Format Single Video Report as Plain Text
 */
function formatReportText(report) {
  const author = report.author || {};
  const stats = report.stats || {};
  const statusLabel = report.overallStatusLabel || getFriendlyStatusLabel(report.overallStatus);

  const lines = [
    `=== LAPORAN VALIDASI TIKTOK AFFILIATE ===`,
    `Pemeriksa: Kacery`,
    `Link Video: ${report.videoUrl || '-'}`,
    `Akun Affiliate: @${author.username || '-'}`,
    `Status Akhir: ${statusLabel}`,
    ``,
    `[STATISTIK VIDEO]`,
    `Followers: ${formatNum(author.followerCount)}`,
    `Views: ${formatNum(stats.views)}`,
    `Likes: ${formatNum(stats.likes)}`,
    `Komentar: ${formatNum(stats.comments)}`,
    `Shares: ${formatNum(stats.shares)}`,
    `Saves: ${formatNum(stats.saves)}`,
    ``,
    `[RINCIAN PEMERIKSAAN]`,
  ];

  (report.results || []).forEach(r => {
    lines.push(`- ${r.name}: [${r.statusLabel || r.status}] ${r.evidence}`);
  });

  if (report.aiAnalysis && report.aiAnalysis.available) {
    lines.push(`- Analisis Jorje: ${report.aiAnalysis.summary}`);
  }

  const yCart = report.yellowCart || {};
  lines.push(`Keranjang Kuning: ${yCart.hasCart ? `Ada (${yCart.name || 'Produk TikTok Shop'})` : 'Tidak Ada'}`);
  lines.push(``);
  lines.push(`Caption: ${report.caption || '-'}`);
  lines.push(`=========================================`);

  return lines.join('\n');
}

/**
 * Copy Single Report
 */
function copySingleReport(report) {
  const text = formatReportText(report);
  navigator.clipboard.writeText(text).then(() => {
    showToast('Laporan video berhasil disalin untuk Kacery.');
    logDiscordActivity('BUTTON_CLICK', 'Salin Laporan Tunggal', {
      info: `User menyalin laporan untuk @${report.author?.username || 'unknown'} (${report.overallStatusLabel || report.overallStatus})`
    });
  }).catch(() => {
    showToast('Gagal menyalin ke clipboard.');
  });
}

/**
 * Copy All Reports
 */
function copyAllReportsToClipboard() {
  if (sessionReports.length === 0) {
    showToast('Belum ada laporan untuk disalin ya Kacery.');
    return;
  }

  const allText = sessionReports.map(formatReportText).join('\n\n');
  navigator.clipboard.writeText(allText).then(() => {
    showToast(`Laporan ${sessionReports.length} video berhasil disalin.`);
  }).catch(() => {
    showToast('Gagal menyalin ke clipboard.');
  });
}

/**
 * Export All Reports to CSV
 */
function exportReportsToCsv() {
  if (sessionReports.length === 0) {
    showToast('Belum ada data untuk diunduh ya Kacery.');
    return;
  }

  const headers = [
    'No',
    'URL Video',
    'Username',
    'Status Akhir',
    'Followers',
    'Views',
    'Likes',
    'Komentar',
    'Shares',
    'Saves',
    'Caption',
    'Penjelasan Lengkap'
  ];

  const rows = sessionReports.map((r, i) => {
    const a = r.author || {};
    const s = r.stats || {};
    const statusLabel = r.overallStatusLabel || getFriendlyStatusLabel(r.overallStatus);
    const evidenceText = (r.results || [])
      .map(item => `[${item.statusLabel || item.status}] ${item.name}: ${item.evidence}`)
      .join(' | ');

    return [
      i + 1,
      `"${r.videoUrl || ''}"`,
      `"@${a.username || ''}"`,
      `"${statusLabel}"`,
      a.followerCount ?? '',
      s.views ?? '',
      s.likes ?? '',
      s.comments ?? '',
      s.shares ?? '',
      s.saves ?? '',
      `"${(r.caption || '').replace(/"/g, '""')}"`,
      `"${evidenceText.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekap_tiktok_kacery_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('File CSV berhasil diunduh.');
}

/**
 * Export All Reports as a Crisp Neobrutalism Infographic PNG Image (Laporan Resmi untuk Kacery)
 */
function exportReportAsImage(customReports = null, customTitle = null) {
  const reports = customReports || sessionReports;
  if (!reports || reports.length === 0) {
    showToast('Belum ada data untuk diunduh ya Kacery.');
    return;
  }

  const passCount = reports.filter(r => r.overallStatus === 'PASS').length;
  const failCount = reports.filter(r => r.overallStatus === 'FAIL').length;
  const reviewCount = reports.filter(r => r.overallStatus === 'NEED REVIEW').length;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = 1240;
  const margin = 24;
  const innerWidth = width - (margin * 2);
  const headerHeight = 175;
  const colHeaderHeight = 44;
  const rowHeight = 70;
  const footerHeight = 56;
  const innerHeight = headerHeight + colHeaderHeight + (reports.length * rowHeight) + footerHeight;
  const totalHeight = innerHeight + (margin * 2) + 8; // extra room for neobrutalism shadow

  // Hi-DPI scaling for crisp text on Retina/4K screens
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  ctx.scale(scale, scale);

  // 1. Canvas Outer Canvas Tint
  ctx.fillStyle = '#fdf4f6';
  ctx.fillRect(0, 0, width, totalHeight);

  // Helper: Draw Neobrutalism Card (with 4px offset solid shadow)
  const drawNeobrutalBox = (x, y, w, h, radius, fill, stroke, shadowOffset = 5) => {
    // Shadow
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(x + shadowOffset, y + shadowOffset, w, h, radius);
    ctx.fill();

    // Foreground Card
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    // Border
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
  };

  // Helper: Draw Pill Badge
  const drawPillBadge = (text, bg, fg, border, x, y, w, h, font = 'bold 12px "Plus Jakarta Sans", sans-serif') => {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.stroke();

    ctx.fillStyle = fg;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillText(text, x + (w / 2), y + (h / 2) + 4);
    ctx.textAlign = 'left';
  };

  // 2. Draw Main Neobrutalism White Container Card
  const cardX = margin;
  const cardY = margin;
  drawNeobrutalBox(cardX, cardY, innerWidth, innerHeight, 16, '#ffffff', '#0f172a', 6);

  // Clip content inside the rounded container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, innerWidth, innerHeight, 16);
  ctx.clip();

  // 3. Header Section
  const grad = ctx.createLinearGradient(cardX, cardY, cardX + innerWidth, cardY + headerHeight);
  grad.addColorStop(0, '#fff1f4');
  grad.addColorStop(1, '#ffe4ec');
  ctx.fillStyle = grad;
  ctx.fillRect(cardX, cardY, innerWidth, headerHeight);

  // Bottom border of Header
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + headerHeight);
  ctx.lineTo(cardX + innerWidth, cardY + headerHeight);
  ctx.stroke();

  // Ribbon Logo Icon (Neobrutalism Pink Badge with Letter C)
  const iconX = cardX + 32;
  const iconY = cardY + 28;
  const iconSize = 44;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(iconX + 3, iconY + 3, iconSize, iconSize, 10);
  ctx.fill();
  ctx.fillStyle = '#ffe4eb';
  ctx.beginPath();
  ctx.roundRect(iconX, iconY, iconSize, iconSize, 10);
  ctx.fill();
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(iconX, iconY, iconSize, iconSize, 10);
  ctx.stroke();

  ctx.fillStyle = '#be123c';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C', iconX + (iconSize / 2), iconY + 31);
  ctx.textAlign = 'left';

  // Title & Subtitle
  ctx.fillStyle = '#881337';
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TIKTOK VALIDATOR KACERY', iconX + iconSize + 16, iconY + 23);

  let nowStr = 'WIB';
  try {
    nowStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date()) + ' WIB';
  } catch (e) {}
  ctx.fillStyle = '#475569';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  const titleText = customTitle || `Laporan Campaign: ${currentConfig.name || 'Default'}`;
  ctx.fillText(`${titleText}  •  ${nowStr}`, iconX + iconSize + 16, iconY + 42);

  // Header Metric Badges (KPI Row)
  const kpiY = cardY + 104;
  let kpiX = cardX + 32;
  drawPillBadge(`Total: ${reports.length} Video`, '#ffffff', '#0f172a', '#0f172a', kpiX, kpiY, 140, 36);
  kpiX += 152;
  drawPillBadge(`Sudah Sesuai: ${passCount}`, '#ecfdf5', '#047857', '#059669', kpiX, kpiY, 175, 36);
  kpiX += 187;
  drawPillBadge(`Belum Sesuai: ${failCount}`, '#fef2f2', '#e11d48', '#e11d48', kpiX, kpiY, 175, 36);
  kpiX += 187;
  if (reviewCount > 0) {
    drawPillBadge(`Perlu Cek: ${reviewCount}`, '#fffbeb', '#b45309', '#d97706', kpiX, kpiY, 150, 36);
  }

  // 4. Column Header Bar
  const yThead = cardY + headerHeight;
  ctx.fillStyle = '#fff8fa';
  ctx.fillRect(cardX, yThead, innerWidth, colHeaderHeight);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cardX, yThead + colHeaderHeight);
  ctx.lineTo(cardX + innerWidth, yThead + colHeaderHeight);
  ctx.stroke();

  // Columns Layout
  const cols = [
    { title: 'NO', x: cardX + 24, w: 40, align: 'center' },
    { title: 'STATUS', x: cardX + 74, w: 120, align: 'center' },
    { title: 'KREATOR & CAPTION', x: cardX + 204, w: 290, align: 'left' },
    { title: 'VIEWS', x: cardX + 504, w: 85, align: 'right' },
    { title: 'LIKES', x: cardX + 599, w: 80, align: 'right' },
    { title: 'FOLLOWERS', x: cardX + 689, w: 90, align: 'right' },
    { title: 'KERANJANG', x: cardX + 789, w: 110, align: 'center' },
    { title: 'EVALUASI SYARAT', x: cardX + 909, w: 260, align: 'left' },
  ];

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  cols.forEach(c => {
    if (c.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(c.title, c.x + (c.w / 2), yThead + 26);
    } else if (c.align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillText(c.title, c.x + c.w, yThead + 26);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(c.title, c.x, yThead + 26);
    }
  });

  // 5. Draw Video Rows
  reports.forEach((r, i) => {
    const yRow = yThead + colHeaderHeight + (i * rowHeight);

    // Alternating Zebra Row
    ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#fff9fb';
    ctx.fillRect(cardX, yRow, innerWidth, rowHeight);

    // Row Bottom Border
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cardX, yRow + rowHeight);
    ctx.lineTo(cardX + innerWidth, yRow + rowHeight);
    ctx.stroke();

    // 1. No
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), cardX + 24 + 20, yRow + 41);

    // 2. Status Pill Badge
    const isPass = r.overallStatus === 'PASS';
    const isFail = r.overallStatus === 'FAIL';
    const pillBg = isPass ? '#ecfdf5' : (isFail ? '#fef2f2' : '#fffbeb');
    const pillFg = isPass ? '#047857' : (isFail ? '#b91c1c' : '#b45309');
    const pillBorder = isPass ? '#10b981' : (isFail ? '#f43f5e' : '#f59e0b');
    const pillText = isPass ? 'Sudah Sesuai' : (isFail ? 'Belum Sesuai' : 'Perlu Cek');
    drawPillBadge(pillText, pillBg, pillFg, pillBorder, cardX + 74, yRow + 20, 115, 30);

    // 3. Creator & Caption
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    const uText = `@${r.author?.username || 'unknown'}`;
    ctx.fillText(uText.length > 22 ? uText.slice(0, 21) + '…' : uText, cardX + 204, yRow + 29);

    const cap = (r.caption || '').replace(/\s+/g, ' ').trim();
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(cap.length > 36 ? cap.slice(0, 35) + '…' : (cap || '-'), cardX + 204, yRow + 49);

    // 4. Views
    const vVal = r.stats?.views ?? 0;
    const vPass = vVal >= (currentConfig.minViews || 0);
    ctx.fillStyle = vPass ? '#047857' : '#e11d48';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatNum(vVal), cardX + 504 + 85, yRow + 41);

    // 5. Likes
    const lVal = r.stats?.likes ?? 0;
    const lPass = lVal >= (currentConfig.minLikes || 0);
    ctx.fillStyle = lPass ? '#047857' : '#e11d48';
    ctx.fillText(formatNum(lVal), cardX + 599 + 80, yRow + 41);

    // 6. Followers
    const fVal = r.author?.followerCount ?? 0;
    const fPass = fVal >= (currentConfig.minFollowers || 0);
    ctx.fillStyle = fPass ? '#047857' : '#e11d48';
    ctx.fillText(formatNum(fVal), cardX + 689 + 90, yRow + 41);

    // 7. Keranjang Kuning Pill
    const hasCart = Boolean(r.hasYellowCart);
    const cartBg = hasCart ? '#fef3c7' : '#f1f5f9';
    const cartFg = hasCart ? '#92400e' : '#64748b';
    const cartBorder = hasCart ? '#f59e0b' : '#cbd5e1';
    const cartText = hasCart ? 'Keranjang Ada' : 'Tidak Ada';
    drawPillBadge(cartText, cartBg, cartFg, cartBorder, cardX + 789, yRow + 22, 105, 26, 'bold 11px "Plus Jakarta Sans", sans-serif');

    // 8. Evaluasi Syarat
    ctx.textAlign = 'left';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';

    const hCheck = (r.results || []).find(c => c.id === 'hashtags');
    const mCheck = (r.results || []).find(c => c.id === 'mentions');
    const bCheck = (r.results || []).find(c => c.id === 'brand_keywords');
    const hMissing = hCheck?.missing || [];
    const mMissing = mCheck?.missing || [];
    const bMissing = bCheck?.missing || [];

    const allMissing = [...hMissing, ...mMissing, ...bMissing];

    if (allMissing.length > 0) {
      ctx.fillStyle = '#b91c1c';
      const missText = `Kurang: ${allMissing.join(' ')}`;
      ctx.fillText(missText.length > 34 ? missText.slice(0, 33) + '…' : missText, cardX + 909, yRow + 34);
    } else if (r.aiAnalysis && r.aiAnalysis.available) {
      ctx.fillStyle = '#047857';
      ctx.fillText('Terverifikasi AI Jorje', cardX + 909, yRow + 34);
    } else {
      ctx.fillStyle = '#047857';
      ctx.fillText('Semua Syarat Sesuai', cardX + 909, yRow + 34);
    }

    if (r.failedReasons) {
      ctx.fillStyle = '#e11d48';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      const frText = String(r.failedReasons);
      ctx.fillText(frText.length > 38 ? frText.slice(0, 37) + '…' : frText, cardX + 909, yRow + 51);
    }
  });

  // 6. Footer Section
  const yFooter = innerHeight - footerHeight;
  ctx.fillStyle = '#fff1f4';
  ctx.fillRect(cardX, yFooter, innerWidth, footerHeight);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cardX, yFooter);
  ctx.lineTo(cardX + innerWidth, yFooter);
  ctx.stroke();

  ctx.fillStyle = '#881337';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TikTok Validator Kacery  •  Hak Cipta © 2026 Danial Gobel & Jorje Asisten AI  •  Antigravity IDE', cardX + 32, yFooter + 33);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Laporan Resmi Terverifikasi', cardX + innerWidth - 32, yFooter + 33);

  // Restore clip
  ctx.restore();

  // 7. Trigger High Quality PNG Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_kacery_${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);

    // Also attempt copy to clipboard
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
      }
    } catch (e) {}

    showToast('Gambar laporan resmi berhasil diunduh untuk Kacery! 📸');
  }, 'image/png');
}

/**
 * =========================================================================
 * NAVIGATION & TAB SWITCHING (Beranda, Riwayat, Lisensi & Hak Cipta)
 * =========================================================================
 */
function switchTab(tabName) {
  activeTab = tabName;

  // Toggle active class on tab buttons
  if (tabBtnHome) {
    const isHome = tabName === 'home';
    tabBtnHome.classList.toggle('is-active', isHome);
    tabBtnHome.setAttribute('aria-selected', isHome ? 'true' : 'false');
  }
  if (tabBtnHistory) {
    const isHistory = tabName === 'history';
    tabBtnHistory.classList.toggle('is-active', isHistory);
    tabBtnHistory.setAttribute('aria-selected', isHistory ? 'true' : 'false');
  }
  if (tabBtnLicense) {
    const isLicense = tabName === 'license';
    tabBtnLicense.classList.toggle('is-active', isLicense);
    tabBtnLicense.setAttribute('aria-selected', isLicense ? 'true' : 'false');
  }

  // Toggle visibility of panels
  if (tabContentHome) {
    const isHome = tabName === 'home';
    tabContentHome.classList.toggle('is-active', isHome);
    tabContentHome.classList.toggle('is-hidden', !isHome);
  }
  if (tabContentHistory) {
    const isHistory = tabName === 'history';
    tabContentHistory.classList.toggle('is-active', isHistory);
    tabContentHistory.classList.toggle('is-hidden', !isHistory);
  }
  if (tabContentLicense) {
    const isLicense = tabName === 'license';
    tabContentLicense.classList.toggle('is-active', isLicense);
    tabContentLicense.classList.toggle('is-hidden', !isLicense);
  }

  // Lazy-load history data only when entering History tab (Zero-Lag guarantee!)
  if (tabName === 'history') {
    loadAndRenderHistory(historySearchTerm);
  }

  logDiscordActivity('TAB_SWITCH', 'Pindah Tab', { tab: tabName });
}

/**
 * =========================================================================
 * INDEXEDDB STORAGE (Local-First Offline Database untuk Riwayat Pekerjaan)
 * =========================================================================
 */
const DB_NAME = 'kacery_validator_db';
const DB_VERSION = 1;
const STORE_NAME = 'validation_batches';

function openHistoryDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung oleh browser ini.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('campaignName', 'campaignName', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBatchToHistory(batchData) {
  try {
    const db = await openHistoryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const item = {
        id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        campaignName: batchData.campaignName || 'Campaign Default',
        summary: batchData.summary || {},
        reports: batchData.reports || []
      };
      store.add(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan batch riwayat ke IndexedDB:', err);
  }
}

async function getAllHistoryBatches() {
  try {
    const db = await openHistoryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Gagal membaca data riwayat dari IndexedDB:', err);
    return [];
  }
}

async function deleteHistoryBatch(id) {
  try {
    const db = await openHistoryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus batch riwayat:', err);
  }
}

async function clearAllHistoryBatches() {
  try {
    const db = await openHistoryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Gagal mengosongkan seluruh riwayat:', err);
  }
}

/**
 * =========================================================================
 * KALENDER DINAMIS & LOGIKA PENANGGALAN RELATIF DENGAN AUTO-ROLLOVER
 * =========================================================================
 * Logika ini menghitung perbedaan waktu terhadap new Date() saat ini secara
 * dinamis. Tanggal raw tersimpan dalam milidetik, sehingga saat hari berganti
 * besok hari, data otomatis tergeser ("Hari Ini" menjadi "Kemarin", dsb).
 */
const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatFullIndonesianDate(dateObj) {
  const dayName = INDO_DAYS[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = INDO_MONTHS[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

function formatTimeWIB(timestamp) {
  try {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} WIB`;
  } catch (e) {
    return '';
  }
}

function getRelativeDateInfo(timestamp) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOfDayBefore = startOfToday - (2 * oneDayMs);

  const targetDate = new Date(timestamp);
  const fullDateText = formatFullIndonesianDate(targetDate);
  const groupDateKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

  let label = '';
  let sortOrder = 0;

  if (timestamp >= startOfToday) {
    label = `Hari Ini — ${fullDateText}`;
    sortOrder = 1;
  } else if (timestamp >= startOfYesterday) {
    label = `Kemarin — ${fullDateText}`;
    sortOrder = 2;
  } else if (timestamp >= startOfDayBefore) {
    label = `Kemarin Lusa — ${fullDateText}`;
    sortOrder = 3;
  } else {
    label = fullDateText;
    sortOrder = 4;
  }

  return { label, groupDateKey, sortOrder, fullDateText };
}

/**
 * =========================================================================
 * RENDER RIWAYAT PEKERJAAN (LAZY LOADED)
 * =========================================================================
 */
async function loadAndRenderHistory(searchTerm = '') {
  if (!historyGroupsContainer || !historyEmptyState) return;

  const allBatches = await getAllHistoryBatches();

  // Apply search filter if query provided
  const query = (searchTerm || '').trim().toLowerCase();
  let filteredBatches = allBatches;
  if (query) {
    filteredBatches = allBatches.filter(b => {
      const matchCampaign = (b.campaignName || '').toLowerCase().includes(query);
      if (matchCampaign) return true;
      const matchReport = (b.reports || []).some(r => {
        const username = (r.author?.username || '').toLowerCase();
        const nickname = (r.author?.nickname || '').toLowerCase();
        const caption = (r.caption || '').toLowerCase();
        return username.includes(query) || nickname.includes(query) || caption.includes(query);
      });
      return matchReport;
    });
  }

  // Handle empty state
  if (filteredBatches.length === 0) {
    historyGroupsContainer.innerHTML = '';
    historyEmptyState.style.display = 'flex';
    return;
  }

  historyEmptyState.style.display = 'none';
  historyGroupsContainer.innerHTML = '';

  // Group batches by date key
  const groupsMap = new Map();
  filteredBatches.forEach(batch => {
    const dateInfo = getRelativeDateInfo(batch.timestamp);
    if (!groupsMap.has(dateInfo.groupDateKey)) {
      groupsMap.set(dateInfo.groupDateKey, {
        label: dateInfo.label,
        sortOrder: dateInfo.sortOrder,
        timestamp: batch.timestamp,
        batches: []
      });
    }
    groupsMap.get(dateInfo.groupDateKey).batches.push(batch);
  });

  // Convert to array and sort groups descending
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => b.timestamp - a.timestamp);

  sortedGroups.forEach(group => {
    const groupSection = document.createElement('section');
    groupSection.className = 'history-date-group';

    // Date Header Badge
    const dateHeader = document.createElement('div');
    dateHeader.className = 'history-date-header';
    dateHeader.innerHTML = `
      <span class="history-date-badge-dot"></span>
      <strong class="history-date-title">${escapeHtml(group.label)}</strong>
    `;
    groupSection.appendChild(dateHeader);

    // Batches Container
    const batchesContainer = document.createElement('div');
    batchesContainer.className = 'history-batches-container';

    group.batches.forEach(batch => {
      const batchCard = createHistoryBatchCard(batch);
      batchesContainer.appendChild(batchCard);
    });

    groupSection.appendChild(batchesContainer);
    historyGroupsContainer.appendChild(groupSection);
  });
}

function createHistoryBatchCard(batch) {
  const card = document.createElement('div');
  card.className = 'history-batch-card';
  card.id = `history-card-${batch.id}`;

  const summary = batch.summary || {};
  const total = summary.total || (batch.reports ? batch.reports.length : 0);
  const pass = summary.pass || (batch.reports ? batch.reports.filter(r => r.overallStatus === 'PASS').length : 0);
  const fail = summary.fail || (batch.reports ? batch.reports.filter(r => r.overallStatus === 'FAIL').length : 0);
  const timeStr = formatTimeWIB(batch.timestamp);

  card.innerHTML = `
    <div class="history-batch-header" role="button" tabindex="0" title="Klik untuk melihat rincian video batch ini">
      <div class="history-batch-title-row">
        <span class="history-campaign-badge">${escapeHtml(batch.campaignName || 'Campaign')}</span>
        <span class="history-time-stamp">${escapeHtml(timeStr)}</span>
      </div>
      <div class="history-batch-stats-row">
        <span class="history-stat-pill pill-total">${total} Video</span>
        <span class="history-stat-pill pill-pass">✓ ${pass} Sesuai</span>
        ${fail > 0 ? `<span class="history-stat-pill pill-fail">✕ ${fail} Belum</span>` : ''}
      </div>
      <div class="history-batch-actions">
        <button type="button" class="btn-tbl-action btn-copy-batch" title="Salin rekap WhatsApp batch ini" data-id="${batch.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button type="button" class="btn-tbl-action btn-image-batch" title="Unduh gambar laporan batch ini (PNG)" data-id="${batch.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>
        <button type="button" class="btn-tbl-action btn-load-batch" title="Muat batch ini ke halaman Beranda" data-id="${batch.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 14 4 9 9 4"></polyline>
            <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
          </svg>
        </button>
        <button type="button" class="btn-tbl-action btn-delete-batch" title="Hapus batch ini dari riwayat" data-id="${batch.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <button type="button" class="btn-tbl-action btn-toggle-batch" title="Buka/Tutup rincian" data-id="${batch.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
    <div class="history-batch-body is-hidden" id="history-body-${batch.id}">
      <div class="history-videos-list">
        ${(batch.reports || []).map((r, idx) => {
          const author = r.author || {};
          const stats = r.stats || {};
          const pass = r.overallStatus === 'PASS';
          const review = r.overallStatus === 'NEED REVIEW';
          const statusClass = pass ? 'pass' : (review ? 'need-review' : 'fail');
          const statusLabel = r.overallStatusLabel || (pass ? 'Sudah Sesuai' : (review ? 'Perlu Cek' : 'Belum Sesuai'));

          return `
            <div class="history-video-item">
              <div class="history-video-item-left">
                <span class="history-video-num">${idx + 1}.</span>
                <span class="status-pill ${statusClass} vcard-pill-mini">${escapeHtml(statusLabel)}</span>
                <a href="${escapeHtml(r.videoUrl || '#')}" target="_blank" rel="noopener noreferrer" class="history-video-link" onclick="event.stopPropagation()">
                  @${escapeHtml(author.username || 'creator')}
                </a>
                <span class="history-video-nickname">${escapeHtml(author.nickname || '')}</span>
              </div>
              <div class="history-video-item-right">
                <span class="history-video-stat">👁️ ${formatNum(stats.views)}</span>
                <span class="history-video-stat">❤️ ${formatNum(stats.likes)}</span>
                <span class="history-video-stat">👥 ${formatNum(author.followerCount)}</span>
                ${(r.failedReasonsSummary && !pass) ? `<span class="history-fail-badge" title="${escapeHtml(r.failedReasonsSummary)}">${escapeHtml(r.failedReasonsSummary)}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Accordion Expand/Collapse
  const header = card.querySelector('.history-batch-header');
  const body = card.querySelector('.history-batch-body');
  const toggleBtn = card.querySelector('.btn-toggle-batch');
  const toggleExpand = () => {
    const isHidden = body.classList.contains('is-hidden');
    if (isHidden) {
      body.classList.remove('is-hidden');
      toggleBtn.classList.add('is-expanded');
    } else {
      body.classList.add('is-hidden');
      toggleBtn.classList.remove('is-expanded');
    }
  };

  header.addEventListener('click', toggleExpand);
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleExpand();
  });

  // Salin rekap WhatsApp
  const copyBtn = card.querySelector('.btn-copy-batch');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyBatchReportToClipboard(batch);
    });
  }

  // Unduh gambar laporan batch PNG
  const imageBtn = card.querySelector('.btn-image-batch');
  if (imageBtn) {
    imageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportReportAsImage(batch.reports, `Batch: ${batch.campaignName || 'Campaign'} (${timeStr})`);
      logDiscordActivity('BUTTON_CLICK', 'Unduh Gambar Batch Riwayat', { count: batch.reports?.length });
    });
  }

  // Muat ke Beranda
  const loadBtn = card.querySelector('.btn-load-batch');
  if (loadBtn) {
    loadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadBatchToWorkspace(batch);
    });
  }

  // Hapus batch
  const delBtn = card.querySelector('.btn-delete-batch');
  if (delBtn) {
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Hapus riwayat batch "${batch.campaignName}" (${timeStr}) untuk Kacery?`)) {
        await deleteHistoryBatch(batch.id);
        showToast('Riwayat batch berhasil dihapus.');
        loadAndRenderHistory(historySearchTerm);
        logDiscordActivity('BUTTON_CLICK', 'Hapus Batch Riwayat', { id: batch.id });
      }
    });
  }

  return card;
}

function copyBatchReportToClipboard(batch) {
  if (!batch.reports || batch.reports.length === 0) {
    showToast('Tidak ada data dalam batch ini.');
    return;
  }
  const allText = batch.reports.map(formatReportText).join('\n\n');
  navigator.clipboard.writeText(allText).then(() => {
    showToast(`Rangkuman ${batch.reports.length} video berhasil disalin untuk Kacery!`);
    logDiscordActivity('BUTTON_CLICK', 'Salin Rekap Batch Riwayat', { count: batch.reports.length });
  }).catch(() => {
    showToast('Gagal menyalin ke clipboard.');
  });
}

function loadBatchToWorkspace(batch) {
  if (!batch.reports || batch.reports.length === 0) {
    showToast('Tidak ada video dalam batch ini untuk dimuat.');
    return;
  }
  sessionReports = [...batch.reports];
  renderCards();
  updateStats();
  switchTab('home');
  showToast(`Berhasil memuat ${batch.reports.length} video ke halaman Beranda.`);
  logDiscordActivity('BUTTON_CLICK', 'Muat Batch ke Beranda', { count: batch.reports.length });
}

/**
 * Utility Helpers
 */
function parseUrlsFromInput() {
  const text = urlsInput.value || '';
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && /tiktok\.com/i.test(line));
}

function updateInputCounter() {
  const count = parseUrlsFromInput().length;
  inputCountBadge.textContent = `${count} link`;
}

function revalidateExistingReports() {
  renderCards();
  updateStats();
}

function formatNum(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Register Service Worker with Auto-Update Mechanism
 * Ensures any future changes deployed on Vercel are immediately applied
 * to all users without requiring manual cache clearing.
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Force check for updates on each visit
        registration.update().catch(() => {});

        // Listen for new workers being installed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Versi baru aplikasi ditemukan, memperbarui otomatis...');
              showToast('Pembaruan baru tersedia, memuat versi terbaru...');
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });

    // Check for updates whenever user returns to tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) reg.update().catch(() => {});
        });
      }
    });

    // Handle controller change (when new worker activates)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Start app
document.addEventListener('DOMContentLoaded', init);

