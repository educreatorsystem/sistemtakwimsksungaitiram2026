# TAKWIM SEKOLAH 2026 - VERSI CERIA + CUTI BULANAN

## Untuk GitHub Pages
Upload fail ini ke root repository:
- index.html
- style.css
- app.js

URL Apps Script sedia ada telah dimasukkan dalam app.js.

## Fungsi baharu
- Takwim tahun 2026.
- Cuti/perayaan/sambutan berdasarkan Kalendar Kuda 2026 yang dibekalkan pengguna.
- Ringkasan cuti bagi setiap bulan.
- Butang "Jana Jadual Cuti Bulanan".
- Cetak jadual cuti dan muat turun CSV.
- Grafik lebih ceria, responsif dan animasi hover.
- Login admin, tambah/sunting/padam program dan cetak kalendar bulanan dikekalkan.

## PENTING - Apps Script perlu dikemas kini kepada 2026
Deployment Apps Script sedia ada sebelum ini memvalidasi tahun 2027. Untuk membolehkan admin menyimpan program tahun 2026:

1. Google Sheet > Extensions > Apps Script.
2. Gantikan Code.gs dengan kandungan `backend/AppsScript_2026.gs`.
3. Save.
4. Jalankan `setupTakwimSystem2026()` sekali dan benarkan permission jika diminta.
5. Jalankan `testConnection2026()` dan pastikan `year: 2026`.
6. Deploy > Manage deployments > Edit (ikon pensel) > New version > Deploy.
7. Kekalkan Execute as: Me dan Who has access: Anyone.
8. Jika mengemas kini deployment sedia ada, URL /exec biasanya kekal sama dan app.js tidak perlu diubah.

Tiada AI dan tiada GEMINI_API_KEY diperlukan.

## Data cuti
Data cuti/perayaan disimpan terbina dalam frontend supaya tidak mengubah data program sekolah di Google Sheet. Item negeri/wilayah dilabel dengan skop masing-masing; ia tidak bermaksud semua cuti negeri terpakai di Johor.
