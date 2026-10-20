# MochiTs Docs

Dokumentasi statis untuk [MochiTs](https://github.com/Mochizhouuu/MochiTs) — editor
typeset komik Android. Bahasa Indonesia, tanpa build step, siap di-deploy ke
Cloudflare Pages.

## Isi

| File | Halaman |
|---|---|
| `index.html` | Beranda + ringkasan fitur |
| `mulai.html` | Instalasi, proyek pertama, tur Home/Editor |
| `folder-zip.html` | Folder proyek, impor banyak gambar, impor ZIP |
| `teks.html` | Layer teks, font, jarak huruf/baris, inpainting |
| `script.html` | Format script TL: pemisah, simbol, entri terhubung, indentasi |
| `tester.html` | Parser script + lab regex, berjalan di browser |
| `ekspor.html` | PNG/JPEG/WEBP/MTS, kualitas, folder tujuan |
| `faq.html` | Pertanyaan umum |

Aset bersama ada di `assets/style.css` dan `assets/app.js`. Tidak ada framework,
dependency, atau proses build.

## Pratinjau lokal

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`. Tester script dan lab regex berjalan sepenuhnya di
browser; tidak ada data yang dikirim ke server.

## Deploy ke Cloudflare Pages

### Lewat integrasi Git (disarankan)

1. Buka Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Pilih repo `Mochizhouuu/MochiTs-Docs`.
3. Production branch: `main`.
4. Framework preset: **None**. Build command: **kosongkan**. Build output
   directory: `/` (root repo).
5. Klik **Save and Deploy**. URL produksi berbentuk
   `https://<nama-proyek>.pages.dev`.

Setiap push ke `main` akan memicu deploy otomatis. File `_headers` sudah
mengatur cache aset dan halaman HTML. Halaman 404 memakai `404.html`.

### Upload langsung lewat Wrangler

```bash
npx wrangler login
npx wrangler pages deploy . --project-name mochits-docs
```

Gunakan cara ini hanya bila tidak ingin menghubungkan repo. Integrasi Git lebih
mudah karena deploy berjalan otomatis setiap kali dokumentasi diperbarui.

## Menjaga dokumentasi tetap akurat

- Aturan parser di `tester.html`/`assets/app.js` harus mengikuti
  `app/src/main/java/com/mochits/app/script/ScriptParser.kt` di repo aplikasi.
- Nilai bawaan (pemisah `P\d+`, simbol, batas impor, rentang slider) ada di kode
  aplikasi dan Settings; perbarui halaman terkait bila kode berubah.
- Tautan "Panduan" di Settings aplikasi dapat diarahkan ke URL Cloudflare Pages
  setelah situs ini online.

## Lisensi

Konten dokumentasi mengikuti lisensi repo aplikasi MochiTs.
