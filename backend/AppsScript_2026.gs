/**
 * TAKWIM SEKOLAH 2026 - BACKEND TANPA AI
 * Spreadsheet ID: 1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E
 * Sheet GID: 1122801319
 *
 * Gantikan kod Apps Script lama dengan fail ini dan deploy NEW VERSION.
 * URL /exec boleh kekal sama jika anda mengemas kini deployment sedia ada.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E',
  SHEET_GID: 1122801319,
  YEAR: 2026,
  TIMEZONE: 'Asia/Kuala_Lumpur',
  ADMIN_SESSION_SECONDS: 21600
});

const HEADERS = ['ID', 'TARIKH', 'PROGRAM', 'MASA', 'TEMPAT', 'KATEGORI', 'CATATAN', 'UPDATED_AT'];
const CATEGORIES = ['Pentadbiran', 'Akademik', 'HEM', 'Kokurikulum', 'Sukan', 'Cuti', 'Lain-lain'];
const DEFAULT_ADMIN_ID = 'gurucemerlang';
const DEFAULT_ADMIN_SALT = 'd64e1287ee43504263ce87bfcebdc334';
const DEFAULT_ADMIN_PASSWORD_HASH = '260cd7f8b439d1dd0874548e4aff4f51d39988fa48640be08f4f00dfaa693951';

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'health').trim();
    if (action === 'health') return json_({ success:true, service:'Takwim Sekolah 2026 API', year:CONFIG.YEAR, sheet:getSheet_().getName(), timestamp:now_() });
    if (action === 'list') return json_({ success:true, events:getEvents_(), timestamp:now_() });
    return json_({ success:false, message:'Action GET tidak dikenali.' });
  } catch (err) { return jsonError_(err); }
}

function doPost(e) {
  try {
    const body = parseBody_(e), action = String(body.action || '').trim();
    switch (action) {
      case 'login': return json_(login_(body));
      case 'validateToken': return json_({ success:isValidToken_(body.token) });
      case 'add': requireAdmin_(body.token); return json_(addEvent_(body));
      case 'update': requireAdmin_(body.token); return json_(updateEvent_(body));
      case 'delete': requireAdmin_(body.token); return json_(deleteEvent_(body));
      default: return json_({ success:false, message:'Action POST tidak dikenali.' });
    }
  } catch (err) { return jsonError_(err); }
}

function setupTakwimSystem2026() {
  const sheet = getSheet_();
  const firstRow = sheet.getRange(1,1,1,HEADERS.length).getDisplayValues()[0];
  const hasAny = firstRow.some(v => String(v).trim() !== '');
  if (!hasAny) sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  else {
    const normalized = firstRow.map(v => String(v).trim().toUpperCase());
    if (JSON.stringify(normalized) !== JSON.stringify(HEADERS)) throw new Error('Header perlu: ' + HEADERS.join(' | '));
  }
  sheet.setFrozenRows(1);
  sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#5b50d6').setFontColor('#ffffff');
  sheet.getRange('B2:B1000').setNumberFormat('@');
  sheet.getRange('H2:H1000').setNumberFormat('@');
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(CATEGORIES,true).setAllowInvalid(false).build();
  sheet.getRange('F2:F1000').setDataValidation(rule);
  setupAdminProperties_();
  return { success:true, message:'Setup Takwim 2026 selesai.', sheet:sheet.getName(), headers:HEADERS };
}

function testConnection2026() {
  return { success:true, spreadsheet:SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getName(), sheet:getSheet_().getName(), year:CONFIG.YEAR, events:getEvents_().length, timestamp:now_() };
}

function setupAdminProperties_() {
  PropertiesService.getScriptProperties().setProperties({ ADMIN_ID:DEFAULT_ADMIN_ID, ADMIN_SALT:DEFAULT_ADMIN_SALT, ADMIN_PASSWORD_HASH:DEFAULT_ADMIN_PASSWORD_HASH }, false);
}
function login_(body) {
  const props = PropertiesService.getScriptProperties();
  const expectedId = props.getProperty('ADMIN_ID') || DEFAULT_ADMIN_ID;
  const salt = props.getProperty('ADMIN_SALT') || DEFAULT_ADMIN_SALT;
  const expectedHash = props.getProperty('ADMIN_PASSWORD_HASH') || DEFAULT_ADMIN_PASSWORD_HASH;
  const id = String(body.id || '').trim(), password = String(body.password || '');
  if (!constantTimeEqual_(id,expectedId) || !constantTimeEqual_(hashPassword_(password,salt),expectedHash)) { Utilities.sleep(250); return {success:false,message:'ID atau password tidak sah.'}; }
  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put(sessionKey_(token), JSON.stringify({id:expectedId,createdAt:Date.now()}), CONFIG.ADMIN_SESSION_SECONDS);
  return { success:true, message:'Log masuk admin berjaya.', token:token, expiresIn:CONFIG.ADMIN_SESSION_SECONDS };
}
function isValidToken_(token){ return token ? Boolean(CacheService.getScriptCache().get(sessionKey_(String(token)))) : false; }
function requireAdmin_(token){ if(!isValidToken_(token)) throw new Error('Sesi admin tidak sah atau telah tamat. Sila log masuk semula.'); }
function sessionKey_(token){ return 'TAKWIM_ADMIN_' + token; }
function hashPassword_(password,salt){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(password)+':'+String(salt),Utilities.Charset.UTF_8);
  return bytes.map(b=>{const n=b<0?b+256:b;return('0'+n.toString(16)).slice(-2)}).join('');
}
function constantTimeEqual_(a,b){a=String(a||'');b=String(b||'');let diff=a.length^b.length,len=Math.max(a.length,b.length);for(let i=0;i<len;i++)diff|=(a.charCodeAt(i%Math.max(a.length,1))||0)^(b.charCodeAt(i%Math.max(b.length,1))||0);return diff===0;}

function addEvent_(body){
  const event=validateEventInput_(body),lock=LockService.getScriptLock();lock.waitLock(15000);
  try{const sheet=getSheet_(),id=makeEventId_();sheet.appendRow([id,event.date,event.title,event.time,event.place,event.category,event.notes,now_()]);return{success:true,message:'Program berjaya ditambah.',id:id};}finally{lock.releaseLock();}
}
function updateEvent_(body){
  const id=clean_(body.id,200);if(!id)throw new Error('ID program diperlukan.');const event=validateEventInput_(body),lock=LockService.getScriptLock();lock.waitLock(15000);
  try{const sheet=getSheet_(),row=findRowById_(sheet,id);if(!row)throw new Error('Program tidak ditemui.');sheet.getRange(row,1,1,HEADERS.length).setValues([[id,event.date,event.title,event.time,event.place,event.category,event.notes,now_()]]);return{success:true,message:'Program berjaya dikemas kini.',id:id};}finally{lock.releaseLock();}
}
function deleteEvent_(body){
  const id=clean_(body.id,200);if(!id)throw new Error('ID program diperlukan.');const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{const sheet=getSheet_(),row=findRowById_(sheet,id);if(!row)throw new Error('Program tidak ditemui.');sheet.deleteRow(row);return{success:true,message:'Program berjaya dipadam.',id:id};}finally{lock.releaseLock();}
}
function validateEventInput_(body){
  const date=validateDate2026_(body.date),title=clean_(body.title,180);if(!title)throw new Error('Nama program diperlukan.');let category=clean_(body.category,40)||'Lain-lain';if(CATEGORIES.indexOf(category)<0)category='Lain-lain';
  return{date:date,title:title,time:clean_(body.time,80),place:clean_(body.place,180),category:category,notes:clean_(body.notes,500)};
}
function validateDate2026_(value){
  const s=String(value||'').trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)throw new Error('Format tarikh mesti YYYY-MM-DD.');const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);if(y!==CONFIG.YEAR)throw new Error('Tarikh mesti dalam tahun '+CONFIG.YEAR+'.');const test=new Date(y,mo-1,d);if(test.getFullYear()!==y||test.getMonth()!==mo-1||test.getDate()!==d)throw new Error('Tarikh tidak sah.');return s;
}
function getEvents_(){const sheet=getSheet_(),lastRow=sheet.getLastRow();if(lastRow<2)return[];return sheet.getRange(2,1,lastRow-1,HEADERS.length).getValues().map(rowToEvent_).filter(e=>e.id&&e.date&&e.title);}
function rowToEvent_(row){return{id:String(row[0]||'').trim(),date:dateToString_(row[1]),title:String(row[2]||'').trim(),time:String(row[3]||'').trim(),place:String(row[4]||'').trim(),category:normalizeCategory_(row[5]),notes:String(row[6]||'').trim(),updatedAt:row[7] instanceof Date?Utilities.formatDate(row[7],CONFIG.TIMEZONE,'yyyy-MM-dd HH:mm:ss'):String(row[7]||'').trim()};}
function dateToString_(value){if(value instanceof Date&&!isNaN(value.getTime()))return Utilities.formatDate(value,CONFIG.TIMEZONE,'yyyy-MM-dd');const s=String(value||'').trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+pad2_(m[2])+'-'+pad2_(m[3]);m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);if(m)return m[3]+'-'+pad2_(m[2])+'-'+pad2_(m[1]);return'';}
function normalizeCategory_(value){const s=String(value||'').trim();for(let i=0;i<CATEGORIES.length;i++)if(CATEGORIES[i].toLowerCase()===s.toLowerCase())return CATEGORIES[i];return'Lain-lain';}
function findRowById_(sheet,id){const lastRow=sheet.getLastRow();if(lastRow<2)return 0;const values=sheet.getRange(2,1,lastRow-1,1).getDisplayValues();for(let i=0;i<values.length;i++)if(String(values[i][0]).trim()===id)return i+2;return 0;}
function makeEventId_(){return'EVT-'+CONFIG.YEAR+'-'+Utilities.getUuid().split('-')[0].toUpperCase()+'-'+Date.now().toString(36).toUpperCase();}
function getSheet_(){
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID),sheets=ss.getSheets();
  for(let i=0;i<sheets.length;i++)if(Number(sheets[i].getSheetId())===Number(CONFIG.SHEET_GID))return sheets[i];
  throw new Error('Sheet dengan GID '+CONFIG.SHEET_GID+' tidak ditemui.');
}
function parseBody_(e){if(!e||!e.postData||!e.postData.contents)throw new Error('Request body kosong.');try{return JSON.parse(e.postData.contents)}catch(_){throw new Error('Request JSON tidak sah.')}}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
function jsonError_(err){console.error(err&&err.stack?err.stack:err);return json_({success:false,message:err&&err.message?err.message:String(err)})}
function clean_(value,maxLen){return String(value==null?'':value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,maxLen||500)}
function now_(){return Utilities.formatDate(new Date(),CONFIG.TIMEZONE,'yyyy-MM-dd HH:mm:ss')}
function pad2_(v){return('0'+Number(v)).slice(-2)}
