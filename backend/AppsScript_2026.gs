/**
 * TAKWIM PINTAR 2026 - BACKEND PROGRAM + CUTI
 * Google Sheet ID: 1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E
 *
 * Tab yang digunakan:
 * 1) Program2026 - data program sekolah
 * 2) Cuti2026    - data cuti tambahan admin
 *
 * Jalankan setupTakwimSystem2026() sekali selepas paste kod ini.
 * Kemudian Deploy > Manage deployments > Edit > New version > Deploy.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E',
  YEAR: 2026,
  TIMEZONE: 'Asia/Kuala_Lumpur',
  PROGRAM_SHEET_NAME: 'Program2026',
  HOLIDAY_SHEET_NAME: 'Cuti2026',
  ADMIN_SESSION_SECONDS: 21600
});

const PROGRAM_HEADERS = ['ID','TARIKH','PROGRAM','MASA','TEMPAT','KATEGORI','CATATAN','UPDATED_AT'];
const PROGRAM_CATEGORIES = ['Pentadbiran','Akademik','HEM','Kokurikulum','Sukan','Cuti','Lain-lain'];

const HOLIDAY_HEADERS = ['ID','TARIKH_MULA','TARIKH_AKHIR','NAMA_CUTI','JENIS','SKOP','IKON','CATATAN','UPDATED_AT'];
const HOLIDAY_TYPES = ['Cuti Umum','Cuti Negeri','Cuti Sekolah','Perayaan','Sambutan'];

const DEFAULT_ADMIN_ID = 'gurucemerlang';
const DEFAULT_ADMIN_SALT = 'd64e1287ee43504263ce87bfcebdc334';
const DEFAULT_ADMIN_PASSWORD_HASH = '260cd7f8b439d1dd0874548e4aff4f51d39988fa48640be08f4f00dfaa693951';

function doGet(e) {
  try {
    const action = clean_((e && e.parameter && e.parameter.action) || 'health', 50);
    if (action === 'health') {
      return json_({
        success: true,
        service: 'Takwim Pintar 2026 API',
        year: CONFIG.YEAR,
        programSheet: CONFIG.PROGRAM_SHEET_NAME,
        holidaySheet: CONFIG.HOLIDAY_SHEET_NAME,
        timestamp: now_()
      });
    }
    if (action === 'listPrograms' || action === 'list') {
      return json_({ success:true, events:getPrograms_(), timestamp:now_() });
    }
    if (action === 'listHolidays') {
      return json_({ success:true, holidays:getHolidays_(), timestamp:now_() });
    }
    return json_({ success:false, message:'Action GET tidak dikenali.' });
  } catch (err) {
    return jsonError_(err);
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = clean_(body.action, 50);

    if (action === 'login') return json_(login_(body));
    if (action === 'validateToken') return json_({ success:isValidToken_(body.token) });

    // PROGRAM SEKOLAH - nama action baharu + alias lama
    if (action === 'addProgram' || action === 'add') {
      requireAdmin_(body.token);
      return json_(addProgram_(body));
    }
    if (action === 'updateProgram' || action === 'update') {
      requireAdmin_(body.token);
      return json_(updateProgram_(body));
    }
    if (action === 'deleteProgram' || action === 'delete') {
      requireAdmin_(body.token);
      return json_(deleteProgram_(body));
    }

    // CUTI
    if (action === 'addHoliday') {
      requireAdmin_(body.token);
      return json_(addHoliday_(body));
    }
    if (action === 'updateHoliday') {
      requireAdmin_(body.token);
      return json_(updateHoliday_(body));
    }
    if (action === 'deleteHoliday') {
      requireAdmin_(body.token);
      return json_(deleteHoliday_(body));
    }

    return json_({ success:false, message:'Action POST tidak dikenali.' });
  } catch (err) {
    return jsonError_(err);
  }
}

/** Jalankan fungsi ini sekali secara manual. */
function setupTakwimSystem2026() {
  const programSheet = setupProgramSheet_();
  const holidaySheet = setupHolidaySheet_();
  setupAdminProperties_();

  return {
    success: true,
    message: 'Setup Takwim 2026 selesai. Tab Program2026 dan Cuti2026 telah disediakan.',
    programSheet: programSheet.getName(),
    programColumns: PROGRAM_HEADERS,
    holidaySheet: holidaySheet.getName(),
    holidayColumns: HOLIDAY_HEADERS
  };
}

function testConnection2026() {
  return {
    success: true,
    spreadsheet: SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getName(),
    programSheet: getProgramSheet_(true).getName(),
    programCount: getPrograms_().length,
    holidaySheet: getHolidaySheet_(true).getName(),
    holidayCount: getHolidays_().length,
    timestamp: now_()
  };
}

// ==================== ADMIN ====================
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
  const id = clean_(body.id, 100);
  const password = String(body.password || '');

  if (!constantTimeEqual_(id, expectedId) || !constantTimeEqual_(hashPassword_(password, salt), expectedHash)) {
    Utilities.sleep(250);
    return { success:false, message:'ID atau password tidak sah.' };
  }

  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put(sessionKey_(token), JSON.stringify({ id:expectedId, createdAt:Date.now() }), CONFIG.ADMIN_SESSION_SECONDS);
  return { success:true, message:'Log masuk admin berjaya.', token:token, expiresIn:CONFIG.ADMIN_SESSION_SECONDS };
}

function isValidToken_(token) {
  return token ? Boolean(CacheService.getScriptCache().get(sessionKey_(String(token)))) : false;
}
function requireAdmin_(token) {
  if (!isValidToken_(token)) throw new Error('Sesi admin tidak sah atau telah tamat. Sila log masuk semula.');
}
function sessionKey_(token) { return 'TAKWIM_ADMIN_' + token; }
function hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + ':' + String(salt), Utilities.Charset.UTF_8);
  return bytes.map(b => { const n = b < 0 ? b + 256 : b; return ('0' + n.toString(16)).slice(-2); }).join('');
}
function constantTimeEqual_(a,b) {
  a=String(a||''); b=String(b||'');
  let diff=a.length^b.length, len=Math.max(a.length,b.length);
  for(let i=0;i<len;i++) diff |= (a.charCodeAt(i%Math.max(a.length,1))||0) ^ (b.charCodeAt(i%Math.max(b.length,1))||0);
  return diff===0;
}

// ==================== PROGRAM SEKOLAH ====================
function setupProgramSheet_() {
  const sheet = getProgramSheet_(true);
  ensureHeaders_(sheet, PROGRAM_HEADERS, CONFIG.PROGRAM_SHEET_NAME);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,PROGRAM_HEADERS.length).setFontWeight('bold').setBackground('#5b50d6').setFontColor('#ffffff');
  sheet.getRange('B2:B1000').setNumberFormat('@');
  sheet.getRange('H2:H1000').setNumberFormat('@');
  const categoryRule = SpreadsheetApp.newDataValidation().requireValueInList(PROGRAM_CATEGORIES, true).setAllowInvalid(false).build();
  sheet.getRange('F2:F1000').setDataValidation(categoryRule);
  sheet.autoResizeColumns(1, PROGRAM_HEADERS.length);
  return sheet;
}

function getProgramSheet_(createIfMissing) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.PROGRAM_SHEET_NAME);
  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(CONFIG.PROGRAM_SHEET_NAME);
    sheet.getRange(1,1,1,PROGRAM_HEADERS.length).setValues([PROGRAM_HEADERS]);
  }
  return sheet;
}

function getPrograms_() {
  const sheet = getProgramSheet_(true);
  ensureHeaders_(sheet, PROGRAM_HEADERS, CONFIG.PROGRAM_SHEET_NAME);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,PROGRAM_HEADERS.length).getValues()
    .map(rowToProgram_)
    .filter(x => x.id && x.date && x.title);
}

function addProgram_(body) {
  const item = validateProgramInput_(body);
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getProgramSheet_(true);
    ensureHeaders_(sheet, PROGRAM_HEADERS, CONFIG.PROGRAM_SHEET_NAME);
    const id = makeProgramId_();
    sheet.appendRow([id,item.date,item.title,item.time,item.place,item.category,item.notes,now_()]);
    return { success:true, message:'Program berjaya ditambah.', id:id };
  } finally { lock.releaseLock(); }
}

function updateProgram_(body) {
  const id = clean_(body.id,200);
  if (!id) throw new Error('ID program diperlukan.');
  const item = validateProgramInput_(body);
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getProgramSheet_(true);
    const row = findRowById_(sheet,id);
    if (!row) throw new Error('Program tidak ditemui.');
    sheet.getRange(row,1,1,PROGRAM_HEADERS.length).setValues([[id,item.date,item.title,item.time,item.place,item.category,item.notes,now_()]]);
    return { success:true, message:'Program berjaya dikemas kini.', id:id };
  } finally { lock.releaseLock(); }
}

function deleteProgram_(body) {
  const id = clean_(body.id,200);
  if (!id) throw new Error('ID program diperlukan.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet = getProgramSheet_(true);
    const row = findRowById_(sheet,id);
    if (!row) throw new Error('Program tidak ditemui.');
    sheet.deleteRow(row);
    return { success:true, message:'Program berjaya dipadam.', id:id };
  } finally { lock.releaseLock(); }
}

function validateProgramInput_(body) {
  const date = validateDate2026_(body.date);
  const title = clean_(body.title,180);
  if (!title) throw new Error('Nama program diperlukan.');
  let category = clean_(body.category,40) || 'Lain-lain';
  if (PROGRAM_CATEGORIES.indexOf(category) < 0) category = 'Lain-lain';
  return {
    date: date,
    title: title,
    time: clean_(body.time,80),
    place: clean_(body.place,180),
    category: category,
    notes: clean_(body.notes,500)
  };
}

function rowToProgram_(row) {
  return {
    id: String(row[0]||'').trim(),
    date: dateToString_(row[1]),
    title: String(row[2]||'').trim(),
    time: String(row[3]||'').trim(),
    place: String(row[4]||'').trim(),
    category: normalizeProgramCategory_(row[5]),
    notes: String(row[6]||'').trim(),
    updatedAt: formatUpdatedAt_(row[7])
  };
}
function normalizeProgramCategory_(value) {
  const s=String(value||'').trim();
  return PROGRAM_CATEGORIES.find(x => x.toLowerCase()===s.toLowerCase()) || 'Lain-lain';
}
function makeProgramId_() { return 'PRG-'+CONFIG.YEAR+'-'+Utilities.getUuid().split('-')[0].toUpperCase()+'-'+Date.now().toString(36).toUpperCase(); }

// ==================== CUTI TAMBAHAN ====================
function setupHolidaySheet_() {
  const sheet = getHolidaySheet_(true);
  ensureHeaders_(sheet, HOLIDAY_HEADERS, CONFIG.HOLIDAY_SHEET_NAME);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,HOLIDAY_HEADERS.length).setFontWeight('bold').setBackground('#f08a5d').setFontColor('#ffffff');
  sheet.getRange('B2:C1000').setNumberFormat('@');
  sheet.getRange('I2:I1000').setNumberFormat('@');
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(HOLIDAY_TYPES,true).setAllowInvalid(false).build();
  sheet.getRange('E2:E1000').setDataValidation(rule);
  sheet.autoResizeColumns(1,HOLIDAY_HEADERS.length);
  return sheet;
}

function getHolidaySheet_(createIfMissing) {
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet=ss.getSheetByName(CONFIG.HOLIDAY_SHEET_NAME);
  if(!sheet && createIfMissing) {
    sheet=ss.insertSheet(CONFIG.HOLIDAY_SHEET_NAME);
    sheet.getRange(1,1,1,HOLIDAY_HEADERS.length).setValues([HOLIDAY_HEADERS]);
  }
  return sheet;
}

function getHolidays_() {
  const sheet=getHolidaySheet_(true);
  ensureHeaders_(sheet,HOLIDAY_HEADERS,CONFIG.HOLIDAY_SHEET_NAME);
  if(sheet.getLastRow()<2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,HOLIDAY_HEADERS.length).getValues()
    .map(rowToHoliday_)
    .filter(x=>x.id&&x.start&&x.end&&x.title);
}

function addHoliday_(body) {
  const h=validateHolidayInput_(body);
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet=getHolidaySheet_(true);
    ensureHeaders_(sheet,HOLIDAY_HEADERS,CONFIG.HOLIDAY_SHEET_NAME);
    const id=makeHolidayId_();
    sheet.appendRow([id,h.start,h.end,h.title,h.type,h.scope,h.icon,h.notes,now_()]);
    return {success:true,message:'Cuti berjaya ditambah.',id:id};
  } finally { lock.releaseLock(); }
}

function updateHoliday_(body) {
  const id=clean_(body.id,200);
  if(!id) throw new Error('ID cuti diperlukan.');
  const h=validateHolidayInput_(body);
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet=getHolidaySheet_(true);
    const row=findRowById_(sheet,id);
    if(!row) throw new Error('Cuti tidak ditemui.');
    sheet.getRange(row,1,1,HOLIDAY_HEADERS.length).setValues([[id,h.start,h.end,h.title,h.type,h.scope,h.icon,h.notes,now_()]]);
    return {success:true,message:'Cuti berjaya dikemas kini.',id:id};
  } finally { lock.releaseLock(); }
}

function deleteHoliday_(body) {
  const id=clean_(body.id,200);
  if(!id) throw new Error('ID cuti diperlukan.');
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sheet=getHolidaySheet_(true);
    const row=findRowById_(sheet,id);
    if(!row) throw new Error('Cuti tidak ditemui.');
    sheet.deleteRow(row);
    return {success:true,message:'Cuti berjaya dipadam.',id:id};
  } finally { lock.releaseLock(); }
}

function validateHolidayInput_(body) {
  const start=validateDate2026_(body.start);
  const end=validateDate2026_(body.end);
  if(end<start) throw new Error('Tarikh akhir tidak boleh lebih awal daripada tarikh mula.');
  const title=clean_(body.title,180);
  if(!title) throw new Error('Nama cuti diperlukan.');
  let type=clean_(body.type,40)||'Cuti Sekolah';
  if(HOLIDAY_TYPES.indexOf(type)<0) type='Cuti Sekolah';
  return {
    start:start,
    end:end,
    title:title,
    type:type,
    scope:clean_(body.scope,120)||'Sekolah Johor',
    icon:clean_(body.icon,12)||'🎉',
    notes:clean_(body.notes,500)
  };
}

function rowToHoliday_(row) {
  return {
    id:String(row[0]||'').trim(),
    start:dateToString_(row[1]),
    end:dateToString_(row[2]),
    title:String(row[3]||'').trim(),
    type:normalizeHolidayType_(row[4]),
    scope:String(row[5]||'').trim(),
    icon:String(row[6]||'').trim()||'🎉',
    notes:String(row[7]||'').trim(),
    updatedAt:formatUpdatedAt_(row[8])
  };
}
function normalizeHolidayType_(value) {
  const s=String(value||'').trim();
  return HOLIDAY_TYPES.find(x=>x.toLowerCase()===s.toLowerCase()) || 'Cuti Sekolah';
}
function makeHolidayId_() { return 'HLD-'+CONFIG.YEAR+'-'+Utilities.getUuid().split('-')[0].toUpperCase()+'-'+Date.now().toString(36).toUpperCase(); }

// ==================== UTILITI ====================
function ensureHeaders_(sheet, headers, sheetName) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    return;
  }
  const existing = sheet.getRange(1,1,1,headers.length).getDisplayValues()[0].map(v=>String(v).trim().toUpperCase());
  const expected = headers.map(v=>String(v).toUpperCase());
  if (JSON.stringify(existing) !== JSON.stringify(expected)) {
    throw new Error('Struktur tab '+sheetName+' tidak sah. Header diperlukan: '+headers.join(' | '));
  }
}

function findRowById_(sheet,id) {
  const lastRow=sheet.getLastRow();
  if(lastRow<2) return 0;
  const values=sheet.getRange(2,1,lastRow-1,1).getDisplayValues();
  for(let i=0;i<values.length;i++) if(String(values[i][0]).trim()===id) return i+2;
  return 0;
}

function validateDate2026_(value) {
  const s=String(value||'').trim();
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) throw new Error('Format tarikh mesti YYYY-MM-DD.');
  const y=Number(m[1]), mo=Number(m[2]), d=Number(m[3]);
  if(y!==CONFIG.YEAR) throw new Error('Tarikh mesti dalam tahun '+CONFIG.YEAR+'.');
  const test=new Date(y,mo-1,d);
  if(test.getFullYear()!==y||test.getMonth()!==mo-1||test.getDate()!==d) throw new Error('Tarikh tidak sah.');
  return s;
}

function dateToString_(value) {
  if(value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value,CONFIG.TIMEZONE,'yyyy-MM-dd');
  const s=String(value||'').trim();
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m) return m[1]+'-'+pad2_(m[2])+'-'+pad2_(m[3]);
  m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m) return m[3]+'-'+pad2_(m[2])+'-'+pad2_(m[1]);
  return '';
}

function formatUpdatedAt_(value) {
  return value instanceof Date ? Utilities.formatDate(value,CONFIG.TIMEZONE,'yyyy-MM-dd HH:mm:ss') : String(value||'').trim();
}
function parseBody_(e) {
  if(!e||!e.postData||!e.postData.contents) throw new Error('Request body kosong.');
  try { return JSON.parse(e.postData.contents); }
  catch(_) { throw new Error('Request JSON tidak sah.'); }
}
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function jsonError_(err) {
  console.error(err&&err.stack?err.stack:err);
  return json_({success:false,message:err&&err.message?err.message:String(err)});
}
function clean_(value,maxLen) { return String(value==null?'':value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,maxLen||500); }
function now_() { return Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'yyyy-MM-dd HH:mm:ss'); }
function pad2_(v) { return ('0'+Number(v)).slice(-2); }
