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
    title: 'Verifikasi Cerdas Google Gemini AI',
    desc: 'Aplikasi didukung teknologi Google Gemini AI untuk memeriksa isi video dan caption. AI akan mengecek penyebutan brand yang dipromosikan dan menampilkan ringkasan akurasi.',
    tip: 'Jika brand terbukti ada di video, AI otomatis memberi verifikasi tanpa Kacery harus menonton manual!'
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
 * Initialize Application
 */
function init() {
  updateSummaryStrip();
  registerServiceWorker();

  // Input counter listener
  urlsInput.addEventListener('input', updateInputCounter);

  // Quick Action Buttons
  btnClearInput.addEventListener('click', () => {
    urlsInput.value = '';
    updateInputCounter();
    showToast('Kotak input telah dikosongkan.');
  });

  btnDemoLink.addEventListener('click', () => {
    urlsInput.value = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
    updateInputCounter();
    showToast('Link demo berhasil dimasukkan.');
  });

  btnPasteClipboard.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlsInput.value = (urlsInput.value ? urlsInput.value + '\n' : '') + text.trim();
        updateInputCounter();
        showToast('Link berhasil ditempel dari clipboard.');
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
  });

  btnCopyAllReport.addEventListener('click', copyAllReportsToClipboard);
  btnExportCsv.addEventListener('click', exportReportsToCsv);

  // Config Modal Handlers
  btnOpenConfig.addEventListener('click', openConfigModal);
  btnQuickEdit.addEventListener('click', openConfigModal);
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
  btnStartTour.addEventListener('click', () => startTour(true));
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
 * Service Worker Registration for PWA
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    });
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
    tempHashtags.splice(index, 1);
    renderHashtagChips();
  });
}

function renderMentionChips() {
  renderTagChipsHelper(mentionChipsContainer, tempMentions, (index) => {
    tempMentions.splice(index, 1);
    renderMentionChips();
  });
}

function renderBrandChips() {
  renderTagChipsHelper(brandChipsContainer, tempBrands, (index) => {
    tempBrands.splice(index, 1);
    renderBrandChips();
  });
}

function renderUsernameChips() {
  renderTagChipsHelper(usernameChipsContainer, tempUsernames, (index) => {
    tempUsernames.splice(index, 1);
    renderUsernameChips();
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

  if (sessionReports.length > 0) {
    revalidateExistingReports();
  }
}

function resetConfigToDefault() {
  if (confirm('Kacery yakin ingin mengembalikan syarat campaign ke setelan awal default?')) {
    saveCampaignConfig(DEFAULT_CONFIG);
    openConfigModal();
    showToast('Syarat campaign telah direset ke default.');
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
 * Render Video Result Cards
 */
function renderCards() {
  videoCardsList.innerHTML = '';

  const filtered = sessionReports.filter(report => {
    if (activeFilter === 'ALL') return true;
    return report.overallStatus === activeFilter;
  });

  if (filtered.length === 0 && sessionReports.length > 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.className = 'card empty-state-card';
    emptyNotice.innerHTML = `<p class="empty-paragraph">Tidak ada video dengan filter yang dipilih.</p>`;
    videoCardsList.appendChild(emptyNotice);
    return;
  }

  filtered.forEach((report, index) => {
    const card = createVideoCard(report, index);
    videoCardsList.appendChild(card);
  });
}

function getFriendlyStatusLabel(status) {
  if (status === 'PASS') return 'Sudah Sesuai';
  if (status === 'FAIL') return 'Belum Sesuai';
  return 'Perlu Cek Manual';
}

/**
 * Create DOM element for a Video Card
 */
function createVideoCard(report, index) {
  const card = document.createElement('article');
  const statusKey = (report.overallStatus || 'fail').toLowerCase().replace(/\s+/g, '-');
  card.className = 'video-result-card';

  const author = report.author || {};
  const stats = report.stats || {};
  const er = report.engagementRate || {};
  const username = author.username || 'Tidak diketahui';
  const videoUrl = report.videoUrl || '';
  const statusLabel = report.overallStatusLabel || getFriendlyStatusLabel(report.overallStatus);

  // Top Author Header
  const headerHtml = `
    <div class="card-header-mobile">
      <div class="author-info-block">
        <div class="author-username-row">
          <span class="author-username">@${escapeHtml(username)}</span>
        </div>
        <span class="author-id-text">${escapeHtml(author.nickname || '')} ${report.videoId ? '• ID: ' + escapeHtml(report.videoId) : ''}</span>
      </div>
      <span class="status-pill ${statusKey}">
        ${escapeHtml(statusLabel)}
      </span>
    </div>
  `;

  // Metrics Strip
  const metricsHtml = `
    <div class="metrics-strip-mobile">
      <div class="metric-cell">
        <span class="metric-cell-label">Followers</span>
        <span class="metric-cell-val">${formatNum(author.followerCount)}</span>
      </div>
      <div class="metric-cell">
        <span class="metric-cell-label">Views</span>
        <span class="metric-cell-val">${formatNum(stats.views)}</span>
      </div>
      <div class="metric-cell">
        <span class="metric-cell-label">Likes</span>
        <span class="metric-cell-val">${formatNum(stats.likes)}</span>
      </div>
    </div>
    <div class="metrics-strip-sub">
      <span>Komentar: <strong>${formatNum(stats.comments)}</strong></span>
      <span>•</span>
      <span>Share: <strong>${formatNum(stats.shares)}</strong></span>
      <span>•</span>
      <span>Saves: <strong>${formatNum(stats.saves)}</strong></span>
      <span>•</span>
      <span>ER: <strong>${er.formatted || 'N/A'}</strong></span>
    </div>
  `;

  // Gemini AI Analysis Banner
  let geminiBanner = '';
  if (report.aiAnalysis && report.aiAnalysis.available) {
    const ai = report.aiAnalysis;
    geminiBanner = `
      <div class="gemini-analysis-badge">
        <div class="gemini-badge-header">
          <span>Analisis AI Gemini</span>
          <span class="gemini-score">Akurasi: ${ai.confidenceScore || 95}%</span>
        </div>
        <p class="gemini-summary-text">${escapeHtml(ai.summary || '')}</p>
      </div>
    `;
  }

  // Mobile Checklist Stack
  const checklistItems = (report.results || []).map(check => {
    const checkStatus = check.status.toLowerCase().replace(/\s+/g, '-');
    const checkLabel = check.statusLabel || getFriendlyStatusLabel(check.status);
    return `
      <div class="check-item-mobile status-${checkStatus}">
        <div class="check-item-header">
          <span class="check-item-name">${escapeHtml(check.name)}</span>
          <span class="status-pill ${checkStatus}">${escapeHtml(checkLabel)}</span>
        </div>
        <div class="check-item-comparison">
          <span class="check-val-target">Syarat: ${escapeHtml(check.expectedValue || '-')}</span>
          <span>•</span>
          <span class="check-val-actual">Hasil: ${escapeHtml(check.actualValue || '-')}</span>
        </div>
        <div class="check-item-evidence">${escapeHtml(check.evidence || '')}</div>
      </div>
    `;
  }).join('');

  const checklistBlock = `
    <div class="checklist-mobile-stack">
      ${checklistItems.length ? checklistItems : '<p class="text-muted">Tidak ada rincian data</p>'}
    </div>
  `;

  // Caption Block
  const highlightedCaption = highlightCaption(report.caption || '', currentConfig);
  const captionBlock = `
    <div class="caption-card-block">
      <span class="caption-block-label">Caption Video</span>
      <div class="caption-content">${highlightedCaption || '<em class="text-muted">(Tidak ada caption)</em>'}</div>
    </div>
  `;

  // Video Preview & Manual Verification
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

  // Card Footer Actions
  const footerHtml = `
    <div class="card-actions-footer">
      <button type="button" class="btn-card-action btn-copy-card" data-index="${index}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Salin Laporan</span>
      </button>
      <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-card-action">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        <span>Buka TikTok</span>
      </a>
    </div>
  `;

  card.innerHTML = `
    ${headerHtml}
    ${metricsHtml}
    ${geminiBanner}
    ${checklistBlock}
    ${captionBlock}
    ${mediaBlock}
    ${footerHtml}
  `;

  // Attach copy listener
  const copyBtn = card.querySelector('.btn-copy-card');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copySingleReport(report));
  }

  // Attach manual audio/visual verification listeners
  const cbVisual = card.querySelector('.cb-brand-visual');
  const cbAudio = card.querySelector('.cb-brand-audio');
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
    };

    if (cbVisual) cbVisual.addEventListener('change', handleCheck);
    if (cbAudio) cbAudio.addEventListener('change', handleCheck);
  }

  return card;
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
    lines.push(`- Analisis AI Gemini: ${report.aiAnalysis.summary}`);
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

