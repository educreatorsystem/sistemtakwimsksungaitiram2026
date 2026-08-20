/**
 * TAKWIM SEKOLAH 2027 + AI POSTER BACKEND
 * Google Apps Script (bound atau standalone)
 *
 * Spreadsheet: TAKWIM
 * Sheet/tab: Takwim2027
 * Spreadsheet ID: 1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E
 * GID / sheetId: 1122801319
 *
 * Frontend membaca CSV untuk paparan biasa.
 * Apps Script ini digunakan untuk login, list segera, tambah/sunting/padam dan AI illustration.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E',
  SHEET_NAME: 'Takwim2027',
  YEAR: 2027,
  TIMEZONE: 'Asia/Kuala_Lumpur',
  SCHOOL_NAME: 'SEKOLAH KEBANGSAAN SUNGAI TIRAM',
  SCHOOL_LOGO_URL: 'https://iili.io/CLva44f.md.png',
  ADMIN_SESSION_SECONDS: 21600, // 6 jam
  GEMINI_MODEL: 'gemini-3.1-flash-image',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/interactions'
});

const HEADERS = ['ID', 'TARIKH', 'PROGRAM', 'MASA', 'TEMPAT', 'KATEGORI', 'CATATAN', 'UPDATED_AT'];
const CATEGORIES = ['Pentadbiran', 'Akademik', 'HEM', 'Kokurikulum', 'Sukan', 'Cuti', 'Lain-lain'];

// Password asal TIDAK disimpan dalam kod ini.
// Nilai berikut ialah SHA-256 bagi password yang diberi pengguna + salt rawak.
const DEFAULT_ADMIN_ID = 'gurucemerlang';
const DEFAULT_ADMIN_SALT = 'd64e1287ee43504263ce87bfcebdc334';
const DEFAULT_ADMIN_PASSWORD_HASH = '260cd7f8b439d1dd0874548e4aff4f51d39988fa48640be08f4f00dfaa693951';

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health').trim();
    if (action === 'health') {
      return json_({
        success: true,
        service: 'Takwim Sekolah 2027 API',
        year: CONFIG.YEAR,
        sheet: CONFIG.SHEET_NAME,
        aiModel: CONFIG.GEMINI_MODEL,
        timestamp: now_()
      });
    }
    if (action === 'list') {
      return json_({ success: true, events: getEvents_(), timestamp: now_() });
    }
    return json_({ success: false, message: 'Action GET tidak dikenali.' });
  } catch (err) {
    return jsonError_(err);
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || '').trim();

    switch (action) {
      case 'login':
        return json_(login_(body));
      case 'validateToken':
        return json_({ success: isValidToken_(body.token) });
      case 'add':
        requireAdmin_(body.token);
        return json_(addEvent_(body));
      case 'update':
        requireAdmin_(body.token);
        return json_(updateEvent_(body));
      case 'delete':
        requireAdmin_(body.token);
        return json_(deleteEvent_(body));
      case 'generatePoster':
        requireAdmin_(body.token); // elak penggunaan API AI oleh orang luar
        return json_(generatePosterIllustration_(body));
      default:
        return json_({ success: false, message: 'Action POST tidak dikenali.' });
    }
  } catch (err) {
    return jsonError_(err);
  }
}

/**
 * RUN SEKALI selepas paste kod.
 * - menyediakan header
 * - menetapkan format dan data validation
 * - menyimpan hash admin dalam Script Properties
 */
function setupTakwimSystem() {
  const sheet = getSheet_();
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  const hasAny = firstRow.some(v => String(v).trim() !== '');

  if (!hasAny) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    const normalized = firstRow.map(v => String(v).trim().toUpperCase());
    const expected = HEADERS.map(v => v.toUpperCase());
    if (JSON.stringify(normalized) !== JSON.stringify(expected)) {
      throw new Error('Baris 1 sudah mempunyai data/header lain. Sila pastikan header ialah: ' + HEADERS.join(' | '));
    }
  }

  sheet.setFrozenRows(1);
  sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#0f5b9a').setFontColor('#ffffff');
  sheet.getRange('B2:B1000').setNumberFormat('@');
  sheet.getRange('H2:H1000').setNumberFormat('@');

  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CATEGORIES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('F2:F1000').setDataValidation(categoryRule);

  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 115);
  sheet.setColumnWidth(3, 330);
  sheet.setColumnWidth(4, 125);
  sheet.setColumnWidth(5, 220);
  sheet.setColumnWidth(6, 145);
  sheet.setColumnWidth(7, 320);
  sheet.setColumnWidth(8, 165);

  setupAdminProperties_();

  return {
    success: true,
    message: 'Setup Takwim2027 selesai.',
    sheet: CONFIG.SHEET_NAME,
    headers: HEADERS
  };
}

/**
 * Masukkan Gemini API key di Script Properties:
 * Apps Script > Project Settings > Script Properties
 * Key: GEMINI_API_KEY
 * Value: API key anda
 *
 * Atau, untuk setup sekali sahaja, isi key di bawah, RUN fungsi ini,
 * kemudian padam key daripada kod dan save semula.
 */
function setGeminiApiKeyOnce() {
  const apiKey = 'MASUKKAN_GEMINI_API_KEY_DI_SINI';
  if (!apiKey || apiKey.indexOf('MASUKKAN_') === 0) {
    throw new Error('Masukkan Gemini API key dahulu.');
  }
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey.trim());
  return 'GEMINI_API_KEY berjaya disimpan dalam Script Properties. Sekarang padam API key daripada fungsi ini.';
}

function testConnection() {
  return {
    success: true,
    spreadsheet: SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getName(),
    sheet: getSheet_().getName(),
    events: getEvents_().length,
    aiKeyConfigured: Boolean(PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')),
    timestamp: now_()
  };
}

function setupAdminProperties_() {
  PropertiesService.getScriptProperties().setProperties({
    ADMIN_ID: DEFAULT_ADMIN_ID,
    ADMIN_SALT: DEFAULT_ADMIN_SALT,
    ADMIN_PASSWORD_HASH: DEFAULT_ADMIN_PASSWORD_HASH
  }, false);
}

function login_(body) {
  const props = PropertiesService.getScriptProperties();
  const expectedId = props.getProperty('ADMIN_ID') || DEFAULT_ADMIN_ID;
  const salt = props.getProperty('ADMIN_SALT') || DEFAULT_ADMIN_SALT;
  const expectedHash = props.getProperty('ADMIN_PASSWORD_HASH') || DEFAULT_ADMIN_PASSWORD_HASH;

  const id = String(body.id || '').trim();
  const password = String(body.password || '');
  const actualHash = hashPassword_(password, salt);

  if (!constantTimeEqual_(id, expectedId) || !constantTimeEqual_(actualHash, expectedHash)) {
    Utilities.sleep(250);
    return { success: false, message: 'ID atau password tidak sah.' };
  }

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const session = JSON.stringify({ id: expectedId, createdAt: Date.now() });
  CacheService.getScriptCache().put(sessionKey_(token), session, CONFIG.ADMIN_SESSION_SECONDS);

  return {
    success: true,
    message: 'Log masuk admin berjaya.',
    token: token,
    expiresIn: CONFIG.ADMIN_SESSION_SECONDS
  };
}

function isValidToken_(token) {
  if (!token) return false;
  return Boolean(CacheService.getScriptCache().get(sessionKey_(String(token))));
}

function requireAdmin_(token) {
  if (!isValidToken_(token)) throw new Error('Sesi admin tidak sah atau telah tamat. Sila log masuk semula.');
}

function sessionKey_(token) {
  return 'TAKWIM_ADMIN_' + token;
}

function hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password) + ':' + String(salt),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function constantTimeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i % Math.max(a.length, 1)) || 0) ^ (b.charCodeAt(i % Math.max(b.length, 1)) || 0);
  }
  return diff === 0;
}

function addEvent_(body) {
  const event = validateEventInput_(body);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_();
    const id = makeEventId_();
    sheet.appendRow([id, event.date, event.title, event.time, event.place, event.category, event.notes, now_()]);
    return { success: true, message: 'Program berjaya ditambah.', id: id };
  } finally {
    lock.releaseLock();
  }
}

function updateEvent_(body) {
  const id = clean_(body.id, 200);
  if (!id) throw new Error('ID program diperlukan.');
  const event = validateEventInput_(body);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_();
    const row = findRowById_(sheet, id);
    if (!row) throw new Error('Program tidak ditemui.');
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([[
      id, event.date, event.title, event.time, event.place, event.category, event.notes, now_()
    ]]);
    return { success: true, message: 'Program berjaya dikemas kini.', id: id };
  } finally {
    lock.releaseLock();
  }
}

function deleteEvent_(body) {
  const id = clean_(body.id, 200);
  if (!id) throw new Error('ID program diperlukan.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_();
    const row = findRowById_(sheet, id);
    if (!row) throw new Error('Program tidak ditemui.');
    sheet.deleteRow(row);
    return { success: true, message: 'Program berjaya dipadam.', id: id };
  } finally {
    lock.releaseLock();
  }
}

function validateEventInput_(body) {
  const date = validateDate2027_(body.date);
  const title = clean_(body.title, 180);
  if (!title) throw new Error('Nama program diperlukan.');

  let category = clean_(body.category, 40) || 'Lain-lain';
  if (CATEGORIES.indexOf(category) < 0) category = 'Lain-lain';

  return {
    date: date,
    title: title,
    time: clean_(body.time, 80),
    place: clean_(body.place, 180),
    category: category,
    notes: clean_(body.notes, 500)
  };
}

function validateDate2027_(value) {
  const s = String(value || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('Format tarikh mesti YYYY-MM-DD.');
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (y !== CONFIG.YEAR) throw new Error('Tarikh mesti dalam tahun ' + CONFIG.YEAR + '.');
  const test = new Date(y, mo - 1, d);
  if (test.getFullYear() !== y || test.getMonth() !== mo - 1 || test.getDate() !== d) throw new Error('Tarikh tidak sah.');
  return s;
}

function getEvents_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values.map(rowToEvent_).filter(function(e) { return e.id && e.date && e.title; });
}

function rowToEvent_(row) {
  return {
    id: String(row[0] || '').trim(),
    date: dateToString_(row[1]),
    title: String(row[2] || '').trim(),
    time: String(row[3] || '').trim(),
    place: String(row[4] || '').trim(),
    category: normalizeCategory_(row[5]),
    notes: String(row[6] || '').trim(),
    updatedAt: row[7] instanceof Date ? Utilities.formatDate(row[7], CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss') : String(row[7] || '').trim()
  };
}

function dateToString_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const s = String(value || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + pad2_(m[2]) + '-' + pad2_(m[3]);
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return m[3] + '-' + pad2_(m[2]) + '-' + pad2_(m[1]);
  return '';
}

function normalizeCategory_(value) {
  const s = String(value || '').trim();
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].toLowerCase() === s.toLowerCase()) return CATEGORIES[i];
  }
  return 'Lain-lain';
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) if (String(values[i][0]).trim() === id) return i + 2;
  return 0;
}

function makeEventId_() {
  return 'EVT-' + CONFIG.YEAR + '-' + Utilities.getUuid().split('-')[0].toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
}

function generatePosterIllustration_(body) {
  const month = Number(body.month);
  const year = Number(body.year || CONFIG.YEAR);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Bulan tidak sah.');
  if (year !== CONFIG.YEAR) throw new Error('Sistem ini hanya untuk tahun ' + CONFIG.YEAR + '.');

  const events = getEvents_().filter(function(e) {
    const m = e.date.match(/^(\d{4})-(\d{2})-/);
    return m && Number(m[1]) === year && Number(m[2]) === month;
  }).sort(function(a,b) { return a.date.localeCompare(b.date); });

  if (!events.length) return { success: false, message: 'Tiada program direkodkan untuk bulan ini. Poster tidak dapat dijana.' };

  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY belum ditetapkan dalam Script Properties.');

  const prompt = buildIllustrationPrompt_(month, year, events);
  const ai = callGeminiImage_(apiKey, prompt);
  const logo = fetchLogoBase64_();

  return {
    success: true,
    message: 'Ilustrasi AI berjaya dijana.',
    month: month,
    year: year,
    totalPrograms: events.length,
    prompt: prompt,
    events: events,
    illustrationBase64: ai.data,
    illustrationMimeType: ai.mimeType,
    logoBase64: logo.data,
    logoMimeType: logo.mimeType
  };
}

function buildIllustrationPrompt_(month, year, events) {
  const monthNames = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
  const counts = {};
  events.forEach(function(e) { counts[e.category] = (counts[e.category] || 0) + 1; });
  const dominant = Object.keys(counts).sort(function(a,b) { return counts[b]-counts[a]; })[0] || 'Lain-lain';
  const programNames = events.slice(0, 18).map(function(e) { return e.title + ' [' + e.category + ']'; }).join('; ');

  return [
    'Create a polished, joyful horizontal hero illustration for a Malaysian primary school monthly calendar poster.',
    'Month: ' + monthNames[month-1] + ' ' + year + '.',
    'Dominant activity category: ' + dominant + '.',
    'Program themes this month: ' + programNames + '.',
    'Show diverse primary-school pupils and teachers in an uplifting Malaysian school environment.',
    'Blend relevant visual cues for academics, student affairs, clubs/uniformed units, sports and school events based on the listed themes.',
    'Modern friendly editorial illustration, clean shapes, balanced composition, premium school communication design, bright but not neon, ample negative space.',
    'IMPORTANT: illustration only. NO words, NO letters, NO numbers, NO logos, NO school crest, NO watermark, NO signage with text.',
    'Do not depict unsafe activities. Keep clothing and school context culturally appropriate for Malaysia.',
    'Aspect ratio 16:9.'
  ].join('\n');
}

function callGeminiImage_(apiKey, prompt) {
  const payload = {
    model: CONFIG.GEMINI_MODEL,
    input: [{ type: 'text', text: prompt }],
    response_format: {
      type: 'image',
      mime_type: 'image/jpeg',
      aspect_ratio: '16:9',
      image_size: '1K'
    }
  };

  const response = UrlFetchApp.fetch(CONFIG.GEMINI_ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const text = response.getContentText();
  let data;
  try { data = JSON.parse(text); } catch (_) { throw new Error('Respons Gemini bukan JSON yang sah. HTTP ' + code); }

  if (code < 200 || code >= 300) {
    const apiMessage = data && data.error && data.error.message ? data.error.message : text.slice(0, 600);
    throw new Error('Gemini API error ' + code + ': ' + apiMessage);
  }

  // Schema Interactions API semasa: steps[].content[]
  if (Array.isArray(data.steps)) {
    for (let s = data.steps.length - 1; s >= 0; s--) {
      const step = data.steps[s] || {};
      const content = Array.isArray(step.content) ? step.content : [];
      for (let i = content.length - 1; i >= 0; i--) {
        const block = content[i] || {};
        if (block.type === 'image' && block.data) {
          return { data: block.data, mimeType: block.mime_type || 'image/jpeg' };
        }
      }
    }
  }

  // Fallback untuk schema lama jika akaun/provider masih memulangkannya.
  if (Array.isArray(data.outputs)) {
    for (let j = data.outputs.length - 1; j >= 0; j--) {
      const out = data.outputs[j] || {};
      if (out.type === 'image' && out.data) return { data: out.data, mimeType: out.mime_type || 'image/jpeg' };
    }
  }

  throw new Error('Gemini tidak memulangkan imej. Cuba jana semula atau semak model/API key.');
}

function fetchLogoBase64_() {
  try {
    const response = UrlFetchApp.fetch(CONFIG.SCHOOL_LOGO_URL, { muteHttpExceptions: true, followRedirects: true });
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) return { data: '', mimeType: 'image/png' };
    const blob = response.getBlob();
    return { data: Utilities.base64Encode(blob.getBytes()), mimeType: blob.getContentType() || 'image/png' };
  } catch (_) {
    return { data: '', mimeType: 'image/png' };
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemui.');
  return sheet;
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Request body kosong.');
  try { return JSON.parse(e.postData.contents); }
  catch (_) { throw new Error('Request JSON tidak sah.'); }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(err) {
  console.error(err && err.stack ? err.stack : err);
  return json_({ success: false, message: err && err.message ? err.message : String(err) });
}

function clean_(value, maxLen) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLen || 500);
}

function now_() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function pad2_(v) {
  return ('0' + Number(v)).slice(-2);
}
