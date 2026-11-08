// TikTok Affiliate Content Validator - Client Application (Khusus Kacery)

const STORAGE_KEY = 'tt_affiliate_validator_config_v2';
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
  brandKeywords: ['Vape', 'Fumakilla'],
  brandCheckLocation: 'caption_or_video',
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
const cfgBrandLoc = document.getElementById('cfg-brand-loc');

// Tag Adder Inputs & Containers
const inputNewHashtag = document.getElementById('input-new-hashtag');
const btnAddHashtag = document.getElementById('btn-add-hashtag');
const hashtagChipsContainer = document.getElementById('hashtag-chips-container');

const inputNewMention = document.getElementById('input-new-mention');
const btnAddMention = document.getElementById('btn-add-mention');
const mentionChipsContainer = document.getElementById('mention-chips-container');

const inputNewBrand = document.getElementById('input-new-brand');
const btnAddBrand = document.getElementById('btn-add-brand');
const brandChipsContainer = document.getElementById('brand-chips-container');

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
    desc: 'Kacery bisa menentukan target followers, views, likes, hashtag wajib, dan mention. Sekarang Kacery bisa menambahkan hashtag dan mention satu per satu dengan tombol Tambah tanpa khawatir salah koma atau spasi!',
    tip: 'Pengaturan otomatis tersimpan di browser Kacery, tidak perlu diatur ulang setiap kali buka web.'
  },
  {
    badge: 'Langkah 3 dari 5',
    title: 'Pemeriksaan Video Otomatis',
    desc: 'Setelah link ditempel, klik tombol merah "Periksa Video Sekarang". Sistem otomatis membaca jumlah followers, views, likes, komentar, share, saves, dan menghitung Engagement Rate secara akurat.',
    tip: 'Pemeriksaan berjalan cepat dan tidak membedakan huruf besar/kecil pada hashtag.'
  },
  {
    badge: 'Langkah 4 dari 5',
    title: 'Verifikasi Cerdas AI Jorje',
    desc: 'Aplikasi didukung asisten pintar AI Jorje untuk memeriksa isi video dan caption. Jorje akan mengecek penyebutan brand yang dipromosikan dan menampilkan ringkasan akurasi.',
    tip: 'Jika brand terbukti ada di video, AI Jorje otomatis memberi verifikasi tanpa Kacery harus menonton manual!'
  },
  {
    badge: 'Langkah 5 dari 5',
    title: 'Rekap Hasil & Ekspor Excel',
    desc: 'Semua hasil pemeriksaan disajikan dalam kartu yang rapi dan tidak terpotong. Kacery bisa menyalin format laporan untuk WhatsApp atau mengunduh file CSV Excel dengan satu klik.',
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
    }
  });

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
  const badgeBrands = document.getElementById('badge-brands');

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
  if (badgeBrands) {
    const brands = (currentConfig.brandKeywords || []).join(', ');
    badgeBrands.textContent = brands || 'Tidak ada brand wajib';
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

  // 3. Brand Keyword Adder
  const addBrand = () => {
    const val = inputNewBrand.value.trim();
    if (!val) return;
    if (!tempBrands.some(b => b.toLowerCase() === val.toLowerCase())) {
      tempBrands.push(val);
      renderBrandChips();
      logDiscordActivity('BUTTON_CLICK', 'Tambah Brand Keyword', { value: val, info: `Menambahkan keyword brand: ${val}` });
    }
    inputNewBrand.value = '';
    inputNewBrand.focus();
  };
  btnAddBrand.addEventListener('click', addBrand);
  inputNewBrand.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBrand();
    }
  });

  // 4. Expected Username Adder
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

function renderBrandChips() {
  renderTagChipsHelper(brandChipsContainer, tempBrands, (index) => {
    const removed = tempBrands.splice(index, 1)[0];
    renderBrandChips();
    if (removed) logDiscordActivity('BUTTON_CLICK', 'Hapus Brand Keyword', { value: removed, info: `Menghapus brand: ${removed}` });
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
  cfgBrandLoc.value = currentConfig.brandCheckLocation || 'caption_or_video';

  // Load tag arrays from config
  tempHashtags = [...(currentConfig.requiredHashtags || [])];
  tempMentions = [...(currentConfig.requiredMentions || [])];
  tempBrands = [...(currentConfig.brandKeywords || [])];
  tempUsernames = [...(currentConfig.expectedUsernames || [])];

  renderHashtagChips();
  renderMentionChips();
  renderBrandChips();
  renderUsernameChips();

  inputNewHashtag.value = '';
  inputNewMention.value = '';
  inputNewBrand.value = '';
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

function saveConfigFromForm() {
  const updated = {
    name: cfgName.value.trim() || 'Campaign Vape Fumakilla',
    minFollowers: parseInt(cfgFollowers.value, 10) || 0,
    minViews: parseInt(cfgViews.value, 10) || 0,
    minLikes: parseInt(cfgLikes.value, 10) || 0,
    requiredMentions: [...tempMentions],
    requiredHashtags: [...tempHashtags],
    brandKeywords: [...tempBrands],
    brandCheckLocation: cfgBrandLoc.value || 'caption_or_video',
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
    aiActive: Boolean(currentConfig.brandKeywords?.length)
  });

  let completed = 0;
  const total = urls.length;

  for (let i = 0; i < total; i++) {
    const url = urls[i];
    const percent = Math.round(((i + 1) / total) * 100);

    progressText.textContent = `Memeriksa video ${i + 1} dari ${total}...`;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
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
      sessionReports.push(data);
    } catch (err) {
      sessionReports.push({
        success: false,
        videoUrl: url,
        error: `Gagal memproses video: ${err.message}`,
        overallStatus: 'FAIL',
        overallStatusLabel: 'Belum Sesuai',
        results: [],
        summary: { total: 1, pass: 0, fail: 1, needReview: 0 }
      });
    }

    completed++;
    renderCards();
    updateStats();
  }

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
      engagementRate: r.engagementRate?.formatted,
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
  videoCardsList.innerHTML = '';

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
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="10" class="empty-table-cell"><p class="empty-paragraph">Tidak ada video dengan filter yang dipilih.</p></td>`;
    videoCardsList.appendChild(emptyRow);
    return;
  }

  filtered.forEach((report, index) => {
    const [mainRow, detailRow] = createVideoTableRows(report, index);
    videoCardsList.appendChild(mainRow);
    videoCardsList.appendChild(detailRow);
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
  let erHtml = '<span class="text-muted">-</span>';

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

    erHtml = `<span class="tbl-metric metric-er">${er.formatted || '-'}</span>`;
  }

  // Tagar & Mention Evaluation
  let tagBadges = [];
  if (report.success === false) {
    tagBadges.push(`<span class="badge-tag-fail" title="Gagal mengekstrak video">❌ Gagal Ambil Data</span>`);
  } else {
    const hashtagCheck = results.find(r => r.id === 'hashtags');
    const mentionCheck = results.find(r => r.id === 'mentions');
    const missingTags = hashtagCheck?.missing || [];
    const missingMentions = mentionCheck?.missing || [];

    if (missingTags.length > 0) {
      tagBadges.push(`<span class="badge-tag-fail" title="Tagar wajib tidak ditemukan">❌ Kurang: ${escapeHtml(missingTags.join(' '))}</span>`);
    } else if ((currentConfig.requiredHashtags || []).length > 0) {
      tagBadges.push(`<span class="badge-tag-pass">✅ Tagar Lengkap</span>`);
    }

    if (missingMentions.length > 0) {
      tagBadges.push(`<span class="badge-tag-fail" title="Mention wajib tidak ditemukan">❌ Kurang: ${escapeHtml(missingMentions.join(' '))}</span>`);
    } else if ((currentConfig.requiredMentions || []).length > 0) {
      tagBadges.push(`<span class="badge-tag-pass">✅ Mention Ada</span>`);
    }

    if (tagBadges.length === 0) {
      tagBadges.push(`<span class="text-muted" style="font-size:0.75rem;">-</span>`);
    }
  }

  // Brand & AI Jorje Evaluation
  let brandHtml = `<span class="text-muted" style="font-size:0.75rem;">-</span>`;
  if (report.success === false) {
    brandHtml = `<span class="badge-tag-fail" title="${escapeHtml(report.error || 'Video tidak dapat diakses')}">❌ Error</span>`;
  } else if ((currentConfig.brandKeywords || []).length > 0) {
    const brandCheck = results.find(r => r.id === 'brand_keywords');
    if (brandCheck) {
      if (brandCheck.status === 'PASS') {
        brandHtml = `<span class="badge-tag-pass" title="${escapeHtml(brandCheck.evidence || 'Brand terverifikasi')}">✅ Terdeteksi</span>`;
      } else if (brandCheck.status === 'NEED REVIEW') {
        brandHtml = `<span class="badge-tag-review" title="Cek video secara manual">⚠️ Perlu Cek</span>`;
      } else {
        brandHtml = `<span class="badge-tag-fail" title="Brand tidak ditemukan dalam caption / video">❌ Tidak Ada</span>`;
      }
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
    </td>
    <td class="td-video">
      <div class="video-cell-card">
        <div class="video-cover-mini-wrap" title="Klik baris untuk lihat preview video">
          ${report.media?.coverUrl ? `<img src="${escapeHtml(report.media.coverUrl)}" alt="Cover" class="video-cover-mini-img" loading="lazy" onerror="this.src='/icons/kacery-logo.png'">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:16px;">🎬</div>`}
          <span class="video-play-tag">▶</span>
        </div>
        <div class="video-meta-block">
          <div class="video-creator-row">
            <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="video-creator-link" title="Buka video TikTok di tab baru" onclick="event.stopPropagation()">@${escapeHtml(username)}</a>
          </div>
          <span class="video-creator-nickname">${escapeHtml(author.nickname || '')}</span>
          ${report.caption ? `<span class="video-caption-teaser" title="${escapeHtml(report.caption)}">${escapeHtml(report.caption.slice(0, 32))}${report.caption.length > 32 ? '…' : ''}</span>` : ''}
        </div>
      </div>
    </td>
    <td class="td-metric">${viewsHtml}</td>
    <td class="td-metric">${likesHtml}</td>
    <td class="td-metric">${followersHtml}</td>
    <td class="td-metric">${erHtml}</td>
    <td class="td-tags">
      <div class="tags-cell-wrapper">
        ${tagBadges.join('')}
      </div>
    </td>
    <td class="td-brand">${brandHtml}</td>
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
        <button type="button" class="btn-tbl-action btn-toggle-detail" title="Buka detail caption & video" data-index="${index}" onclick="event.stopPropagation()">
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
  const highlightedCaption = highlightCaption(report.caption || '', currentConfig);

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

  // Video preview block
  let mediaBlock = '';
  if (report.media?.videoUrl) {
    mediaBlock = `
      <div class="video-preview-block">
        <div class="video-frame-mobile">
          <video controls preload="metadata" playsinline>
            <source src="${escapeHtml(report.media.videoUrl)}" type="video/mp4">
            Video tidak dapat diputar di browser ini.
          </video>
        </div>
        <div class="manual-check-box">
          <span class="manual-check-title">Verifikasi Manual Isi Video</span>
          <div class="manual-check-options">
            <label class="checkbox-mobile-label">
              <input type="checkbox" class="cb-brand-visual" data-index="${index}">
              <span>Tulisan brand terlihat jelas di layar video</span>
            </label>
            <label class="checkbox-mobile-label">
              <input type="checkbox" class="cb-brand-audio" data-index="${index}">
              <span>Nama brand terdengar diucapkan dalam video</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  detailRow.innerHTML = `
    <td colspan="10" style="padding: 0;">
      <div class="detail-sub-wrapper">
        <div class="detail-left-col">
          <div class="caption-card-block">
            <span class="caption-block-label">Caption Video & Hashtag</span>
            <div class="caption-content">${highlightedCaption || (report.error ? `<span class="text-danger">${escapeHtml(report.error)}</span>` : '<em class="text-muted">(Tidak ada caption)</em>')}</div>
          </div>
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
          ${mediaBlock || '<p class="text-muted" style="font-size: 0.8rem; padding: 1rem 0;">Preview video langsung tidak tersedia (silakan buka link TikTok asli).</p>'}
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

  // Copy listener
  const copyBtn = mainRow.querySelector('.btn-copy-row');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copySingleReport(report));
  }

  // Attach manual audio/visual verification listeners
  const cbVisual = detailRow.querySelector('.cb-brand-visual');
  const cbAudio = detailRow.querySelector('.cb-brand-audio');
  if (cbVisual || cbAudio) {
    const handleCheck = () => {
      const visualFound = cbVisual ? cbVisual.checked : false;
      const audioFound = cbAudio ? cbAudio.checked : false;

      const brandResults = (report.results || []).filter(r => r.category === 'Brand');
      brandResults.forEach(br => {
        if (visualFound || audioFound) {
          br.status = 'PASS';
          br.statusLabel = 'Sudah Sesuai';
          br.evidence = `Brand terbukti ditemukan dalam video (${visualFound ? 'tulisan visual' : ''}${visualFound && audioFound ? ' & ' : ''}${audioFound ? 'suara' : ''}).`;
        }
      });

      const hasFail = report.results.some(r => r.status === 'FAIL');
      const hasReview = report.results.some(r => r.status === 'NEED REVIEW');
      report.overallStatus = hasFail ? 'FAIL' : (hasReview ? 'NEED REVIEW' : 'PASS');
      report.overallStatusLabel = getFriendlyStatusLabel(report.overallStatus);

      renderCards();
      updateStats();
      showToast('Status brand video diperbarui.');
      logDiscordActivity('BUTTON_CLICK', 'Verifikasi Manual Brand Video', {
        info: `Verifikasi manual @${report.author?.username || 'unknown'} diubah ke: ${report.overallStatusLabel || report.overallStatus}`
      });
    };

    if (cbVisual) cbVisual.addEventListener('change', handleCheck);
    if (cbAudio) cbAudio.addEventListener('change', handleCheck);
  }

  return [mainRow, detailRow];
}

/**
 * Highlight Hashtags, Mentions, and Brand Keywords
 */
function highlightCaption(caption, config) {
  if (!caption) return '';

  let html = escapeHtml(caption);

  html = html.replace(/@[\p{L}\p{N}._]+/gu, (match) => {
    return `<span class="highlight-match">${match}</span>`;
  });

  html = html.replace(/#[\p{L}\p{N}_]+/gu, (match) => {
    return `<span class="highlight-match">${match}</span>`;
  });

  const brands = config.brandKeywords || [];
  brands.forEach(b => {
    if (!b) return;
    const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escapeRegex(b.trim())})(?=[^\\p{L}\\p{N}]|$)`, 'giu');
    html = html.replace(regex, (full, brandWord) => {
      return full.replace(brandWord, `<span class="highlight-match">${brandWord}</span>`);
    });
  });

  return html;
}

/**
 * Format Single Video Report as Plain Text
 */
function formatReportText(report) {
  const author = report.author || {};
  const stats = report.stats || {};
  const er = report.engagementRate || {};
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
    `Engagement Rate: ${er.formatted || 'N/A'}`,
    ``,
    `[RINCIAN PEMERIKSAAN]`,
  ];

  (report.results || []).forEach(r => {
    lines.push(`- ${r.name}: [${r.statusLabel || r.status}] ${r.evidence}`);
  });

  if (report.aiAnalysis && report.aiAnalysis.available) {
    lines.push(`- Analisis Jorje: ${report.aiAnalysis.summary}`);
  }

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
    'ER (%)',
    'Penjelasan Lengkap'
  ];

  const rows = sessionReports.map((r, i) => {
    const a = r.author || {};
    const s = r.stats || {};
    const er = r.engagementRate || {};
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
      er.rate ?? '',
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
 * Export All Reports as an Infographic PNG Image (Gambar Laporan untuk Kacery)
 */
function exportReportAsImage() {
  if (sessionReports.length === 0) {
    showToast('Belum ada data untuk diunduh ya Kacery.');
    return;
  }

  const reports = sessionReports;
  const passCount = reports.filter(r => r.overallStatus === 'PASS').length;
  const failCount = reports.filter(r => r.overallStatus === 'FAIL').length;
  const reviewCount = reports.filter(r => r.overallStatus === 'NEED REVIEW').length;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = 1200;
  const headerHeight = 200;
  const colHeaderHeight = 48;
  const rowHeight = 64;
  const footerHeight = 60;
  const height = headerHeight + colHeaderHeight + (reports.length * rowHeight) + footerHeight;

  // Hi-DPI scaling for crisp text
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Header Banner
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#fff1f4');
  gradient.addColorStop(1, '#ffe4eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, headerHeight);

  // Bottom border of banner
  ctx.strokeStyle = '#fecdd3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(width, headerHeight);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = '#881337';
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('🌸 TIKTOK VALIDATOR KACERY', 40, 52);

  // Subtitle
  ctx.fillStyle = '#9f1239';
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  let nowStr = 'WIB';
  try {
    nowStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date()) + ' WIB';
  } catch (e) {}
  ctx.fillText(`Laporan Campaign: ${currentConfig.name || 'Default'} • ${nowStr}`, 40, 85);

  // Helper: Draw Pill Badge
  const drawPill = (text, bg, fg, x, y, w, h) => {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 5);
    ctx.textAlign = 'left';
  };

  drawPill(`Total: ${reports.length} Video`, '#ffffff', '#0f172a', 40, 120, 140, 36);
  drawPill(`✅ Sudah Sesuai: ${passCount}`, '#ecfdf5', '#047857', 195, 120, 175, 36);
  drawPill(`❌ Belum Sesuai: ${failCount}`, '#fef2f2', '#b91c1c', 385, 120, 175, 36);
  if (reviewCount > 0) {
    drawPill(`⚠️ Perlu Cek: ${reviewCount}`, '#fffbeb', '#b45309', 575, 120, 150, 36);
  }

  // Table Column Headers
  const yThead = headerHeight;
  ctx.fillStyle = '#fff8fa';
  ctx.fillRect(0, yThead, width, colHeaderHeight);
  ctx.strokeStyle = '#fecdd3';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, yThead + colHeaderHeight);
  ctx.lineTo(width, yThead + colHeaderHeight);
  ctx.stroke();

  // Columns X coordinates
  const cols = [
    { title: 'NO', x: 40, w: 40, align: 'center' },
    { title: 'STATUS', x: 95, w: 120, align: 'center' },
    { title: 'KREATOR', x: 235, w: 220, align: 'left' },
    { title: 'VIEWS', x: 490, w: 90, align: 'right' },
    { title: 'LIKES', x: 600, w: 80, align: 'right' },
    { title: 'ER (%)', x: 700, w: 80, align: 'right' },
    { title: 'TAGAR & MENTION', x: 810, w: 220, align: 'left' },
    { title: 'BRAND (JORJE)', x: 1050, w: 110, align: 'center' },
  ];

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  cols.forEach(c => {
    if (c.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(c.title, c.x + c.w / 2, yThead + 29);
    } else if (c.align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillText(c.title, c.x + c.w, yThead + 29);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(c.title, c.x, yThead + 29);
    }
  });

  // Draw Rows
  reports.forEach((r, i) => {
    const yRow = yThead + colHeaderHeight + (i * rowHeight);

    // Alternating zebra row
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fff9fb';
    ctx.fillRect(0, yRow, width, rowHeight);

    // Border bottom
    ctx.strokeStyle = '#fde2e7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yRow + rowHeight);
    ctx.lineTo(width, yRow + rowHeight);
    ctx.stroke();

    // No
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), 40 + 20, yRow + 38);

    // Status Pill
    const isPass = r.overallStatus === 'PASS';
    const isFail = r.overallStatus === 'FAIL';
    const pillBg = isPass ? '#ecfdf5' : (isFail ? '#fef2f2' : '#fffbeb');
    const pillFg = isPass ? '#047857' : (isFail ? '#b91c1c' : '#b45309');
    const pillText = isPass ? 'Sudah Sesuai' : (isFail ? 'Belum Sesuai' : 'Perlu Cek');
    drawPill(pillText, pillBg, pillFg, 95, yRow + 17, 120, 30);

    // Creator Username
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    const uText = `@${r.author?.username || 'unknown'}`;
    ctx.fillText(uText.length > 18 ? uText.slice(0, 17) + '…' : uText, 235, yRow + 38);

    // Views
    const vVal = r.stats?.views ?? 0;
    const vPass = vVal >= (currentConfig.minViews || 0);
    ctx.fillStyle = vPass ? '#047857' : '#e11d48';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatNum(vVal) + (vPass ? '' : ' ⚠️'), 490 + 90, yRow + 38);

    // Likes
    const lVal = r.stats?.likes ?? 0;
    const lPass = lVal >= (currentConfig.minLikes || 0);
    ctx.fillStyle = lPass ? '#047857' : '#e11d48';
    ctx.fillText(formatNum(lVal), 600 + 80, yRow + 38);

    // ER
    ctx.fillStyle = '#e11d48';
    ctx.fillText(r.engagementRate?.formatted || '-', 700 + 80, yRow + 38);

    // Tagar & Mention
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    const hCheck = (r.results || []).find(c => c.id === 'hashtags');
    const mCheck = (r.results || []).find(c => c.id === 'mentions');
    const hMissing = hCheck?.missing || [];
    const mMissing = mCheck?.missing || [];

    if (hMissing.length > 0 || mMissing.length > 0) {
      ctx.fillStyle = '#b91c1c';
      const missText = `❌ Kurang: ${[...hMissing, ...mMissing].join(' ')}`;
      ctx.fillText(missText.length > 25 ? missText.slice(0, 24) + '…' : missText, 810, yRow + 38);
    } else {
      ctx.fillStyle = '#047857';
      ctx.fillText('✅ Lengkap', 810, yRow + 38);
    }

    // Brand (Jorje)
    const bCheck = (r.results || []).find(c => c.id === 'brand_keywords');
    ctx.textAlign = 'center';
    if (bCheck?.status === 'PASS') {
      ctx.fillStyle = '#047857';
      ctx.fillText('✅ Terdeteksi', 1050 + 55, yRow + 38);
    } else if (bCheck?.status === 'NEED REVIEW') {
      ctx.fillStyle = '#b45309';
      ctx.fillText('⚠️ Perlu Cek', 1050 + 55, yRow + 38);
    } else {
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('❌ Tidak Ada', 1050 + 55, yRow + 38);
    }
  });

  // Footer
  const yFooter = height - footerHeight;
  ctx.fillStyle = '#fff4f7';
  ctx.fillRect(0, yFooter, width, footerHeight);
  ctx.strokeStyle = '#fecdd3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, yFooter);
  ctx.lineTo(width, yFooter);
  ctx.stroke();

  ctx.fillStyle = '#9f1239';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌸 TikTok Validator Kacery • Laporan Resmi Terverifikasi Otomatis oleh AI Jorje', width / 2, yFooter + 35);

  // Trigger Download
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

    showToast('Gambar laporan berhasil diunduh untuk Kacery! 📸');
  }, 'image/png');
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

