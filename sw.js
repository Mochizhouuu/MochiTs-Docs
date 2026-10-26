/* ==========================================================================
   Service worker MochiTs Docs
   Semua aset statis yang sudah dikenal di-precache saat pemasangan, lalu
   dilayani cache-first. Klaim "bisa dibaca offline" menjadi benar:
   tanpa jaringan, seluruh halaman panduan tetap terbuka.

   Konfigurasi produksi (mochits.my.id) memakai Cloudflare: request ke
   "/mulai.html" di-redirect 308 ke "/mulai" (extensionless). Agar cache
   selalu tertemukan, semua key dinormalisasi ke bentuk yang di-serve
   (tanpa ".html") dan setiap hit kembali disajikan lewat URL yang
   sama dengan request.

   Strategi:
   - install   : precache daftar di bawah (coba URL yang benar, tahan redirect)
   - activate  : hapus cache versi lama, klaim klien langsung
   - fetch     : cache-first untuk GET same-origin; hasil yang belum ada
                 di cache ikut disimpan (runtime cache) untuk kunjungan
                 berikutnya
   Naikkan versi cache setiap kali ada perubahan konten agar semua
   pengunjung menerima salinan terbaru.
   ========================================================================== */

var CACHE = "mochits-docs-v2026.10.27";

/* Nama file dokumen. Di-serve dengan redirect .html -> extensionless. */
var PAGES = [
  "index.html",
  "mulai.html",
  "folder-zip.html",
  "teks.html",
  "script.html",
  "tester.html",
  "ekspor.html",
  "faq.html",
  "changelog.html",
  "404.html"
];

/* Aset statis yang selalu dipakai. */
var ASSETS = [
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

/* Normalisasi cache key: "/x.html" <-> "/x" -> "/x".
   Memastikan request ".html" dan request tanpa ekstensi bertemu key yang sama. */
function normKey(url) {
  var u = new URL(url, self.location.origin);
  if (u.pathname === "/index.html") u.pathname = "/";
  else if (/\.html$/.test(u.pathname)) u.pathname = u.pathname.slice(0, -5);
  return u.pathname;
}

/* Cari salah satu URL (biasanya .html) di cache; cocokkan lewat key
   yang dinormalisasi. Return Response atau null. */
function findInCache(requestUrl) {
  var key = normKey(requestUrl);
  return caches.open(CACHE).then(function (cache) {
    /* Coba key yang persis dulu, lalu varian .html / extensionless */
    var candidates = [
      "/index.html" === key ? "/" : key,
      key,
      key + ".html"
    ];
    return (async function () {
      for (var i = 0; i < candidates.length; i++) {
        var hit = await cache.match(candidates[i], { ignoreSearch: true });
        if (hit) return hit;
      }
      /* Jari-jari terakhir: telusuri seluruh isi cache untuk kunci key */
      var keys = await cache.keys();
      for (var j = 0; j < keys.length; j++) {
        var ku = keys[j];
        var kurl = ku instanceof Request ? ku.url : String(ku);
        if (normKey(kurl) === key) return cache.match(keys[j]);
      }
      return null;
    })();
  });
}

/* Saat install, coba fetch URL yang benar di server. Karena produksi
   me-redirect 308 /mulai.html -> /mulai, kita coba /mulai dahulu lalu
   .html, dan simpan dengan URL yang sukses. */
function precacheOne(cache, name) {
  var candidates = [];
  if (PAGES.indexOf(name) !== -1) {
    candidates.push(name.replace(/\.html$/, "").length ? name.replace(/\.html$/, "") : name);
    candidates.push(name);
  } else {
    candidates.push(name);
  }
  return candidates.reduce(function (chain, u) {
    return chain.catch(function () {
      return fetch(u).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " untuk " + u);
        /* simpan di bawah key yang dinormalisasi */
        var keyUrl = new URL(u, self.location.origin).toString();
        if (PAGES.indexOf(name) !== -1) {
          /* pakai URL tanpa ekstensi sebagai key supaya konsistensi
             dengan runtime .html */
          var kurl = new URL(normKey(u), self.location.origin).toString();
          return cache.put(kurl, r);
        }
        return cache.put(keyUrl, r);
      });
    });
  }, Promise.resolve());
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        var jobs = [];
        PAGES.forEach(function (p) { jobs.push(precacheOne(cache, p)); });
        ASSETS.forEach(function (a) {
          jobs.push(
            fetch(a).then(function (r) {
              if (!r.ok) throw new Error("HTTP " + r.status + " untuk " + a);
              return cache.put(a, r);
            })
          );
        });
        return Promise.all(jobs);
      })
      .then(function () {
        return self.skipWaiting();
      })
      .catch(function (err) {
        /* Satu aset gagal tidak harus mematikan seluruh install. */
        console.warn("[sw] precache sebagian gagal:", err);
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

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  if (request.headers.get("range")) return;

  var isNavigate = request.mode === "navigate";

  event.respondWith(
    findInCache(request.url).then(function (hit) {
      if (hit) return hit;
      /* Tidak ada di cache: coba network. */
      return fetch(request)
        .then(function (response) {
          if (response && response.ok && response.type === "basic" && response.status !== 206) {
            var copy = response.clone();
            var keyUrl;
            if (PAGES.some(function (p) { return request.url.indexOf(p.replace(/\.html$/, "")) !== -1; })) {
              keyUrl = new URL(normKey(request.url), self.location.origin).toString();
            } else {
              keyUrl = request.url;
            }
            caches.open(CACHE).then(function (cache) {
              cache.put(keyUrl, copy);
            });
          }
          return response;
        })
        .catch(function () {
          if (isNavigate) {
            return findInCache(request.url).then(function (again) {
              if (again) return again;
              return findInCache("404.html").then(function (fallbackPage) {
                return (
                  fallbackPage ||
                  new Response("<!doctype html><meta charset=utf-8><title>Offline</title><h1>Halaman tidak tersedia offline</h1>", {
                    status: 503,
                    headers: { "Content-Type": "text/html; charset=utf-8" }
                  })
                );
              });
            });
          }
          return new Response("Aset tidak tersedia offline", { status: 503, statusText: "Offline" });
        });
    })
  );
});
