/* ==========================================================================
   Service worker MochiTs Docs
   Semua aset statis yang sudah dikenal di-precache saat pemasangan, lalu
   dilayani cache-first. Klaim "bisa dibaca offline" menjadi benar:
   tanpa jaringan, seluruh halaman panduan tetap terbuka.
   Strategi:
   - install   : precache daftar di bawah (berhenti bila gagal)
   - activate  : hapus cache versi lama, klaim klien langsung
   - fetch     : cache-first untuk GET same-origin; hasil yang belum ada
                 di cache ikut disimpan (runtime cache) untuk kunjungan
                 berikutnya
   Naikkan versi cache setiap kali ada perubahan konten agar semua
   pengunjung menerima salinan terbaru.
   ========================================================================== */

var CACHE = "mochits-docs-v2026.10.26";

var PRECACHE = [
  "index.html",
  "mulai.html",
  "folder-zip.html",
  "teks.html",
  "script.html",
  "tester.html",
  "ekspor.html",
  "faq.html",
  "changelog.html",
  "404.html",
  "assets/style.css",
  "assets/app.js",
  "assets/fonts/inter-latin.woff2",
  "assets/fonts/jetbrains-mono-latin.woff2",
  "assets/logo.png",
  "assets/logo-mark.png",
  "assets/og-cover.png",
  "assets/favicon-32.png",
  "assets/icon-48.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png",
  "assets/screens/app-home.webp",
  "assets/screens/app-editor.webp",
  "assets/screens/app-settings.webp",
  "assets/screens/thumb-bab01.webp",
  "assets/screens/thumb-bab02.webp",
  "assets/screens/thumb-bab03.webp",
  "assets/screens/thumb-bab04.webp",
  "assets/screens/thumb-bab05.svg",
  "assets/screens/thumb-bab06.webp",
  "assets/screens/thumb-bab07.webp",
  "assets/screens/shot-editor-bar.webp",
  "assets/screens/shot-settings-font.webp",
  "search-index.json",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(PRECACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE) return caches.delete(key);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;

  /* Hanya tangani GET, same-origin, tanpa rentang; biarkan sisanya ke network */
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  if (request.headers.get("range")) return;

  event.respondWith(
    caches.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request)
        .then(function (response) {
          if (response && response.ok && response.type === "basic" && response.status !== 206) {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          /* Offline dan belum tersimpan: halaman HTML arahkan ke fallback */
          if (request.mode === "navigate") {
            return caches.match("404.html").then(function (fallbackPage) {
              return (
                fallbackPage ||
                new Response("Halaman tidak tersedia offline", {
                  status: 503,
                  headers: { "Content-Type": "text/html; charset=utf-8" }
                })
              );
            });
          }
          return new Response("Aset tidak tersedia offline", { status: 503, statusText: "Offline" });
        });
    })
  );
});
