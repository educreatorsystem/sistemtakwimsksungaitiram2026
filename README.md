# Sistem Takwim Sekolah 2027 — SK Sungai Tiram

Versi ini disediakan untuk deployment terus ke **GitHub Pages**.

## Fail utama
- `index.html` — sistem Takwim Sekolah 2027.
- `.nojekyll` — memastikan GitHub Pages menyajikan fail statik tanpa pemprosesan Jekyll.

## Perubahan pada versi ini
- Tab / butang **Muat Turun ZIP (GitHub)** dibuang.
- Tab / butang **Google Sheet** serta modal panduannya dibuang.
- Tab / butang **Laporan Bulanan** serta fungsi laporannya dibuang.
- Integrasi Google Sheet + Apps Script untuk baca/simpan/sunting/padam program **dikekalkan**.
- Fungsi Admin, carian, navigasi bulan, cetak bulan, tambah/sunting/padam program dikekalkan.

## Deploy ke GitHub Pages
1. Cipta repository baharu di GitHub.
2. Muat naik `index.html` dan `.nojekyll` ke root repository.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, kemudian Save.

> Nota: Sistem memerlukan sambungan internet untuk memuatkan Tailwind CSS, Google Fonts, Font Awesome, logo sekolah, dan untuk berhubung dengan Google Apps Script.
