# MochiTs

Dokumentasi statis untuk aplikasi Android MochiTs. HTML/CSS/JS murni, tanpa build step.

## File

- `index.html` — empat halaman (Beranda, Cek Script, Panduan, FAQ) dalam satu file, dipilih lewat hash.
- `tokens.css` — warna, spasi, tipografi, dan state token untuk tema terang/gelap.
- `styles.css` — komponen dan layout responsif.
- `app.js` — router, tema, pencarian, drawer, indeks halaman, tombol salin kode.
- `cek-script.js` — logika pemeriksa Script TL (murni klien) dan perender hasilnya.
- `_headers` — header keamanan untuk Cloudflare Pages (termasuk CSP).

## Menjalankan lokal

Buka `index.html` lewat server statis sederhana:

```sh
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Deploy

Upload seluruh isi folder ke GitHub Pages, Netlify, atau Cloudflare Pages. Tidak ada perintah build.

## Catatan

Aturan Cek Script memakai marker `P1`/`P2` untuk halaman dan `-`, `[]`, `#`, `*`, `**`, `<>`, `//` untuk entri. Aturan ini adalah asumsi awal dan bisa disesuaikan di `cek-script.js`.
