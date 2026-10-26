# MochiTs Docs

Dokumentasi pengguna untuk [MochiTs](https://github.com/Mochizhouuu/MochiTs), editor
typeset komik Android. Ditulis dalam bahasa Indonesia, memakai logo aplikasi, dan
tersedia dalam mode terang serta gelap.

**Situs:** https://mochits.my.id/

## Isi

| Halaman | Bahasan |
|---|---|
| `index.html` | Beranda, alur singkat, dan daftar bab |
| `mulai.html` | Pemasangan, proyek pertama, Home, dan Editor |
| `folder-zip.html` | Folder proyek, impor gambar, dan ZIP |
| `teks.html` | Teks, font, efek, clipping mask, dan inpainting |
| `script.html` | Format Script TL, simbol, dan pemisah halaman |
| `tester.html` | Tester Script TL dan pola pemisah di browser |
| `ekspor.html` | PNG, JPEG, WEBP, dan file proyek MTS |
| `faq.html` | Pertanyaan yang sering muncul |
| `404.html` | Halaman error (tidak diindeks mesin pencari) |

## Fitur situs

- **Tema biru** yang mengikuti warna aplikasi, dengan mode terang dan gelap.
  Pilihan pengguna disimpan di `localStorage`; tanpa pilihan, tema mengikuti
  pengaturan sistem. Semua klaim kontras diperiksa pada kedua tema (WCAG AA).
- **Logo aplikasi** dipakai di header, footer, favicon, ikon PWA, dan gambar
  pratinjau media sosial.
- **Pencarian cepat** lewat tombol Cari, tombol `/`, atau `Ctrl`/`Cmd` + `K`.
  Hasil diambil dari `search-index.json`. Alamat `/?q=kata` juga didukung agar
  bisa dipakai sebagai `SearchAction` di data terstruktur.
- **Offline-first** lewat service worker (`sw.js`): semua aset statis diprecache
  saat install, lalu dilayani cache-first. Klaim "bisa dibaca offline" kini benar.
- **Font self-hosted** (subset latin, woff2): Inter (variable 400–800) dan
  JetBrains Mono (400–600) di `assets/fonts/`, dengan preload untuk menekan LCP.
- **Beranda padat**: hero dengan screenshot aplikasi asli, seksi banding
  before/after, kartu <em>Mulai cepat</em>, daftar bab dengan thumbnail, demo
  tester Script TL inline, dan penutup CTA.
- **Animasi halus** saat berpindah halaman dan membuka menu, dengan dukungan
  `prefers-reduced-motion`.
- **SEO** melalui canonical, Open Graph, Twitter Card, JSON-LD, `robots.txt`,
  `sitemap.xml`, dan `site.webmanifest`.

## Struktur

```text
.
├── *.html                  halaman dokumentasi (termasuk changelog.html)
├── assets/
│   ├── style.css           tema, komponen, dan animasi
│   ├── app.js              menu, pencarian, tema, TOC, tester, before/after
│   ├── fonts/              font self-hosted (Inter + JetBrains Mono, woff2)
│   ├── screens/            screenshot aplikasi asli + thumbnail bab
│   ├── logo.png            logo lengkap
│   ├── logo-mark.png       logo untuk header dan footer
│   ├── favicon-*.png       favicon
│   ├── icon-*.png          ikon PWA
│   ├── apple-touch-icon.png
│   └── og-cover.png        gambar 1200 × 630
├── search-index.json       indeks pencarian
├── site.webmanifest        manifes PWA
├── robots.txt
├── sitemap.xml
├── sw.js                   service worker (precache + cache-first)
└── _headers                aturan cache dan header keamanan
```

## Pratinjau lokal

Situs ini statis tanpa proses build. Jalankan server dari folder ini:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000/`. Jangan membuka `index.html` langsung lewat
`file://`, karena pencarian membutuhkan `fetch` untuk membaca `search-index.json`.

## Menambah atau mengubah isi

1. Sunting halaman yang sesuai di root repo.
2. Tambahkan atau ubah judul bagian dengan `id` yang stabil. `id` ini dipakai
   untuk tautan langsung dan hasil pencarian.
3. Perbarui `search-index.json` agar bagian baru bisa ditemukan. Setiap entri
   memakai bentuk berikut:

   ```json
   {
     "page": "teks.html",
     "pageTitle": "Teks & spasi",
     "title": "Jarak huruf dan jarak baris",
     "id": "spasi",
     "text": "Ringkasan singkat isi bagian."
   }
   ```

4. Bila menambah halaman baru, perbarui juga `sitemap.xml`, menu di semua
   halaman, dan tautan footer.

## Prinsip penulisan

- Jelaskan alur kerja aplikasi, bukan riwayat pengembangannya.
- Gunakan bahasa sehari-hari. Istilah teknis tetap dipakai bila merupakan nama
  fitur di antarmuka, tetapi selalu diberi penjelasan singkat.
- Jangan menerjemahkan nama alat atau tombol aplikasi seperti Erase, Effect,
  Script, Brush, atau Opacity.
- Gunakan istilah yang sama dengan antarmuka MochiTs.
- Aturan parser di `tester.html` dan `assets/app.js` mengikuti
  `ScriptParser.kt` di repo aplikasi.
- Tester berjalan sepenuhnya di browser. Tidak ada naskah yang dikirim ke server.

## Aset merek

Logo di `assets/` berasal dari aplikasi MochiTs:

- `app/src/main/res/drawable-nodpi/logo_mochits.png` untuk logo lengkap.
- `app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` untuk logo mark dan ikon.

Palet utama mengikuti `app/src/main/java/com/mochits/app/ui/theme/Theme.kt`
(biru `#0A6EF0`, latar terang `#F7F9FF`, latar gelap `#0F141D`).

## Lisensi

Konten dokumentasi mengikuti lisensi repo aplikasi MochiTs.
