'use strict';

const CONFIG = Object.freeze({
  YEAR: 2026,
  SCHOOL_NAME: 'SEKOLAH KEBANGSAAN SUNGAI TIRAM',
  SCHOOL_LOGO_URL: 'https://iili.io/CLva44f.md.png',
  CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRSBaeb8q0__d2wKSbw9jpVdAFIAUP7KNqzixHqTTnA9yKD3NO0-la8_gCtj6Ex8PJLlb2S1zE-vqi3/pub?gid=1122801319&single=true&output=csv',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzxRYxVp5t3P-xMXJdjWl64afyC8klWCMEG-JO1VdnTB32dVL1aFRffX6NVe_0g181U/exec'
});

const MONTHS = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const DAYS = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
const CATEGORY_SLUG = {
  'Pentadbiran': 'pentadbiran', 'Akademik': 'akademik', 'HEM': 'hem',
  'Kokurikulum': 'kokurikulum', 'Sukan': 'sukan', 'Cuti': 'cuti', 'Lain-lain': 'lain-lain'
};

// Ditakrif berdasarkan item bernama/ditanda dalam Kalendar Kuda 2026 yang dibekalkan.
// Sesetengah item ialah sambutan/perayaan dan bukan cuti umum di seluruh Malaysia.
const HOLIDAY_PERIODS_2026 = Object.freeze([
  { id:'jan-school', start:'2026-01-01', end:'2026-01-11', title:'Cuti Sekolah', type:'Cuti Sekolah', scope:'Sekolah', icon:'🎒' },
  { id:'jan-newyear', start:'2026-01-01', end:'2026-01-01', title:'Tahun Baharu / Happy New Year', type:'Cuti Umum', scope:'Malaysia', icon:'🎆' },
  { id:'jan-ns', start:'2026-01-14', end:'2026-01-14', title:'Hari Keputeraan Yang di-Pertuan Besar Negeri Sembilan', type:'Cuti Negeri', scope:'Negeri Sembilan', icon:'👑' },
  { id:'jan-israk', start:'2026-01-17', end:'2026-01-17', title:'Israk & Mikraj', type:'Perayaan', scope:'Islam', icon:'🕌' },

  { id:'feb-thaipusam', start:'2026-02-01', end:'2026-02-01', title:'Thaipusam', type:'Perayaan', scope:'Hindu', icon:'🪔' },
  { id:'feb-ft', start:'2026-02-01', end:'2026-02-01', title:'Hari Wilayah Persekutuan', type:'Cuti Negeri', scope:'Wilayah Persekutuan', icon:'🏙️' },
  { id:'feb-spring', start:'2026-02-04', end:'2026-02-04', title:'Beginning of Spring', type:'Perayaan', scope:'Tradisi Cina', icon:'🌱' },
  { id:'feb-valentine', start:'2026-02-14', end:'2026-02-14', title:'Hari Valentine', type:'Sambutan', scope:'Antarabangsa', icon:'💝' },
  { id:'feb-cnyeve', start:'2026-02-16', end:'2026-02-16', title:'Malam Tahun Baharu Cina', type:'Perayaan', scope:'Perayaan Cina', icon:'🏮' },
  { id:'feb-cny1', start:'2026-02-17', end:'2026-02-17', title:'Tahun Baharu Cina', type:'Cuti Umum', scope:'Malaysia', icon:'🧧' },
  { id:'feb-cny2', start:'2026-02-18', end:'2026-02-18', title:'Tahun Baharu Cina - Hari Kedua', type:'Cuti Umum', scope:'Malaysia', icon:'🧧' },
  { id:'feb-ramadan', start:'2026-02-19', end:'2026-02-19', title:'Awal Ramadan', type:'Perayaan', scope:'Islam', icon:'🌙' },
  { id:'feb-merdeka-date', start:'2026-02-20', end:'2026-02-20', title:'Hari Pengisytiharan Tarikh Kemerdekaan', type:'Sambutan', scope:'Peringatan', icon:'🇲🇾' },

  { id:'mar-lantern', start:'2026-03-03', end:'2026-03-03', title:'Lantern Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🏮' },
  { id:'mar-terengganu-install', start:'2026-03-04', end:'2026-03-04', title:'Ulang Tahun Pertabalan Sultan Terengganu', type:'Cuti Negeri', scope:'Terengganu', icon:'👑' },
  { id:'mar-nuzul', start:'2026-03-07', end:'2026-03-07', title:'Nuzul Al-Quran', type:'Perayaan', scope:'Islam', icon:'📖' },
  { id:'mar-women', start:'2026-03-08', end:'2026-03-08', title:'Hari Wanita Sedunia', type:'Sambutan', scope:'Antarabangsa', icon:'🌷' },
  { id:'mar-raya1', start:'2026-03-21', end:'2026-03-21', title:'Hari Raya Puasa', type:'Cuti Umum', scope:'Malaysia', icon:'🌙' },
  { id:'mar-raya2', start:'2026-03-22', end:'2026-03-22', title:'Hari Raya Puasa - Hari Kedua', type:'Cuti Umum', scope:'Malaysia', icon:'🌙' },
  { id:'mar-raya3', start:'2026-03-23', end:'2026-03-23', title:'Hari Raya Puasa - Hari Ketiga', type:'Perayaan', scope:'Perayaan Islam', icon:'🌙' },
  { id:'mar-johor', start:'2026-03-23', end:'2026-03-23', title:'Hari Keputeraan Sultan Johor', type:'Cuti Negeri', scope:'Johor', icon:'👑' },

  { id:'apr-fools', start:'2026-04-01', end:'2026-04-01', title:"April Fool's Day", type:'Sambutan', scope:'Antarabangsa', icon:'🎭' },
  { id:'apr-goodfriday', start:'2026-04-03', end:'2026-04-03', title:'Good Friday', type:'Perayaan', scope:'Kristian', icon:'✝️' },
  { id:'apr-qingming', start:'2026-04-05', end:'2026-04-05', title:'Ching Ming Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🌿' },
  { id:'apr-terengganu', start:'2026-04-26', end:'2026-04-26', title:'Hari Keputeraan Sultan Terengganu', type:'Cuti Negeri', scope:'Terengganu', icon:'👑' },

  { id:'may-labour', start:'2026-05-01', end:'2026-05-01', title:'Hari Pekerja / Labour Day', type:'Cuti Umum', scope:'Malaysia', icon:'🛠️' },
  { id:'may-mother', start:'2026-05-10', end:'2026-05-10', title:'Hari Ibu', type:'Sambutan', scope:'Antarabangsa', icon:'💐' },
  { id:'may-teacher', start:'2026-05-16', end:'2026-05-16', title:'Hari Guru', type:'Sambutan', scope:'Malaysia', icon:'👩‍🏫' },
  { id:'may-perlis', start:'2026-05-17', end:'2026-05-17', title:'Hari Keputeraan Raja Perlis', type:'Cuti Negeri', scope:'Perlis', icon:'👑' },
  { id:'may-zulhijjah', start:'2026-05-18', end:'2026-05-18', title:'Awal Zulhijjah', type:'Perayaan', scope:'Islam', icon:'🌙' },
  { id:'may-holpahang', start:'2026-05-22', end:'2026-05-22', title:'Hari Hol Pahang', type:'Cuti Negeri', scope:'Pahang', icon:'🏴' },
  { id:'may-arafah', start:'2026-05-26', end:'2026-05-26', title:'Hari Arafah', type:'Perayaan', scope:'Islam', icon:'🕋' },
  { id:'may-haji1', start:'2026-05-27', end:'2026-05-27', title:'Hari Raya Haji', type:'Cuti Umum', scope:'Malaysia', icon:'🕌' },
  { id:'may-haji2', start:'2026-05-28', end:'2026-05-28', title:'Hari Raya Haji - Hari Kedua', type:'Perayaan', scope:'Perayaan Islam', icon:'🕌' },
  { id:'may-harvest1', start:'2026-05-30', end:'2026-05-30', title:'Harvest Festival', type:'Cuti Negeri', scope:'Sabah / Labuan', icon:'🌾' },
  { id:'may-harvest2', start:'2026-05-31', end:'2026-05-31', title:'Harvest Festival - Hari Kedua', type:'Cuti Negeri', scope:'Sabah / Labuan', icon:'🌾' },
  { id:'may-wesak', start:'2026-05-31', end:'2026-05-31', title:'Hari Wesak', type:'Cuti Umum', scope:'Malaysia', icon:'🪷' },

  { id:'jun-agong', start:'2026-06-01', end:'2026-06-01', title:'Hari Keputeraan Yang di-Pertuan Agong', type:'Cuti Umum', scope:'Malaysia', icon:'🇲🇾' },
  { id:'jun-gawai1', start:'2026-06-01', end:'2026-06-01', title:'Hari Gawai / Dayak Day', type:'Cuti Negeri', scope:'Sarawak', icon:'🌾' },
  { id:'jun-gawai2', start:'2026-06-02', end:'2026-06-02', title:'Hari Gawai / Dayak Day - Hari Kedua', type:'Cuti Negeri', scope:'Sarawak', icon:'🌾' },
  { id:'jun-muharram', start:'2026-06-17', end:'2026-06-17', title:'1 Muharram / Tahun Baharu Islam', type:'Cuti Umum', scope:'Malaysia', icon:'🌙' },
  { id:'jun-dragonboat', start:'2026-06-19', end:'2026-06-19', title:'Dragon Boat Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🐉' },
  { id:'jun-kedah', start:'2026-06-21', end:'2026-06-21', title:'Hari Keputeraan Sultan Kedah', type:'Cuti Negeri', scope:'Kedah', icon:'👑' },
  { id:'jun-father', start:'2026-06-21', end:'2026-06-21', title:'Hari Bapa', type:'Sambutan', scope:'Antarabangsa', icon:'👨‍👧' },

  { id:'jul-parent', start:'2026-07-05', end:'2026-07-05', title:"Parents' Day", type:'Sambutan', scope:'Antarabangsa', icon:'👨‍👩‍👧' },
  { id:'jul-georgetown', start:'2026-07-07', end:'2026-07-07', title:'Georgetown World Heritage City Day', type:'Sambutan', scope:'Pulau Pinang', icon:'🏛️' },
  { id:'jul-penang', start:'2026-07-11', end:'2026-07-11', title:'Hari Keputeraan Yang di-Pertua Negeri Pulau Pinang', type:'Cuti Negeri', scope:'Pulau Pinang', icon:'👑' },
  { id:'jul-holjohor', start:'2026-07-21', end:'2026-07-21', title:'Hari Hol Almarhum Sultan Iskandar', type:'Cuti Negeri', scope:'Johor', icon:'🕊️' },
  { id:'jul-sarawak', start:'2026-07-22', end:'2026-07-22', title:'Hari Kemerdekaan Sarawak', type:'Cuti Negeri', scope:'Sarawak', icon:'🏴' },
  { id:'jul-pahang', start:'2026-07-30', end:'2026-07-30', title:'Hari Keputeraan Sultan Pahang', type:'Cuti Negeri', scope:'Pahang', icon:'👑' },

  { id:'aug-qixi', start:'2026-08-19', end:'2026-08-19', title:"Chinese Valentine's Day", type:'Perayaan', scope:'Tradisi Cina', icon:'💞' },
  { id:'aug-melaka', start:'2026-08-24', end:'2026-08-24', title:'Hari Keputeraan Yang di-Pertua Negeri Melaka', type:'Cuti Negeri', scope:'Melaka', icon:'👑' },
  { id:'aug-maulid', start:'2026-08-25', end:'2026-08-25', title:'Maulidur Rasul', type:'Cuti Umum', scope:'Malaysia', icon:'🕌' },
  { id:'aug-hungryghost', start:'2026-08-26', end:'2026-08-26', title:'Hungry Ghost Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🏮' },
  { id:'aug-ghost', start:'2026-08-27', end:'2026-08-27', title:'The Ghost Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🏮' },
  { id:'aug-merdeka', start:'2026-08-31', end:'2026-08-31', title:'Hari Merdeka / Independence Day', type:'Cuti Umum', scope:'Malaysia', icon:'🇲🇾' },

  { id:'sep-malaysia', start:'2026-09-16', end:'2026-09-16', title:'Hari Malaysia', type:'Cuti Umum', scope:'Malaysia', icon:'🇲🇾' },
  { id:'sep-midautumn', start:'2026-09-25', end:'2026-09-25', title:'Mid-Autumn Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🥮' },
  { id:'sep-kelantan1', start:'2026-09-29', end:'2026-09-29', title:'Hari Keputeraan Sultan Kelantan', type:'Cuti Negeri', scope:'Kelantan', icon:'👑' },
  { id:'sep-kelantan2', start:'2026-09-30', end:'2026-09-30', title:'Hari Keputeraan Sultan Kelantan - Hari Kedua', type:'Cuti Negeri', scope:'Kelantan', icon:'👑' },

  { id:'oct-sabah', start:'2026-10-03', end:'2026-10-03', title:'Hari Keputeraan Yang di-Pertua Negeri Sabah', type:'Cuti Negeri', scope:'Sabah', icon:'👑' },
  { id:'oct-sarawakgov', start:'2026-10-10', end:'2026-10-10', title:'Hari Keputeraan Yang di-Pertua Negeri Sarawak', type:'Cuti Negeri', scope:'Sarawak', icon:'👑' },
  { id:'oct-ninth', start:'2026-10-18', end:'2026-10-18', title:'Double Ninth Festival', type:'Perayaan', scope:'Tradisi Cina', icon:'🌼' },
  { id:'oct-halloween', start:'2026-10-31', end:'2026-10-31', title:'Halloween', type:'Sambutan', scope:'Antarabangsa', icon:'🎃' },

  { id:'nov-perak', start:'2026-11-06', end:'2026-11-06', title:'Hari Keputeraan Sultan Perak', type:'Cuti Negeri', scope:'Perak', icon:'👑' },
  { id:'nov-deepavali', start:'2026-11-08', end:'2026-11-08', title:'Deepavali', type:'Cuti Umum', scope:'Malaysia', icon:'🪔' },

  { id:'dec-selangor', start:'2026-12-11', end:'2026-12-11', title:'Hari Keputeraan Sultan Selangor', type:'Cuti Negeri', scope:'Selangor', icon:'👑' },
  { id:'dec-solstice', start:'2026-12-22', end:'2026-12-22', title:'Winter Solstice', type:'Perayaan', scope:'Tradisi Cina', icon:'🍡' },
  { id:'dec-eve', start:'2026-12-24', end:'2026-12-24', title:'Christmas Eve', type:'Sambutan', scope:'Kristian', icon:'🎄' },
  { id:'dec-christmas', start:'2026-12-25', end:'2026-12-25', title:'Hari Krismas / Christmas', type:'Cuti Umum', scope:'Malaysia', icon:'🎄' }
]);

const state = {
  month: new Date().getFullYear() === CONFIG.YEAR ? new Date().getMonth() : 0,
  events: [],
  isAdmin: false,
  token: sessionStorage.getItem('takwimAdminToken') || ''
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
    'loadingOverlay','loadingText','schoolLogo','schoolName','adminBtn','printBtn','refreshBtn','logoutBtn',
    'holidayScheduleBtn','holidayScheduleBtn2','prevMonthBtn','nextMonthBtn','monthSelect','adminBadge','monthTitle','programCount',
    'holidayCount','holidayDayCount','calendarGrid','emptyMonthMessage','holidaySummaryTitle','holidaySummaryStats','holidaySummaryList',
    'loginModal','loginForm','adminIdInput','adminPasswordInput','eventModal','eventModalTitle','eventForm','eventId','eventDate',
    'eventTime','eventTitle','eventPlace','eventCategory','eventNotes','saveEventBtn','deleteEventBtn','holidayModal','holidayModalTitle',
    'holidayModalSubtitle','holidayTableBody','downloadHolidayBtn','printHolidayBtn','holidayPrintSheet','holidayPrintLogo','holidayPrintSchool',
    'holidayPrintTitle','holidayPrintBody','toast'
  ].forEach(id => el[id] = document.getElementById(id));
}

function applyBranding() {
  document.title = `${CONFIG.SCHOOL_NAME} — Takwim ${CONFIG.YEAR}`;
  el.schoolName.textContent = CONFIG.SCHOOL_NAME;
  el.schoolLogo.src = CONFIG.SCHOOL_LOGO_URL;
  el.holidayPrintLogo.src = CONFIG.SCHOOL_LOGO_URL;
  el.holidayPrintSchool.textContent = CONFIG.SCHOOL_NAME;
}

function buildMonthSelect() {
  el.monthSelect.innerHTML = MONTHS.map((m, i) => `<option value="${i}">${m} ${CONFIG.YEAR}</option>`).join('');
  el.monthSelect.value = String(state.month);
}

function bindEvents() {
  el.prevMonthBtn.addEventListener('click', () => changeMonth(-1));
  el.nextMonthBtn.addEventListener('click', () => changeMonth(1));
  el.monthSelect.addEventListener('change', e => { state.month = Number(e.target.value); renderCalendar(); });
  el.refreshBtn.addEventListener('click', () => loadEvents({ preferApi: state.isAdmin }));
  el.printBtn.addEventListener('click', () => window.print());
  el.holidayScheduleBtn.addEventListener('click', () => openHolidaySchedule());
  el.holidayScheduleBtn2.addEventListener('click', () => openHolidaySchedule());
  el.downloadHolidayBtn.addEventListener('click', downloadHolidayCsv);
  el.printHolidayBtn.addEventListener('click', printHolidaySchedule);
  el.adminBtn.addEventListener('click', () => {
    if (state.isAdmin) return showToast('Mod admin sudah aktif.', 'success');
    openModal('login');
    setTimeout(() => el.adminIdInput.focus(), 60);
  });
  el.logoutBtn.addEventListener('click', logoutAdmin);
  el.loginForm.addEventListener('submit', handleLogin);
  el.eventForm.addEventListener('submit', saveEvent);
  el.deleteEventBtn.addEventListener('click', deleteEvent);

  document.querySelectorAll('[data-close]').forEach(node => node.addEventListener('click', () => closeModal(node.dataset.close)));
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
  if (!state.token || !isApiConfigured()) { setAdminUi(false); return; }
  try {
    const result = await postApi({ action: 'validateToken', token: state.token });
    setAdminUi(Boolean(result.success));
    if (!result.success) sessionStorage.removeItem('takwimAdminToken');
  } catch (_) { setAdminUi(false); }
}

function setAdminUi(active) {
  state.isAdmin = active;
  el.adminBadge.classList.toggle('hidden', !active);
  el.logoutBtn.classList.toggle('hidden', !active);
  el.adminBtn.textContent = active ? '✅ Mod Admin Aktif' : '🔐 Sunting Takwim';
  renderCalendar();
}

async function handleLogin(e) {
  e.preventDefault();
  if (!isApiConfigured()) return showToast('URL Apps Script belum dikonfigurasi.', 'error');
  setLoading(true, 'Mengesahkan admin...');
  try {
    const result = await postApi({ action: 'login', id: el.adminIdInput.value.trim(), password: el.adminPasswordInput.value });
    if (!result.success || !result.token) throw new Error(result.message || 'ID atau password tidak sah.');
    state.token = result.token;
    sessionStorage.setItem('takwimAdminToken', state.token);
    el.adminPasswordInput.value = '';
    closeModal('login');
    setAdminUi(true);
    showToast('Log masuk admin berjaya.', 'success');
    await loadEvents({ preferApi: true });
  } catch (err) { showToast(err.message || 'Log masuk gagal.', 'error'); }
  finally { setLoading(false); }
}

function logoutAdmin() {
  state.token = '';
  state.isAdmin = false;
  sessionStorage.removeItem('takwimAdminToken');
  setAdminUi(false);
  showToast('Anda telah log keluar.', 'success');
}

async function loadEvents({ preferApi = false } = {}) {
  setLoading(true, 'Memuatkan takwim 2026...');
  try {
    let records;
    if (preferApi && isApiConfigured()) {
      try { records = await loadFromApi(); } catch (_) { records = await loadFromCsv(); }
    } else {
      try { records = await loadFromCsv(); }
      catch (csvErr) { if (!isApiConfigured()) throw csvErr; records = await loadFromApi(); }
    }
    state.events = normalizeEvents(records).filter(x => x.date.startsWith(`${CONFIG.YEAR}-`));
    renderCalendar();
  } catch (err) {
    console.error(err);
    state.events = [];
    renderCalendar();
    showToast('Data program Google Sheet tidak dapat dimuatkan. Cuti 2026 masih boleh dipaparkan.', 'error');
  } finally { setLoading(false); }
}

async function loadFromCsv() {
  const url = `${CONFIG.CSV_URL}${CONFIG.CSV_URL.includes('?') ? '&' : '?'}_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`CSV HTTP ${res.status}`);
  return csvToObjects(await res.text());
}

async function loadFromApi() {
  const url = new URL(CONFIG.APPS_SCRIPT_URL);
  url.searchParams.set('action', 'list');
  url.searchParams.set('_', String(Date.now()));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const data = safeJson(await res.text());
  if (!data.success) throw new Error(data.message || 'Gagal membaca Apps Script.');
  return data.events || [];
}

function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows.shift().map(h => String(h).trim());
  return rows.filter(row => row.some(v => String(v).trim() !== '')).map(row => {
    const obj = {}; headers.forEach((h, i) => obj[h] = row[i] ?? ''); return obj;
  });
}

function parseCsv(text) {
  const rows = []; let row = [], field = '', inQuotes = false;
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

function pick(obj, keys) { for (const key of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]; return ''; }
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
  const year = CONFIG.YEAR, month = state.month;
  const monthEvents = state.events.filter(e => dateParts(e.date).month === month + 1);
  const monthHolidayPeriods = getHolidayPeriodsForMonth(month);
  const monthHolidayEvents = getHolidayEventsForMonth(month);
  const holidayDates = new Set(monthHolidayEvents.filter(h => /^Cuti /.test(h.type)).map(h => h.date));

  el.monthTitle.textContent = `${MONTHS[month].toUpperCase()} ${year}`;
  el.programCount.textContent = String(monthEvents.length);
  el.holidayCount.textContent = String(monthHolidayPeriods.length);
  el.holidayDayCount.textContent = String(holidayDates.size);
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
    const dayHolidays = outside ? [] : monthHolidayEvents.filter(e => e.date === dateKey);
    const today = isTodayKey(dateKey);
    const addButton = state.isAdmin && !outside ? `<button class="add-day-btn no-print" type="button" data-add-date="${dateKey}" title="Tambah program">+</button>` : '';

    const holidayChips = dayHolidays.map(h => {
      const cls = holidayTypeSlug(h.type);
      return `<button type="button" class="holiday-chip holiday-${cls}" data-holiday-id="${escapeHtml(h.periodId)}" title="${escapeHtml(h.scope)}">
        <span>${h.icon || '🎉'}</span><strong>${escapeHtml(h.title)}</strong>
      </button>`;
    }).join('');

    const programChips = dayEvents.map(event => {
      const slug = CATEGORY_SLUG[event.category] || 'lain-lain';
      return `<button type="button" class="event-chip cat-${slug}" data-event-id="${escapeHtml(event.id)}">
        <strong>${escapeHtml(event.title)}</strong>${event.time ? `<small>⏱ ${escapeHtml(event.time)}</small>` : ''}
      </button>`;
    }).join('');

    const weekday = i % 7;
    const classes = ['day-cell', outside ? 'outside' : '', today ? 'today-ish' : '', dayHolidays.length ? 'has-holiday' : '', weekday === 0 ? 'sunday' : '', weekday === 6 ? 'saturday' : ''].filter(Boolean).join(' ');
    cells.push(`<div class="${classes}">
      <div class="day-top"><span class="day-number">${day}</span>${addButton}</div>
      <div class="events-stack">${holidayChips}${programChips}</div>
    </div>`);
  }

  el.calendarGrid.innerHTML = cells.join('');
  el.calendarGrid.querySelectorAll('[data-add-date]').forEach(btn => btn.addEventListener('click', () => openEventForAdd(btn.dataset.addDate)));
  el.calendarGrid.querySelectorAll('[data-event-id]').forEach(btn => btn.addEventListener('click', () => openEventById(btn.dataset.eventId)));
  el.calendarGrid.querySelectorAll('[data-holiday-id]').forEach(btn => btn.addEventListener('click', () => openHolidaySchedule(btn.dataset.holidayId)));
  renderHolidaySummary();
}

function renderHolidaySummary() {
  const periods = getHolidayPeriodsForMonth(state.month);
  el.holidaySummaryTitle.textContent = `Ringkasan ${MONTHS[state.month]} ${CONFIG.YEAR}`;

  const stats = {
    'Cuti Umum': periods.filter(x => x.type === 'Cuti Umum').length,
    'Cuti Negeri': periods.filter(x => x.type === 'Cuti Negeri').length,
    'Cuti Sekolah': periods.filter(x => x.type === 'Cuti Sekolah').reduce((n, x) => n + countDays(x.start, x.end), 0),
    'Perayaan / Sambutan': periods.filter(x => x.type === 'Perayaan' || x.type === 'Sambutan').length
  };
  el.holidaySummaryStats.innerHTML = `
    <div><b>${stats['Cuti Umum']}</b><span>Cuti Umum</span></div>
    <div><b>${stats['Cuti Negeri']}</b><span>Cuti Negeri</span></div>
    <div><b>${stats['Cuti Sekolah']}</b><span>Hari Cuti Sekolah</span></div>
    <div><b>${stats['Perayaan / Sambutan']}</b><span>Perayaan / Sambutan</span></div>`;

  el.holidaySummaryList.innerHTML = periods.length ? periods.map(p => `
    <button class="summary-holiday-item" type="button" data-summary-holiday="${p.id}">
      <span class="summary-icon">${p.icon || '🎉'}</span>
      <span class="summary-copy"><strong>${escapeHtml(formatPeriodDate(p))}</strong><em>${escapeHtml(p.title)}</em></span>
      <span class="type-badge type-${holidayTypeSlug(p.type)}">${escapeHtml(p.type)}</span>
      <small>${escapeHtml(p.scope)}</small>
    </button>`).join('') : '<div class="summary-empty">Tiada cuti/perayaan yang ditandakan dalam sumber untuk bulan ini.</div>';

  el.holidaySummaryList.querySelectorAll('[data-summary-holiday]').forEach(btn => btn.addEventListener('click', () => openHolidaySchedule(btn.dataset.summaryHoliday)));
}

function getHolidayPeriodsForMonth(month) {
  return HOLIDAY_PERIODS_2026.filter(p => dateParts(p.start).month === month + 1 || dateParts(p.end).month === month + 1)
    .slice().sort((a,b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

function getHolidayEventsForMonth(month) {
  const targetMonth = month + 1, out = [];
  getHolidayPeriodsForMonth(month).forEach(p => {
    eachDate(p.start, p.end, date => {
      const parts = dateParts(date);
      if (parts.year === CONFIG.YEAR && parts.month === targetMonth) out.push({ ...p, periodId:p.id, date });
    });
  });
  return out;
}

function eachDate(start, end, cb) {
  let d = localDate(start), last = localDate(end);
  while (d <= last) {
    cb(toDateKey(d));
    d.setDate(d.getDate() + 1);
  }
}
function localDate(key) { const p = dateParts(key); return new Date(p.year, p.month - 1, p.day); }
function toDateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function countDays(start, end) { return Math.round((localDate(end) - localDate(start)) / 86400000) + 1; }
function isTodayKey(key) { const n = new Date(); return n.getFullYear() === CONFIG.YEAR && toDateKey(n) === key; }

function holidayTypeSlug(type) {
  return ({'Cuti Umum':'public','Cuti Negeri':'state','Cuti Sekolah':'school','Perayaan':'festival','Sambutan':'observance'})[type] || 'festival';
}

function openHolidaySchedule(highlightId = '') {
  const periods = getHolidayPeriodsForMonth(state.month);
  el.holidayModalTitle.textContent = `Jadual Cuti • ${MONTHS[state.month]} ${CONFIG.YEAR}`;
  el.holidayModalSubtitle.textContent = `${periods.length} rekod cuti, perayaan dan sambutan berdasarkan Kalendar Kuda 2026.`;
  const rows = buildHolidayRows(periods, highlightId);
  el.holidayTableBody.innerHTML = rows;
  el.holidayPrintBody.innerHTML = buildHolidayRows(periods, '');
  el.holidayPrintTitle.textContent = `JADUAL CUTI • ${MONTHS[state.month].toUpperCase()} ${CONFIG.YEAR}`;
  openModal('holiday');
  if (highlightId) setTimeout(() => el.holidayTableBody.querySelector('.row-highlight')?.scrollIntoView({block:'center',behavior:'smooth'}), 80);
}

function buildHolidayRows(periods, highlightId) {
  if (!periods.length) return '<tr><td colspan="5" class="table-empty">Tiada rekod untuk bulan ini.</td></tr>';
  return periods.map(p => `<tr class="${p.id === highlightId ? 'row-highlight' : ''}">
    <td><strong>${escapeHtml(formatPeriodDate(p))}</strong></td>
    <td>${escapeHtml(formatPeriodDay(p))}</td>
    <td><span class="table-icon">${p.icon || '🎉'}</span>${escapeHtml(p.title)}</td>
    <td><span class="type-badge type-${holidayTypeSlug(p.type)}">${escapeHtml(p.type)}</span></td>
    <td>${escapeHtml(p.scope)}</td>
  </tr>`).join('');
}

function formatPeriodDate(p) {
  const s = dateParts(p.start), e = dateParts(p.end);
  if (p.start === p.end) return `${s.day} ${MONTHS[s.month-1]}`;
  if (s.month === e.month) return `${s.day}–${e.day} ${MONTHS[s.month-1]}`;
  return `${s.day} ${MONTHS[s.month-1]} – ${e.day} ${MONTHS[e.month-1]}`;
}
function formatPeriodDay(p) {
  const s = localDate(p.start), e = localDate(p.end);
  if (p.start === p.end) return DAYS[s.getDay()];
  return `${DAYS[s.getDay()]}–${DAYS[e.getDay()]}`;
}

function downloadHolidayCsv() {
  const periods = getHolidayPeriodsForMonth(state.month);
  const rows = [['Tarikh','Hari','Cuti / Perayaan','Jenis','Skop'], ...periods.map(p => [formatPeriodDate(p),formatPeriodDay(p),p.title,p.type,p.scope])];
  const csv = '\uFEFF' + rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Jadual_Cuti_${MONTHS[state.month]}_${CONFIG.YEAR}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvEscape(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
function printHolidaySchedule() {
  const periods = getHolidayPeriodsForMonth(state.month);
  el.holidayPrintBody.innerHTML = buildHolidayRows(periods, '');
  el.holidayPrintTitle.textContent = `JADUAL CUTI • ${MONTHS[state.month].toUpperCase()} ${CONFIG.YEAR}`;
  document.body.classList.add('print-holidays');
  window.print();
  setTimeout(() => document.body.classList.remove('print-holidays'), 300);
}

function openEventForAdd(date) {
  if (!state.isAdmin) return;
  setEventFormReadOnly(false);
  el.eventModalTitle.textContent = 'Tambah Program';
  el.eventId.value = ''; el.eventDate.value = date; el.eventTime.value = ''; el.eventTitle.value = '';
  el.eventPlace.value = ''; el.eventCategory.value = 'Akademik'; el.eventNotes.value = '';
  el.deleteEventBtn.classList.add('hidden'); el.saveEventBtn.classList.remove('hidden'); el.saveEventBtn.textContent = 'Simpan Program';
  openModal('event'); setTimeout(() => el.eventTitle.focus(), 60);
}

function openEventById(id) {
  const event = state.events.find(e => e.id === id); if (!event) return;
  el.eventId.value = event.id; el.eventDate.value = event.date; el.eventTime.value = event.time; el.eventTitle.value = event.title;
  el.eventPlace.value = event.place; el.eventCategory.value = event.category; el.eventNotes.value = event.notes;
  if (state.isAdmin) {
    setEventFormReadOnly(false); el.eventModalTitle.textContent = 'Sunting Program';
    el.saveEventBtn.classList.remove('hidden'); el.deleteEventBtn.classList.remove('hidden'); el.saveEventBtn.textContent = 'Simpan Perubahan';
  } else {
    setEventFormReadOnly(true); el.eventModalTitle.textContent = 'Maklumat Program'; el.saveEventBtn.classList.add('hidden'); el.deleteEventBtn.classList.add('hidden');
  }
  openModal('event');
}
function setEventFormReadOnly(readOnly) { [el.eventDate,el.eventTime,el.eventTitle,el.eventPlace,el.eventCategory,el.eventNotes].forEach(x => x.disabled = readOnly); }

async function saveEvent(e) {
  e.preventDefault(); if (!state.isAdmin) return;
  const payload = {
    action: el.eventId.value ? 'update' : 'add', token: state.token, id: el.eventId.value,
    date: el.eventDate.value, title: el.eventTitle.value.trim(), time: el.eventTime.value.trim(),
    place: el.eventPlace.value.trim(), category: el.eventCategory.value, notes: el.eventNotes.value.trim()
  };
  if (!payload.title || !payload.date) return showToast('Tarikh dan nama program diperlukan.', 'error');
  setLoading(true, payload.action === 'add' ? 'Menyimpan program...' : 'Mengemas kini program...');
  try {
    const result = await postApi(payload); if (!result.success) throw new Error(result.message || 'Operasi gagal.');
    closeModal('event'); showToast(payload.action === 'add' ? 'Program berjaya ditambah.' : 'Program berjaya dikemas kini.', 'success');
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
    closeModal('event'); showToast('Program berjaya dipadam.', 'success'); await loadEvents({ preferApi: true });
  } catch (err) { showToast(err.message || 'Gagal memadam program.', 'error'); }
  finally { setLoading(false); }
}

function dateParts(date) { const [year,month,day] = String(date).split('-').map(Number); return { year, month, day }; }
function openModal(name) { ({ login: el.loginModal, event: el.eventModal, holiday: el.holidayModal })[name]?.classList.remove('hidden'); }
function closeModal(name) { ({ login: el.loginModal, event: el.eventModal, holiday: el.holidayModal })[name]?.classList.add('hidden'); }

async function postApi(payload) {
  if (!isApiConfigured()) throw new Error('URL Apps Script belum dikonfigurasi.');
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow'
  });
  const data = safeJson(await res.text());
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}
function safeJson(text) { try { return JSON.parse(text); } catch (_) { throw new Error('Respons Apps Script bukan JSON yang sah. Pastikan deployment Web App betul.'); } }
function isApiConfigured() { return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(CONFIG.APPS_SCRIPT_URL); }
function setLoading(show, text='Memuatkan...') { el.loadingText.textContent = text; el.loadingOverlay.classList.toggle('hidden', !show); }
function showToast(message, type='') {
  clearTimeout(toastTimer); el.toast.textContent = message; el.toast.className = `toast ${type}`.trim(); el.toast.classList.remove('hidden');
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 4200);
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
