// TikTok Validator Kacery - Discord Activity Logger
// Mengirimkan notifikasi dan rekap aktivitas interaksi ke Discord Webhook secara realtime

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

// Warna Discord Embed (Hex to Decimal)
const THEME_COLORS = {
  KACERY_PINK: 15221651,    // #E84393 - Warna utama Kacery
  SUCCESS_GREEN: 47252,     // #00B894 - Sudah Sesuai
  DANGER_RED: 14037041,     // #D63031 - Belum Sesuai
  WARNING_ORANGE: 16098851, // #F59E0B - Perlu Cek
  ACTION_BLUE: 623843,      // #0984E3 - Aksi / Tombol
  CONFIG_PURPLE: 7101671    // #6C5CE7 - Pengaturan
};

// Queue system untuk mencegah Discord 429 Too Many Requests
const sendQueue = [];
let isProcessingQueue = false;

// Truncate helper untuk memastikan tidak melewati limit Discord
function safeText(str, maxLength = 1000) {
  if (!str) return '-';
  const text = String(str).trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Format waktu Indonesia (WIB)
function getFormattedWIB(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(date) + ' WIB';
  } catch (e) {
    return date.toISOString();
  }
}

/**
 * Mengirim payload ke Discord dengan antrean (FIFO queue)
 */
async function processQueue() {
  if (isProcessingQueue || sendQueue.length === 0) return;
  isProcessingQueue = true;

  while (sendQueue.length > 0) {
    const item = sendQueue.shift();
    const webhook = item.webhookUrl || WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
    if (!webhook) {
      if (item.resolve) item.resolve({ success: false, error: 'DISCORD_WEBHOOK_URL tidak dikonfigurasi' });
      continue;
    }

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });

      if (response.status === 429) {
        // Rate limited - ambil waktu tunggu dari header Discord atau default 2 detik
        const retryAfter = Number(response.headers.get('retry-after')) || 2;
        console.warn(`[Discord Logger] Rate limited, waiting ${retryAfter}s...`);
        sendQueue.unshift(item); // Kembalikan ke antrean
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Discord Logger] Response not OK (${response.status}):`, errorText);
        if (item.resolve) item.resolve({ success: false, status: response.status });
      } else {
        if (item.resolve) item.resolve({ success: true });
      }
    } catch (err) {
      console.warn('[Discord Logger] Fetch error:', err.message);
      if (item.resolve) item.resolve({ success: false, error: err.message });
    }

    // Jeda antar pengiriman agar aman dari rate limit (~350ms)
    await new Promise((r) => setTimeout(r, 350));
  }

  isProcessingQueue = false;
}

/**
 * Enqueue pengiriman Discord Webhook (non-blocking)
 */
export function enqueueDiscordEmbed(payload, webhookUrl = null) {
  return new Promise((resolve) => {
    sendQueue.push({ payload, webhookUrl, resolve });
    processQueue();
  });
}

/**
 * Helper: Format embed sesuai jenis aktivitas
 */
export async function logActivityToDiscord(eventData = {}) {
  const {
    type = 'ACTION',
    action = 'Interaksi Pengguna',
    clientInfo = {},
    details = {}
  } = eventData;

  const nowWIB = getFormattedWIB();
  const device = clientInfo.device || 'Tidak Diketahui';
  const os = clientInfo.os || 'Tidak Diketahui';
  const browser = clientInfo.browser || 'Tidak Diketahui';
  const screen = clientInfo.screen || '-';
  const ip = clientInfo.ip || '-';
  const isPwa = clientInfo.isPwa ? '📱 PWA Standalone' : '🌐 Browser Tab';

  let embed = {
    color: THEME_COLORS.KACERY_PINK,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'TikTok Validator Kacery • Realtime Activity Monitor',
      icon_url: 'https://raw.githubusercontent.com/favicon.ico'
    }
  };

  switch (type) {
    case 'SESSION_OPEN': {
      embed.title = '🌸 Web App Sedang Dibuka';
      embed.color = THEME_COLORS.KACERY_PINK;
      embed.description = `Pengguna **Kacery** baru saja membuka aplikasi **TikTok Validator**.\nMode: **${isPwa}**`;
      embed.fields = [
        { name: '⏰ Waktu Akses', value: nowWIB, inline: false },
        { name: '📱 Perangkat & OS', value: `${device} • ${os}`, inline: true },
        { name: '🌐 Browser & Layar', value: `${browser} • ${screen}`, inline: true },
        { name: '🎯 Campaign Aktif', value: safeText(details.campaignName || 'Campaign Vape Fumakilla', 200), inline: false }
      ];
      if (details.campaignConfig) {
        const cfg = details.campaignConfig;
        embed.fields.push({
          name: '📋 Syarat Aktif',
          value: `• Min Views: **${cfg.minViews || 0}**\n• Min Likes: **${cfg.minLikes || 0}**\n• Min Followers: **${cfg.minFollowers || 0}**\n• Tagar: ${safeText((cfg.requiredHashtags || []).join(' '), 300)}\n• Mention: ${safeText((cfg.requiredMentions || []).join(' '), 200)}`,
          inline: false
        });
      }
      break;
    }

    case 'BUTTON_CLICK': {
      embed.title = `🔘 Tombol Ditekan: ${safeText(action, 100)}`;
      embed.color = THEME_COLORS.ACTION_BLUE;
      embed.description = `Pengguna menekan tombol **${action}**.`;
      embed.fields = [
        { name: '⏰ Waktu', value: nowWIB, inline: true },
        { name: '📱 Perangkat', value: `${device} (${browser})`, inline: true }
      ];
      if (details.info) {
        embed.fields.push({ name: 'ℹ️ Keterangan', value: safeText(details.info, 1000), inline: false });
      }
      if (details.value) {
        embed.fields.push({ name: '📝 Data / Nilai', value: `\`\`\`\n${safeText(details.value, 900)}\n\`\`\``, inline: false });
      }
      break;
    }

    case 'INPUT_CHANGE': {
      embed.title = '📝 Input Link Video TikTok Diperbarui';
      embed.color = THEME_COLORS.ACTION_BLUE;
      const count = details.totalLinks || 0;
      embed.description = `Pengguna memasukkan / memperbarui daftar link TikTok (**${count} link terdeteksi**).`;
      embed.fields = [
        { name: '⏰ Waktu', value: nowWIB, inline: true },
        { name: '🔢 Total Link', value: `${count} video`, inline: true }
      ];
      if (Array.isArray(details.sampleUrls) && details.sampleUrls.length > 0) {
        const urlList = details.sampleUrls.slice(0, 8).map((u, i) => `${i + 1}. ${u}`).join('\n');
        const remaining = details.sampleUrls.length > 8 ? `\n*...dan ${details.sampleUrls.length - 8} link lainnya*` : '';
        embed.fields.push({
          name: '🔗 Daftar Link yang Di-input',
          value: safeText(urlList + remaining, 1000),
          inline: false
        });
      }
      break;
    }

    case 'CONFIG_UPDATE': {
      embed.title = '⚙️ Pengaturan Campaign Diperbarui';
      embed.color = THEME_COLORS.CONFIG_PURPLE;
      embed.description = `Pengguna menyimpan perubahan pada **Pengaturan Campaign**: *${details.name || 'Campaign'}*.`;
      embed.fields = [
        { name: '⏰ Waktu', value: nowWIB, inline: true },
        { name: '🎯 Nama Campaign', value: safeText(details.name, 100), inline: true },
        {
          name: '📊 Target Metrik',
          value: `• Min Followers: **${details.minFollowers || 0}**\n• Min Views: **${details.minViews || 0}**\n• Min Likes: **${details.minLikes || 0}**`,
          inline: false
        },
        {
          name: '🏷️ Tagar & Mention Wajib',
          value: `• Tagar: ${safeText((details.requiredHashtags || []).join(' ') || 'Tidak ada', 400)}\n• Mention: ${safeText((details.requiredMentions || []).join(' ') || 'Tidak ada', 300)}`,
          inline: false
        },
        {
          name: '🔍 Brand & Akun Khusus',
          value: `• Brand: ${safeText((details.brandKeywords || []).join(', ') || 'Semua', 200)}\n• Lokasi Cek: ${details.brandCheckLocation || 'caption_or_video'}\n• Username Affiliate: ${safeText((details.expectedUsernames || []).join(', ') || 'Semua diterima', 200)}`,
          inline: false
        }
      ];
      break;
    }

    case 'VALIDATION_START': {
      embed.title = '🚀 Memulai Validasi Video';
      embed.color = THEME_COLORS.KACERY_PINK;
      const count = details.totalVideos || 0;
      embed.description = `Proses validasi dimulai untuk **${count} link video TikTok**.\nCampaign: **${details.campaignName || 'Campaign Aktif'}**`;
      embed.fields = [
        { name: '⏰ Waktu Mulai', value: nowWIB, inline: true },
        { name: '🔢 Total Video', value: `${count} video`, inline: true },
        { name: '🤖 Status AI Jorje', value: details.aiActive ? '🟢 Aktif' : '⚪ Standby', inline: true }
      ];
      if (Array.isArray(details.urls) && details.urls.length > 0) {
        const preview = details.urls.slice(0, 5).map((u, i) => `${i + 1}. ${u}`).join('\n');
        const more = details.urls.length > 5 ? `\n*...dan ${details.urls.length - 5} link lainnya*` : '';
        embed.fields.push({
          name: '🔗 Link yang Divalidasi',
          value: safeText(preview + more, 1000),
          inline: false
        });
      }
      break;
    }

    case 'VALIDATION_FINISH': {
      const summary = details.summary || { total: 0, pass: 0, fail: 0, needReview: 0 };
      const allPass = summary.fail === 0 && summary.needReview === 0 && summary.total > 0;
      
      embed.title = allPass 
        ? '🎉 Validasi Selesai: Semua Sudah Sesuai!'
        : '📊 Validasi Selesai (Rekap Hasil)';
      embed.color = allPass ? THEME_COLORS.SUCCESS_GREEN : (summary.fail > 0 ? THEME_COLORS.DANGER_RED : THEME_COLORS.WARNING_ORANGE);
      
      embed.description = `Proses validasi **${summary.total} video** telah selesai.\nCampaign: **${details.campaignName || 'Campaign Aktif'}**`;
      embed.fields = [
        { name: '⏰ Waktu Selesai', value: nowWIB, inline: false },
        { name: '✅ Sudah Sesuai', value: `**${summary.pass} video**`, inline: true },
        { name: '❌ Belum Sesuai', value: `**${summary.fail} video**`, inline: true },
        { name: '⚠️ Perlu Cek', value: `**${summary.needReview} video**`, inline: true }
      ];

      // Rincian per video
      if (Array.isArray(details.videoResults) && details.videoResults.length > 0) {
        const rows = details.videoResults.slice(0, 8).map((v, i) => {
          const icon = v.status === 'PASS' ? '✅' : (v.status === 'FAIL' ? '❌' : '⚠️');
          const erText = v.engagementRate !== undefined ? ` • ER: ${v.engagementRate}%` : '';
          const viewsText = v.views !== undefined ? `Views: ${Number(v.views).toLocaleString('id-ID')}` : '';
          const note = v.failedReasons?.length ? ` (${v.failedReasons.join(', ')})` : '';
          return `${i + 1}. ${icon} **@${v.username || 'unknown'}** (${viewsText}${erText})${note}`;
        });
        const more = details.videoResults.length > 8 ? `\n*...dan ${details.videoResults.length - 8} video lainnya*` : '';
        embed.fields.push({
          name: '📋 Rincian Hasil Tiap Video',
          value: safeText(rows.join('\n') + more, 1000),
          inline: false
        });
      }

      if (details.aiSummary) {
        embed.fields.push({
          name: '🤖 Catatan AI Jorje',
          value: safeText(details.aiSummary, 500),
          inline: false
        });
      }
      break;
    }

    default: {
      embed.title = `⚡ Aktivitas: ${safeText(action, 100)}`;
      embed.color = THEME_COLORS.ACTION_BLUE;
      embed.description = safeText(details.message || action, 1000);
      embed.fields = [
        { name: '⏰ Waktu', value: nowWIB, inline: true },
        { name: '📱 Perangkat', value: `${device} (${browser})`, inline: true }
      ];
      break;
    }
  }

  const payload = {
    username: 'TikTok Validator Kacery',
    avatar_url: 'https://raw.githubusercontent.com/favicon.ico',
    embeds: [embed]
  };

  return enqueueDiscordEmbed(payload);
}

