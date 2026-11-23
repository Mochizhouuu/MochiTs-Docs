# MochiTs

Dokumentasi statis untuk aplikasi Android MochiTs. HTML/CSS/JS murni, tanpa build step.

## Halaman

URL bersih (bukan hash) lewat History API:

- `/` — Beranda, search-first
- `/cek-script/` — Cek Script (client-side)
- `/panduan/` — indeks alur editor
- `/panduan/instalasi/` … `/panduan/ekspor/` — satu halaman per tugas
- `/developer/` — build dan GitHub Actions
- `/faq/` — troubleshooting
- `/changelog/` — artifact build terbaru

`_redirects` meneruskan semua path ke `index.html` di Cloudflare Pages.

## File

- `index.html` — konten dan struktur.
- `tokens-v4.css` — warna, spasi, tipografi, state token.
- `styles-v4.css` — layout dan komponen.
- `app-v4.js` — router clean URL, tema, pencarian teks penuh, daftar isi, artifact build.
- `cek-script-v4.js` — pemeriksa Script TL yang mengikuti `ScriptParser.kt` aplikasi.
- `logo-mochits.png` — logo aplikasi.
- `_headers` — CSP dan header keamanan.
- `_redirects` — fallback SPA untuk Cloudflare Pages.

## Menjalankan lokal

```sh
python3 -m http.server 8000
```

Buka `http://localhost:8000/`. Untuk path bertingkat, pakai host dengan fallback SPA (Cloudflare Pages).

## Deploy

Upload isi folder ke Cloudflare Pages, Netlify, atau GitHub Pages. Tidak ada perintah build.
