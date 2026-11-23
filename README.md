# MochiTs

Dokumentasi statis untuk aplikasi Android MochiTs. HTML/CSS/JS murni, tanpa build step.

## Halaman

Semua halaman ada di `index.html` dan dipilih lewat hash:

- `#/` — Beranda
- `#/cek-script` — Cek Script (client-side)
- `#/panduan` — alur editor delapan langkah
- `#/developer` — build dan GitHub Actions
- `#/faq` — troubleshooting
- `#/changelog` — rilis terbaru dari GitHub API

## File

- `index.html` — konten dan struktur halaman.
- `tokens-v3.css` — warna, spasi, tipografi, dan state token.
- `styles-v3.css` — layout responsif dan komponen.
- `app-v3.js` — router, tema, pencarian, drawer, daftar isi, salin kode, dan pengambilan rilis.
- `cek-script-v3.js` — pemeriksa Script TL yang mengikuti `ScriptParser.kt` aplikasi.
- `logo-mochits.png` — logo yang sama dengan aplikasi.
- `_headers` — header Cloudflare Pages, termasuk CSP.

## Menjalankan lokal

```sh
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Deploy

Upload isi folder ke GitHub Pages, Netlify, atau Cloudflare Pages. Tidak ada perintah build.

Halaman changelog memanggil GitHub API saat dibuka; CSP di `_headers` mengizinkan `api.github.com`. Bila rilis belum ada atau jaringan mati, halaman menampilkan pesan dan tautan ke GitHub.
