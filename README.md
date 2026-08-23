# Takwim Sekolah 2026 — Johor + Modul Tambah Cuti

Versi ini mempunyai:
- Takwim 12 bulan tahun 2026.
- Cuti umum, cuti Negeri Johor, cuti persekolahan dan perayaan yang telah dimasukkan dalam sistem.
- Ringkasan cuti bulanan.
- Jana Jadual Cuti Bulanan dan Cetak Jadual.
- Login admin untuk tambah/sunting/padam program.
- **Modul baharu: Tambah Cuti, Sunting Cuti dan Padam Cuti.**
- Cuti tambahan admin disimpan dalam Google Sheet tab `Cuti2026`.
- Cuti rasmi terbina dalam dikunci supaya tidak terpadam secara tidak sengaja.
- Tiada fungsi AI dan tiada butang muat turun CSV.

## Fail GitHub
Upload fail berikut ke root repository GitHub:
- `index.html`
- `style.css`
- `app.js`

Folder `backend` tidak perlu diupload ke GitHub Pages; ia disediakan untuk Google Apps Script.

## WAJIB: Kemas kini Google Apps Script
Untuk membolehkan fungsi **Tambah Cuti** berfungsi:

1. Buka Google Sheet yang digunakan oleh sistem.
2. Klik **Extensions → Apps Script**.
3. Gantikan kod `Code.gs` dengan kandungan fail `backend/AppsScript_2026.gs`.
4. Save.
5. Jalankan fungsi `setupTakwimSystem2026()` sekali.
   - Fungsi ini akan memastikan jadual program tersedia.
   - Ia juga akan mencipta tab baharu bernama **Cuti2026** dengan header dan dropdown jenis cuti.
6. Jika Google meminta authorization, pilih akaun anda dan tekan **Allow**.
7. Pergi ke **Deploy → Manage deployments → Edit (ikon pensel) → New version → Deploy**.
8. Kekalkan **Execute as: Me** dan **Who has access: Anyone**.

Jika anda mengemas kini deployment yang sama, URL `/exec` biasanya kekal sama dan `app.js` tidak perlu diedit semula.

## Struktur tab Cuti2026
`ID | TARIKH_MULA | TARIKH_AKHIR | NAMA_CUTI | JENIS | SKOP | IKON | CATATAN | UPDATED_AT`

Jenis yang tersedia:
- Cuti Umum
- Cuti Negeri
- Cuti Sekolah
- Perayaan
- Sambutan

## Cara guna Tambah Cuti
1. Log masuk Admin.
2. Butang **➕ Tambah Cuti** akan muncul.
3. Isi tarikh mula, tarikh akhir, nama cuti, jenis, skop, ikon dan catatan.
4. Tekan **Simpan Cuti**.
5. Rekod akan terus muncul pada:
   - Takwim bulanan
   - Ringkasan Cuti Bulanan
   - Jadual Cuti Bulanan
6. Cuti yang ditambah admin mempunyai tanda `ADMIN` / `✎` dan boleh disunting atau dipadam.

## Admin
ID dan password menggunakan konfigurasi admin sedia ada pada Apps Script.


## Tarikh Pembayaran Gaji ANM 2026
Sistem turut memaparkan tarikh pembayaran gaji bulanan ANM sebagai penanda hijau berikon 💰 pada kalendar. Data dimasukkan berdasarkan jadual ANM yang dibekalkan.

## URL CSV semasa
Sistem menggunakan URL CSV tab `Cuti2026` berikut sebagai sumber/fallback data cuti:
`https://docs.google.com/spreadsheets/d/e/2PACX-1vRSBaeb8q0__d2wKSbw9jpVdAFIAUP7KNqzixHqTTnA9yKD3NO0-la8_gCtj6Ex8PJLlb2S1zE-vqi3/pub?gid=457971484&single=true&output=csv`

Data program sekolah pula dibaca melalui Apps Script dan disimpan pada tab `Takwim2026`. Backend baharu akan mencipta tab `Takwim2026` secara automatik jika belum ada.
