'use strict';

// =============================
// KONFIGURASI UTAMA FRONTEND
// =============================
const CONFIG = Object.freeze({
  YEAR: 2027,
  SCHOOL_NAME: 'SEKOLAH KEBANGSAAN SUNGAI TIRAM',
  SCHOOL_LOGO_URL: 'https://iili.io/CLva44f.md.png',
  CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRSBaeb8q0__d2wKSbw9jpVdAFIAUP7KNqzixHqTTnA9yKD3NO0-la8_gCtj6Ex8PJLlb2S1zE-vqi3/pub?gid=1122801319&single=true&output=csv',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzxRYxVp5t3P-xMXJdjWl64afyC8klWCMEG-JO1VdnTB32dVL1aFRffX6NVe_0g181U/exec'
});

const MONTHS = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const CATEGORY_SLUG = {
  'Pentadbiran': 'pentadbiran',
  'Akademik': 'akademik',
  'HEM': 'hem',
  'Kokurikulum': 'kokurikulum',
  'Sukan': 'sukan',
  'Cuti': 'cuti',
  'Lain-lain': 'lain-lain'
};
const POSTER_COLORS = {
  'Pentadbiran': '#D9A62E', 'Akademik': '#3D8DCA', 'HEM': '#A45D9C',
  'Kokurikulum': '#47A778', 'Sukan': '#DD774A', 'Cuti': '#D55668', 'Lain-lain': '#7F8B99'
};

const state = {
  month: new Date().getFullYear() === CONFIG.YEAR ? new Date().getMonth() : 0,
  events: [],
  isAdmin: false,
  token: sessionStorage.getItem('takwimAdminToken') || '',
  posterDataUrl: '',
  posterEvents: []
};

const el = {};
let toastTimer = null;

window.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  applyBranding();
  buildMonthSelect();
  bindEvents();
  await restoreAdminSession();
  await loadEvents({ preferApi: false });
}

function cacheElements() {
  [
    'loadingOverlay','loadingText','schoolLogo','schoolName','adminBtn','posterBtn','printBtn','refreshBtn','logoutBtn',
    'prevMonthBtn','nextMonthBtn','monthSelect','adminBadge','monthTitle','programCount','calendarGrid','emptyMonthMessage',
    'loginModal','loginForm','adminIdInput','adminPasswordInput','eventModal','eventModalTitle','eventForm','eventId','eventDate',
    'eventTime','eventTitle','eventPlace','eventCategory','eventNotes','saveEventBtn','deleteEventBtn','posterModal','posterCanvas',
    'downloadPosterBtn','printPosterBtn','regeneratePosterBtn','toast'
  ].forEach(id => el[id] = document.getElementById(id));
}

function applyBranding() {
  document.title = `${CONFIG.SCHOOL_NAME} — Takwim 2027`;
  el.schoolName.textContent = CONFIG.SCHOOL_NAME;
  el.schoolLogo.src = CONFIG.SCHOOL_LOGO_URL;
}

function buildMonthSelect() {
  el.monthSelect.innerHTML = MONTHS.map((m, i) => `<option value="${i}">${m} ${CONFIG.YEAR}</option>`).join('');
  el.monthSelect.value = String(state.month);
}

function bindEvents() {
  el.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
  el.nextMonthBtn.addEventListener('click', () => changeMonth(1));
  el.monthSelect.addEventListener('change', e => {
    state.month = Number(e.target.value);
    renderCalendar();
  });
  el.refreshBtn.addEventListener('click', () => loadEvents({ preferApi: state.isAdmin }));
  el.printBtn.addEventListener('click', () => window.print());
  el.adminBtn.addEventListener('click', () => {
    if (state.isAdmin) return showToast('Mod admin sudah aktif.', 'success');
    openModal('login');
    setTimeout(() => el.adminIdInput.focus(), 60);
  });
  el.logoutBtn.addEventListener('click', logoutAdmin);
  el.posterBtn.addEventListener('click', generateMonthlyPoster);
  el.regeneratePosterBtn.addEventListener('click', generateMonthlyPoster);
  el.downloadPosterBtn.addEventListener('click', downloadPoster);
  el.printPosterBtn.addEventListener('click', printPoster);
  el.loginForm.addEventListener('submit', handleLogin);
  el.eventForm.addEventListener('submit', saveEvent);
  el.deleteEventBtn.addEventListener('click', deleteEvent);

  document.querySelectorAll('[data-close]').forEach(node => {
    node.addEventListener('click', () => closeModal(node.dataset.close));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
  });
}

function changeMonth(delta) {
  state.month = (state.month + delta + 12) % 12;
  el.monthSelect.value = String(state.month);
  renderCalendar();
}

async function restoreAdminSession() {
  if (!state.token || !isApiConfigured()) {
    setAdminUi(false);
    return;
  }
  try {
    const result = await postApi({ action: 'validateToken', token: state.token });
    setAdminUi(Boolean(result.success));
    if (!result.success) sessionStorage.removeItem('takwimAdminToken');
  } catch (_) {
    setAdminUi(false);
  }
}

function setAdminUi(active) {
  state.isAdmin = active;
  el.adminBadge.classList.toggle('hidden', !active);
  el.logoutBtn.classList.toggle('hidden', !active);
  el.adminBtn.textContent = active ? '✅ Mod Admin Aktif' : '🔐 Sunting Takwim';
  el.posterBtn.disabled = !active;
  el.posterBtn.title = active ? 'Jana poster program bulan dipilih' : 'Log masuk admin untuk menjana poster AI';
  renderCalendar();
}

async function handleLogin(e) {
  e.preventDefault();
  if (!isApiConfigured()) return showToast('Masukkan URL Apps Script dalam app.js terlebih dahulu.', 'error');

  setLoading(true, 'Mengesahkan admin...');
  try {
    const result = await postApi({
      action: 'login',
      id: el.adminIdInput.value.trim(),
      password: el.adminPasswordInput.value
    });
    if (!result.success || !result.token) throw new Error(result.message || 'ID atau password tidak sah.');
    state.token = result.token;
    sessionStorage.setItem('takwimAdminToken', state.token);
    el.adminPasswordInput.value = '';
    closeModal('login');
    setAdminUi(true);
    showToast('Log masuk admin berjaya.', 'success');
    await loadEvents({ preferApi: true });
  } catch (err) {
    showToast(err.message || 'Log masuk gagal.', 'error');
  } finally {
    setLoading(false);
  }
}

function logoutAdmin() {
  state.token = '';
  state.isAdmin = false;
  sessionStorage.removeItem('takwimAdminToken');
  setAdminUi(false);
  showToast('Anda telah log keluar.', 'success');
}

async function loadEvents({ preferApi = false } = {}) {
  setLoading(true, 'Memuatkan takwim...');
  try {
    let records;
    if (preferApi && isApiConfigured()) {
      try { records = await loadFromApi(); } catch (_) { records = await loadFromCsv(); }
    } else {
      try { records = await loadFromCsv(); } catch (csvErr) {
        if (!isApiConfigured()) throw csvErr;
        records = await loadFromApi();
      }
    }
    state.events = normalizeEvents(records).filter(x => x.date.startsWith(`${CONFIG.YEAR}-`));
    renderCalendar();
  } catch (err) {
    console.error(err);
    state.events = [];
    renderCalendar();
    showToast('Gagal memuatkan data takwim. Semak CSV / Apps Script.', 'error');
  } finally {
    setLoading(false);
  }
}

async function loadFromCsv() {
  const url = `${CONFIG.CSV_URL}${CONFIG.CSV_URL.includes('?') ? '&' : '?'}_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CSV HTTP ${res.status}`);
  const text = await res.text();
  return csvToObjects(text);
}

async function loadFromApi() {
  const url = new URL(CONFIG.APPS_SCRIPT_URL);
  url.searchParams.set('action', 'list');
  url.searchParams.set('_', String(Date.now()));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const text = await res.text();
  const data = safeJson(text);
  if (!data.success) throw new Error(data.message || 'Gagal membaca Apps Script.');
  return data.events || [];
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows.shift().map(h => String(h).trim());
  return rows.filter(row => row.some(v => String(v).trim() !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] ?? '');
    return obj;
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  const s = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function normalizeEvents(records) {
  return (records || []).map(r => ({
    id: String(pick(r, ['id','ID']) || '').trim(),
    date: normalizeDateString(pick(r, ['date','TARIKH','tarikh'])),
    title: String(pick(r, ['title','PROGRAM','program']) || '').trim(),
    time: String(pick(r, ['time','MASA','masa']) || '').trim(),
    place: String(pick(r, ['place','TEMPAT','tempat']) || '').trim(),
    category: normalizeCategory(pick(r, ['category','KATEGORI','kategori'])),
    notes: String(pick(r, ['notes','CATATAN','catatan']) || '').trim(),
    updatedAt: String(pick(r, ['updatedAt','UPDATED_AT']) || '').trim()
  })).filter(x => x.date && x.title);
}

function pick(obj, keys) {
  for (const key of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  return '';
}

function normalizeCategory(value) {
  const s = String(value || '').trim();
  const found = Object.keys(CATEGORY_SLUG).find(k => k.toLowerCase() === s.toLowerCase());
  return found || 'Lain-lain';
}

function normalizeDateString(value) {
  if (!value) return '';
  const raw = String(value).trim();
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return '';
}

function renderCalendar() {
  if (!el.calendarGrid) return;
  const year = CONFIG.YEAR;
  const month = state.month;
  el.monthTitle.textContent = `${MONTHS[month].toUpperCase()} ${year}`;

  const monthEvents = state.events.filter(e => dateParts(e.date).month === month + 1);
  el.programCount.textContent = `${monthEvents.length} program`;
  el.emptyMonthMessage.classList.toggle('hidden', monthEvents.length !== 0);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < 42; i++) {
    const dayOffset = i - firstDay + 1;
    let cellYear = year, cellMonth = month, day = dayOffset, outside = false;
    if (dayOffset < 1) { outside = true; cellMonth = month - 1; day = prevMonthDays + dayOffset; }
    else if (dayOffset > daysInMonth) { outside = true; cellMonth = month + 1; day = dayOffset - daysInMonth; }
    if (cellMonth < 0) { cellMonth = 11; cellYear--; }
    if (cellMonth > 11) { cellMonth = 0; cellYear++; }

    const dateKey = `${cellYear}-${String(cellMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEvents = outside ? [] : monthEvents.filter(e => e.date === dateKey);
    const addButton = state.isAdmin && !outside
      ? `<button class="add-day-btn no-print" type="button" data-add-date="${dateKey}" title="Tambah program">+</button>` : '';
    const chips = dayEvents.map(event => {
      const slug = CATEGORY_SLUG[event.category] || 'lain-lain';
      return `<button type="button" class="event-chip cat-${slug}" data-event-id="${escapeHtml(event.id)}">
        <strong>${escapeHtml(event.title)}</strong>
        ${event.time ? `<small>⏱ ${escapeHtml(event.time)}</small>` : ''}
      </button>`;
    }).join('');

    cells.push(`<div class="day-cell ${outside ? 'outside' : ''}">
      <div class="day-top"><span class="day-number">${day}</span>${addButton}</div>
      <div class="events-stack">${chips}</div>
    </div>`);
  }

  el.calendarGrid.innerHTML = cells.join('');
  el.calendarGrid.querySelectorAll('[data-add-date]').forEach(btn => btn.addEventListener('click', () => openEventForAdd(btn.dataset.addDate)));
  el.calendarGrid.querySelectorAll('[data-event-id]').forEach(btn => btn.addEventListener('click', () => openEventById(btn.dataset.eventId)));
}

function openEventForAdd(date) {
  if (!state.isAdmin) return;
  setEventFormReadOnly(false);
  el.eventModalTitle.textContent = 'Tambah Program';
  el.eventId.value = '';
  el.eventDate.value = date;
  el.eventTime.value = '';
  el.eventTitle.value = '';
  el.eventPlace.value = '';
  el.eventCategory.value = 'Akademik';
  el.eventNotes.value = '';
  el.deleteEventBtn.classList.add('hidden');
  el.saveEventBtn.classList.remove('hidden');
  el.saveEventBtn.textContent = 'Simpan Program';
  openModal('event');
  setTimeout(() => el.eventTitle.focus(), 60);
}

function openEventById(id) {
  const event = state.events.find(e => e.id === id);
  if (!event) return;
  el.eventId.value = event.id;
  el.eventDate.value = event.date;
  el.eventTime.value = event.time;
  el.eventTitle.value = event.title;
  el.eventPlace.value = event.place;
  el.eventCategory.value = event.category;
  el.eventNotes.value = event.notes;

  if (state.isAdmin) {
    setEventFormReadOnly(false);
    el.eventModalTitle.textContent = 'Sunting Program';
    el.saveEventBtn.classList.remove('hidden');
    el.deleteEventBtn.classList.remove('hidden');
    el.saveEventBtn.textContent = 'Simpan Perubahan';
  } else {
    setEventFormReadOnly(true);
    el.eventModalTitle.textContent = 'Maklumat Program';
    el.saveEventBtn.classList.add('hidden');
    el.deleteEventBtn.classList.add('hidden');
  }
  openModal('event');
}

function setEventFormReadOnly(readOnly) {
  [el.eventDate,el.eventTime,el.eventTitle,el.eventPlace,el.eventCategory,el.eventNotes].forEach(x => x.disabled = readOnly);
}

async function saveEvent(e) {
  e.preventDefault();
  if (!state.isAdmin) return;
  const payload = {
    action: el.eventId.value ? 'update' : 'add',
    token: state.token,
    id: el.eventId.value,
    date: el.eventDate.value,
    title: el.eventTitle.value.trim(),
    time: el.eventTime.value.trim(),
    place: el.eventPlace.value.trim(),
    category: el.eventCategory.value,
    notes: el.eventNotes.value.trim()
  };
  if (!payload.title || !payload.date) return showToast('Tarikh dan nama program diperlukan.', 'error');

  setLoading(true, payload.action === 'add' ? 'Menyimpan program...' : 'Mengemas kini program...');
  try {
    const result = await postApi(payload);
    if (!result.success) throw new Error(result.message || 'Operasi gagal.');
    closeModal('event');
    showToast(payload.action === 'add' ? 'Program berjaya ditambah.' : 'Program berjaya dikemas kini.', 'success');
    await loadEvents({ preferApi: true });
  } catch (err) {
    if (/token|sesi|session/i.test(err.message)) logoutAdmin();
    showToast(err.message || 'Gagal menyimpan program.', 'error');
  } finally { setLoading(false); }
}

async function deleteEvent() {
  if (!state.isAdmin || !el.eventId.value) return;
  if (!confirm('Adakah anda pasti mahu memadam program ini?')) return;
  setLoading(true, 'Memadam program...');
  try {
    const result = await postApi({ action: 'delete', token: state.token, id: el.eventId.value });
    if (!result.success) throw new Error(result.message || 'Gagal memadam program.');
    closeModal('event');
    showToast('Program berjaya dipadam.', 'success');
    await loadEvents({ preferApi: true });
  } catch (err) {
    showToast(err.message || 'Gagal memadam program.', 'error');
  } finally { setLoading(false); }
}

async function generateMonthlyPoster() {
  if (!state.isAdmin) {
    openModal('login');
    return showToast('Log masuk admin diperlukan untuk menjana poster AI.', 'error');
  }
  const monthEvents = state.events.filter(e => dateParts(e.date).month === state.month + 1);
  if (!monthEvents.length) return showToast('Tiada program direkodkan untuk bulan ini. Poster tidak dapat dijana.', 'error');
  if (!isApiConfigured()) return showToast('Masukkan URL Apps Script dalam app.js terlebih dahulu.', 'error');

  setLoading(true, `AI sedang menyediakan ilustrasi ${MONTHS[state.month]}...`);
  try {
    const result = await postApi({ action: 'generatePoster', token: state.token, month: state.month + 1, year: CONFIG.YEAR });
    if (!result.success) throw new Error(result.message || 'Gagal menjana poster AI.');
    state.posterEvents = normalizeEvents(result.events || monthEvents);
    await drawPoster({
      illustrationBase64: result.illustrationBase64 || '',
      illustrationMimeType: result.illustrationMimeType || 'image/jpeg',
      logoBase64: result.logoBase64 || '',
      logoMimeType: result.logoMimeType || 'image/png',
      prompt: result.prompt || ''
    });
    openModal('poster');
    showToast('Poster AI berjaya dijana.', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Gagal menjana poster AI. Sila cuba lagi.', 'error');
  } finally { setLoading(false); }
}

async function drawPoster(ai) {
  const canvas = el.posterCanvas;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#F7FBFF'); bg.addColorStop(1, '#E7F2FA');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Header band
  const headerGrad = ctx.createLinearGradient(0,0,W,0);
  headerGrad.addColorStop(0, '#0A395F'); headerGrad.addColorStop(.6, '#0E6AA9'); headerGrad.addColorStop(1, '#1591C9');
  ctx.fillStyle = headerGrad; roundRect(ctx, 55, 48, W-110, 235, 38); ctx.fill();

  let logoImg = null;
  try {
    if (ai.logoBase64) logoImg = await loadImage(`data:${ai.logoMimeType};base64,${ai.logoBase64}`);
    else logoImg = await loadImage(CONFIG.SCHOOL_LOGO_URL, true);
  } catch (_) {}
  if (logoImg) drawImageContain(ctx, logoImg, 88, 74, 150, 150);

  ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'top';
  ctx.font = '800 31px Inter, sans-serif';
  ctx.fillText(CONFIG.SCHOOL_NAME, 265, 85);
  ctx.font = '800 57px Nunito, Inter, sans-serif';
  ctx.fillText(`PROGRAM BULAN ${MONTHS[state.month].toUpperCase()} ${CONFIG.YEAR}`, 265, 128);
  ctx.font = '600 25px Inter, sans-serif'; ctx.globalAlpha = .88;
  ctx.fillText('Hebahan Aktiviti dan Program Sekolah', 267, 205); ctx.globalAlpha = 1;

  // AI illustration
  const heroX = 55, heroY = 312, heroW = W - 110, heroH = 455;
  ctx.save(); roundRect(ctx, heroX, heroY, heroW, heroH, 34); ctx.clip();
  ctx.fillStyle = '#DDEAF3'; ctx.fillRect(heroX,heroY,heroW,heroH);
  if (ai.illustrationBase64) {
    try {
      const img = await loadImage(`data:${ai.illustrationMimeType};base64,${ai.illustrationBase64}`);
      drawImageCover(ctx, img, heroX, heroY, heroW, heroH);
    } catch (_) {}
  }
  const overlay = ctx.createLinearGradient(0, heroY, 0, heroY+heroH);
  overlay.addColorStop(0, 'rgba(7,39,64,0.02)'); overlay.addColorStop(1, 'rgba(7,39,64,0.24)');
  ctx.fillStyle = overlay; ctx.fillRect(heroX,heroY,heroW,heroH);
  ctx.restore();

  const events = state.posterEvents.length ? state.posterEvents : state.events.filter(e => dateParts(e.date).month === state.month+1);
  const areaX = 55, areaY = 805, areaW = W-110, areaH = 1025;
  ctx.fillStyle = '#FFFFFF'; roundRect(ctx, areaX, areaY, areaW, areaH, 34); ctx.fill();
  ctx.strokeStyle = '#D9E5EE'; ctx.lineWidth = 2; ctx.stroke();

  ctx.fillStyle = '#153D5B'; ctx.font = '800 30px Inter, sans-serif';
  ctx.fillText(`📅  ${events.length} Program Bulan ${MONTHS[state.month]}`, areaX+34, areaY+28);
  ctx.strokeStyle = '#E2EAF0'; ctx.beginPath(); ctx.moveTo(areaX+34, areaY+78); ctx.lineTo(areaX+areaW-34, areaY+78); ctx.stroke();

  const n = events.length;
  const cols = n <= 8 ? 1 : (n <= 18 ? 2 : 3);
  const gapX = 18, gapY = 13, innerX = areaX+30, innerY = areaY+102;
  const contentW = areaW-60, contentH = areaH-132;
  const rows = Math.ceil(n/cols);
  const colW = (contentW - gapX*(cols-1))/cols;
  const cardH = Math.max(72, Math.min(cols === 1 ? 123 : 112, (contentH-gapY*(rows-1))/Math.max(rows,1)));

  events.forEach((event, i) => {
    const col = i % cols, row = Math.floor(i/cols);
    const x = innerX + col*(colW+gapX), y = innerY + row*(cardH+gapY);
    drawEventCard(ctx, event, x, y, colW, cardH, cols);
  });

  // Footer
  ctx.fillStyle = '#153D5B'; ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText('Sumber: Takwim Sekolah 2027', 60, 1884);
  ctx.textAlign = 'right'; ctx.fillStyle = '#607487'; ctx.font = '500 19px Inter, sans-serif';
  ctx.fillText('Poster dijana daripada data takwim semasa', W-60, 1887); ctx.textAlign = 'left';

  state.posterDataUrl = canvas.toDataURL('image/png', 1.0);
}

function drawEventCard(ctx, event, x, y, w, h, cols) {
  const color = POSTER_COLORS[event.category] || POSTER_COLORS['Lain-lain'];
  ctx.fillStyle = '#F7FAFC'; roundRect(ctx,x,y,w,h,18); ctx.fill();
  ctx.strokeStyle = '#E3EBF1'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = color; roundRect(ctx,x,y,8,h,8); ctx.fill();

  const p = dateParts(event.date);
  const dateBox = cols === 1 ? 76 : 62;
  ctx.fillStyle = color; roundRect(ctx,x+20,y+14,dateBox,h-28,14); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${cols === 1 ? 30 : 25}px Inter, sans-serif`;
  ctx.fillText(String(p.day).padStart(2,'0'), x+20+dateBox/2, y+h/2-10);
  ctx.font = `700 ${cols === 1 ? 14 : 12}px Inter, sans-serif`;
  ctx.fillText(MONTHS[p.month-1].slice(0,3).toUpperCase(), x+20+dateBox/2, y+h/2+18);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';

  const textX = x+20+dateBox+18, textW = w-(textX-x)-18;
  const titleFont = cols === 1 ? 23 : (cols === 2 ? 18 : 15);
  ctx.fillStyle = '#183B55'; ctx.font = `800 ${titleFont}px Inter, sans-serif`;
  drawWrappedText(ctx, event.title, textX, y+15, textW, titleFont+5, cols === 1 ? 2 : 2);

  const metaSize = cols === 1 ? 16 : (cols === 2 ? 14 : 12);
  const metaY = y+h-34;
  ctx.font = `600 ${metaSize}px Inter, sans-serif`; ctx.fillStyle = '#65798B';
  let meta = '';
  if (event.time) meta += `⏱ ${event.time}`;
  if (event.place) meta += `${meta ? '   •   ' : ''}📍 ${event.place}`;
  if (!meta) meta = event.category;
  drawEllipsisText(ctx, meta, textX, metaY, textW);
}

function dateParts(date) {
  const [year,month,day] = String(date).split('-').map(Number);
  return { year, month, day };
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || '').split(/\s+/);
  let line = '', lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines = lines.slice(0,maxLines);
    let last = lines[maxLines-1];
    while (ctx.measureText(last+'…').width > maxWidth && last.length > 2) last = last.slice(0,-1);
    lines[maxLines-1] = last.trim()+'…';
  }
  lines.forEach((ln,i) => ctx.fillText(ln,x,y+i*lineHeight));
}

function drawEllipsisText(ctx, text, x, y, maxWidth) {
  let s = String(text || '');
  if (ctx.measureText(s).width <= maxWidth) return ctx.fillText(s,x,y);
  while (s.length > 3 && ctx.measureText(s+'…').width > maxWidth) s = s.slice(0,-1);
  ctx.fillText(s.trim()+'…',x,y);
}

function roundRect(ctx,x,y,w,h,r) {
  const rr = Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
}

function drawImageCover(ctx,img,x,y,w,h) {
  const s = Math.max(w/img.width,h/img.height), sw = w/s, sh = h/s;
  const sx=(img.width-sw)/2, sy=(img.height-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function drawImageContain(ctx,img,x,y,w,h) {
  const s=Math.min(w/img.width,h/img.height), dw=img.width*s, dh=img.height*s;
  ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function loadImage(src, crossOrigin=false) {
  return new Promise((resolve,reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img); img.onerror = reject; img.src = src;
  });
}

function downloadPoster() {
  if (!state.posterDataUrl) return;
  const a = document.createElement('a');
  a.href = state.posterDataUrl;
  a.download = `Poster-${MONTHS[state.month]}-${CONFIG.YEAR}.png`;
  document.body.appendChild(a); a.click(); a.remove();
}

function printPoster() {
  if (!state.posterDataUrl) return;
  const w = window.open('', '_blank');
  if (!w) return showToast('Popup disekat oleh browser. Benarkan popup untuk mencetak poster.', 'error');
  w.document.write(`<!doctype html><html><head><title>Poster ${MONTHS[state.month]} ${CONFIG.YEAR}</title>
    <style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0;background:white}img{display:block;width:100%;height:auto;max-height:100vh;object-fit:contain}</style>
    </head><body><img src="${state.posterDataUrl}"></body></html>`);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

function openModal(name) {
  const map = { login: el.loginModal, event: el.eventModal, poster: el.posterModal };
  map[name]?.classList.remove('hidden');
}
function closeModal(name) {
  const map = { login: el.loginModal, event: el.eventModal, poster: el.posterModal };
  map[name]?.classList.add('hidden');
}

async function postApi(payload) {
  if (!isApiConfigured()) throw new Error('URL Apps Script belum dikonfigurasi.');
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); }
  catch (_) { throw new Error('Respons Apps Script bukan JSON yang sah. Pastikan deployment Web App betul.'); }
}

function isApiConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(CONFIG.APPS_SCRIPT_URL);
}

function setLoading(show, text='Memuatkan...') {
  el.loadingText.textContent = text;
  el.loadingOverlay.classList.toggle('hidden', !show);
}

function showToast(message, type='') {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.className = `toast ${type}`.trim();
  el.toast.classList.remove('hidden');
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 4200);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
