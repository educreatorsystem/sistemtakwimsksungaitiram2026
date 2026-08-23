# TAKWIM SEKOLAH 2026 — PROGRAM + CUTI

Versi ini mengandungi penambahbaikan berikut:

- Butang **➕ Tambah Program Sekolah** pada halaman utama.
- Butang **Refresh** telah dibuang.
- Butang **+** kecil pada setiap tarikh kalendar kini membuka pilihan:
  - **Tambah Program**
  - **Tambah Cuti**
- Jika pengguna belum login admin, sistem akan meminta login terlebih dahulu sebelum membuka borang tambah.
- Data program disimpan dalam tab Google Sheet **Program2026**.
- Data cuti tambahan admin kekal disimpan dalam tab **Cuti2026**.
- Fungsi tambah, sunting dan padam tersedia untuk kedua-dua Program dan Cuti.

## Google Sheet

Spreadsheet ID:
`1ye3NpIRhD0AdjlAVoIeFGjveircuXVlOUDx65jCs80E`

### Tab Program2026

Apps Script akan mencipta tab ini secara automatik dengan kolum:

`ID | TARIKH | PROGRAM | MASA | TEMPAT | KATEGORI | CATATAN | UPDATED_AT`

Kategori program:
- Pentadbiran
- Akademik
- HEM
- Kokurikulum
- Sukan
- Cuti
- Lain-lain

### Tab Cuti2026

Struktur:

`ID | TARIKH_MULA | TARIKH_AKHIR | NAMA_CUTI | JENIS | SKOP | IKON | CATATAN | UPDATED_AT`

URL CSV cuti yang digunakan sebagai fallback:
`https://docs.google.com/spreadsheets/d/e/2PACX-1vRSBaeb8q0__d2wKSbw9jpVdAFIAUP7KNqzixHqTTnA9yKD3NO0-la8_gCtj6Ex8PJLlb2S1zE-vqi3/pub?gid=457971484&single=true&output=csv`

## Cara Kemas Kini Apps Script

1. Buka Google Sheet.
2. Klik **Extensions > Apps Script**.
3. Gantikan keseluruhan `Code.gs` dengan kandungan fail:
   `backend/AppsScript_2026_PROGRAM_CUTI.gs`
4. Save.
5. Pilih fungsi **setupTakwimSystem2026** dan klik **Run** sekali.
6. Beri kebenaran Google jika diminta.
7. Selepas fungsi setup berjaya, tab **Program2026** akan diwujudkan secara automatik.
8. Pergi ke **Deploy > Manage deployments**.
9. Klik ikon pensel pada deployment semasa.
10. Pilih **New version**.
11. Pastikan:
    - Execute as: **Me**
    - Who has access: **Anyone**
12. Klik **Deploy**.

Jika anda mengemas kini deployment yang sama, URL `/exec` kekal sama dan frontend tidak perlu diubah.

## API Program

GET:
- `?action=listPrograms`

POST:
- `addProgram`
- `updateProgram`
- `deleteProgram`

## API Cuti

GET:
- `?action=listHolidays`

POST:
- `addHoliday`
- `updateHoliday`
- `deleteHoliday`

## Login Admin

ID: `gurucemerlang`

Password: `APC6859`

Password tidak disimpan dalam frontend GitHub.

## GitHub Pages

Upload fail berikut ke root repository:

- `index.html`
- `style.css`
- `app.js`

Folder `backend` tidak diperlukan oleh GitHub Pages. Ia disertakan sebagai salinan Apps Script untuk pemasangan backend.


## Mod suntingan admin sahaja

Dalam versi ini, pengguna biasa hanya melihat takwim. Butang **Tambah Program Sekolah**, **Tambah Cuti**, butang **+** pada kotak tarikh, serta kawalan sunting/padam hanya muncul selepas login Admin berjaya. Selepas logout, semua kawalan suntingan disorok semula secara automatik.
