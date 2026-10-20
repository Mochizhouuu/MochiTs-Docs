# MochiTs Docs

Dokumentasi statis untuk [MochiTs](https://github.com/Mochizhouuu/MochiTs) — editor
typeset komik Android. Bahasa Indonesia, tanpa build step, siap di-deploy ke Netlify.

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

## Deploy ke Netlify

1. Masuk ke Netlify, pilih **Add new site → Import an existing project**.
2. Hubungkan repo `Mochizhouuu/MochiTs-Docs`.
3. Build command: **kosongkan**. Publish directory: `.` (root repo).
4. Deploy. URL produksi akan diberikan Netlify (mis. `https://mochits-docs.netlify.app`).

`netlify.toml` sudah mengatur publish directory dan cache aset. Setiap push ke
`main` akan memicu deploy otomatis. Alternatif tanpa Git: drag-and-drop folder
ini ke Netlify Drop.

## Menjaga dokumentasi tetap akurat

- Aturan parser di `tester.html`/`assets/app.js` harus mengikuti
  `app/src/main/java/com/mochits/app/script/ScriptParser.kt` di repo aplikasi.
- Nilai bawaan (pemisah `P\d+`, simbol, batas impor, rentang slider) ada di kode
  aplikasi dan Settings; perbarui halaman terkait bila kode berubah.
- Tautan "Panduan" di Settings aplikasi dapat diarahkan ke URL Netlify setelah
  situs ini online.

## Lisensi

Konten dokumentasi mengikuti lisensi repo aplikasi MochiTs.
