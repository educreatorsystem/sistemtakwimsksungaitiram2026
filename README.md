# Sistem Takwim Sekolah 2027 + AI Poster

Sistem web statik untuk GitHub Pages dengan Google Sheets + Google Apps Script sebagai backend.

## Konfigurasi yang telah dimasukkan

- Tahun: **2027**
- Sekolah: **SEKOLAH KEBANGSAAN SUNGAI TIRAM**
- Google Sheet ID: `1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E`
- Tab Google Sheet: `Takwim2027`
- GID: `1122801319`
- CSV URL: URL yang diberikan oleh pengguna sudah dimasukkan dalam `app.js`
- ID Admin: `gurucemerlang`
- Password Admin: `APC6859`
- Model AI imej: `gemini-3.1-flash-image`

> Password tidak diletakkan dalam frontend/GitHub. Backend menyimpan hash SHA-256 + salt.

---

## Struktur Google Sheet

Baris pertama mestilah:

| ID | TARIKH | PROGRAM | MASA | TEMPAT | KATEGORI | CATATAN | UPDATED_AT |
|---|---|---|---|---|---|---|---|

Format tarikh yang disyorkan: `YYYY-MM-DD`, contoh `2027-01-12`.

Kategori:

- Pentadbiran
- Akademik
- HEM
- Kokurikulum
- Sukan
- Cuti
- Lain-lain

Fungsi `setupTakwimSystem()` akan menyediakan header dan dropdown kategori secara automatik jika sheet masih kosong.

---

# LANGKAH 1 — Pasang Apps Script

1. Buka Google Sheet TAKWIM.
2. Pilih **Extensions > Apps Script**.
3. Buka `Code.gs`.
4. Padam kod asal.
5. Salin semua kandungan `AppsScript.gs` ke dalam `Code.gs`.
6. Jika anda mahu menggunakan manifest yang disediakan, buka **Project Settings > Show "appsscript.json" manifest file in editor**, kemudian gantikan kandungannya dengan fail `appsscript.json`.
7. Save.
8. Pilih fungsi `setupTakwimSystem` dan klik **Run**.
9. Benarkan permission yang diminta Google.
10. Jalankan `testConnection()` untuk memastikan sheet betul.

`setupTakwimSystem()` juga menyimpan ID admin dan hash password yang sepadan dengan credential yang telah ditetapkan.

---

# LANGKAH 2 — Masukkan Gemini API Key

AI hanya diperlukan untuk ilustrasi poster.

Cara paling selamat:

1. Dalam Apps Script, buka **Project Settings**.
2. Cari **Script Properties**.
3. Tambah property:
   - Property: `GEMINI_API_KEY`
   - Value: API key Gemini anda
4. Save.

Alternatif: isi API key sementara dalam fungsi `setGeminiApiKeyOnce()`, run sekali, kemudian PADAM API key daripada kod dan save semula.

> Jangan masukkan Gemini API key ke dalam `app.js` atau repository GitHub.

---

# LANGKAH 3 — Deploy Apps Script Sebagai Web App

1. Klik **Deploy > New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Klik **Deploy**.
6. Salin URL yang berakhir dengan `/exec`.

Contoh bentuk URL:

`https://script.google.com/macros/s/XXXXXXXXXXXX/exec`

---

# LANGKAH 4 — Masukkan URL Web App ke Frontend

Buka `app.js` dan cari:

```js
APPS_SCRIPT_URL: 'MASUKKAN_URL_WEB_APP_APPS_SCRIPT_DI_SINI'
```

Gantikan dengan URL `/exec` yang anda dapat selepas deployment.

Contoh:

```js
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec'
```

Save.

---

# LANGKAH 5 — Deploy ke GitHub Pages

Upload fail berikut ke repository GitHub:

- `index.html`
- `style.css`
- `app.js`

Kemudian:

1. GitHub repository > **Settings**.
2. Pilih **Pages**.
3. Source: **Deploy from a branch**.
4. Branch: `main` dan folder `/root`.
5. Save.

GitHub akan memberikan URL laman sistem anda.

---

# Fungsi Sistem

## Paparan umum

- Paparan kalender Januari–Disember 2027.
- Membaca data melalui Google Sheet CSV.
- Banyak program boleh diletakkan pada tarikh yang sama.
- Kategori mempunyai warna berlainan.
- Navigasi bulan.
- Cetak bulan dipilih dalam A4 landscape.
- Paparan responsif desktop/tablet/telefon.

## Mod Admin

Tekan **Sunting Takwim** dan login menggunakan credential admin.

Selepas berjaya:

- tambah program;
- sunting program;
- padam program;
- refresh data terus daripada Apps Script;
- jana poster AI.

Token admin disimpan dalam `sessionStorage` browser dan backend menggunakan cache sesi sehingga 6 jam.

## Poster AI

Tekan **Jana Poster AI** selepas login admin.

Aliran:

1. Apps Script membaca program sebenar bagi bulan dipilih.
2. Apps Script membina prompt berdasarkan kategori dan nama program.
3. Gemini menjana **ilustrasi sahaja**, tanpa teks/logo.
4. Frontend melukis poster 1600×2000 menggunakan Canvas.
5. Lencana, nama sekolah, tarikh, nama program, masa dan tempat dilukis oleh frontend daripada data Google Sheet.
6. Poster boleh dimuat turun sebagai PNG atau dicetak.

Pendekatan ini mengurangkan masalah AI tersalah eja nama program atau tarikh.

---

# Ujian Backend

Selepas deploy Web App, buka:

`WEB_APP_URL?action=health`

Sepatutnya memulangkan JSON dengan `success: true`.

Kemudian cuba:

`WEB_APP_URL?action=list`

Sepatutnya memulangkan senarai `events` daripada Google Sheet.

---

# Jika Poster AI Gagal

Semak perkara berikut:

1. `GEMINI_API_KEY` sudah ada dalam Script Properties.
2. API key masih aktif dan mempunyai akses kepada Gemini API.
3. Deployment Apps Script ialah versi terkini.
4. Selepas ubah `Code.gs`, buat **Deploy > Manage deployments > Edit > New version > Deploy**.
5. Cuba login semula jika sesi admin tamat.

---

# Jika Data Takwim Lambat Berubah

Frontend asal membaca URL CSV kerana ia ringan dan sesuai untuk paparan umum. Selepas operasi admin, sistem membaca semula melalui Apps Script supaya perubahan dapat dilihat dengan segera.

Butang **Refresh** semasa mod admin juga akan menggunakan Apps Script terlebih dahulu.

---

# Fail

- `index.html` — struktur UI
- `style.css` — design + print A4 landscape
- `app.js` — kalender, admin, CRUD, Canvas poster AI
- `AppsScript.gs` — backend Google Sheet + login + Gemini API
- `appsscript.json` — manifest Apps Script
- `PROMPT_LENGKAP.txt` — prompt untuk membina semula/ubah suai sistem dengan Gemini Canvas atau AI coding tool
