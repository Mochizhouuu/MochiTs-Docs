/* MochiTs Docs — clean URL router, tema, pencarian teks penuh, dan artifact build. */
(function () {
  "use strict";
  var doc = document;

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* Tema: tombol memakai data-theme-toggle, bukan atribut di <html>. */
  (function () {
    var btn = doc.querySelector("[data-theme-toggle]");
    function current() { return doc.documentElement.getAttribute("data-theme") || "light"; }
    function paint() {
      var t = current();
      var meta = doc.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", t === "dark" ? "#0a0a0a" : "#fafafa");
      btn.setAttribute("aria-label", t === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap");
    }
    paint();
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      doc.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("mochits-theme", next); } catch (e) {}
      paint();
    });
  })();

  var paths = {
    home: "/", cek: "/cek-script/", guide: "/panduan/",
    instalasi: "/panduan/instalasi/", proyek: "/panduan/proyek/",
    halaman: "/panduan/halaman/", balon: "/panduan/balon/",
    teks: "/panduan/teks/", font: "/panduan/font/",
    simpan: "/panduan/simpan/", ekspor: "/panduan/ekspor/",
    developer: "/developer/", faq: "/faq/", changelog: "/changelog/"
  };
  var titles = {
    home: "Apa yang ingin kamu lakukan?", cek: "Cek Script", guide: "Alur kerja editor",
    instalasi: "Pasang APK", proyek: "Buat proyek", halaman: "Impor halaman",
    balon: "Atur balon", teks: "Tambah dan edit teks", font: "Atur font",
    simpan: "Simpan proyek", ekspor: "Ekspor hasil", developer: "Build dari sumber",
    faq: "FAQ & troubleshooting", changelog: "Build terbaru"
  };
  var crumbs = {
    home: ["MochiTs", "Beranda"], cek: ["MochiTs", "Alat", "Cek Script"],
    guide: ["MochiTs", "Panduan"], instalasi: ["MochiTs", "Panduan", "Pasang APK"],
    proyek: ["MochiTs", "Panduan", "Buat proyek"], halaman: ["MochiTs", "Panduan", "Impor halaman"],
    balon: ["MochiTs", "Panduan", "Atur balon"], teks: ["MochiTs", "Panduan", "Tambah teks"],
    font: ["MochiTs", "Panduan", "Atur font"], simpan: ["MochiTs", "Panduan", "Simpan proyek"],
    ekspor: ["MochiTs", "Panduan", "Ekspor hasil"], developer: ["MochiTs", "Pengembang"],
    faq: ["MochiTs", "Bantuan", "FAQ"], changelog: ["MochiTs", "Rilis", "Build terbaru"]
  };
  var navTree = [
    { group: "Mulai", items: [{ key: "home", path: "/" }, { key: "cek", path: "/cek-script/" }] },
    {
      group: "Panduan", items: [{ key: "guide", path: "/panduan/" }],
      sub: [
        ["instalasi", "Pasang APK"], ["proyek", "Buat proyek"], ["halaman", "Impor halaman"],
        ["balon", "Atur balon"], ["teks", "Tambah teks"], ["font", "Atur font"],
        ["simpan", "Simpan proyek"], ["ekspor", "Ekspor hasil"]
      ]
    },
    { group: "Pengembang", items: [{ key: "developer", path: "/developer/" }] },
    { group: "Bantuan", items: [{ key: "faq", path: "/faq/" }] },
    { group: "Rilis", items: [{ key: "changelog", path: "/changelog/" }] }
  ];

  var views = Array.prototype.slice.call(doc.querySelectorAll(".view"));
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll("[data-nav]"));
  var sideNav = doc.getElementById("side-nav");
  var drawerNav = doc.getElementById("drawer-nav");
  var onpageNav = doc.getElementById("onpage-nav");
  var drawer = doc.getElementById("drawer");
  var menuBtn = doc.querySelector("[data-menu-open]");

  function normalize(path) {
    if (!path || path === "/") return "/";
    path = path.replace(/\/{2,}/g, "/");
    return path.charAt(path.length - 1) === "/" ? path : path + "/";
  }
  function resolve(path) {
    var p = normalize(path);
    for (var key in paths) if (paths[key] === p) return key;
    return "home";
  }
  function headingsFor(view) {
    return Array.prototype.slice.call(view.querySelectorAll("h2[id], h3[id]"))
      .filter(function (h) { return h.textContent.trim() !== ""; });
  }
  function currentKey() { return resolve(location.pathname); }

  function renderNav(activeKey) {
    [sideNav, drawerNav].forEach(function (host) {
      if (!host) return;
      host.textContent = "";
      navTree.forEach(function (group) {
        var wrap = el("div", "nav-group");
        wrap.appendChild(el("p", "side-label", group.group));
        group.items.forEach(function (item) {
          var a = el("a", "", titles[item.key]);
          a.href = item.path;
          if (item.key === activeKey) a.setAttribute("aria-current", "page");
          wrap.appendChild(a);
        });
        if (group.sub) {
          var sub = el("div", "side-sub");
          group.sub.forEach(function (pair) {
            var a = el("a", "", pair[1]);
            a.href = paths[pair[0]];
            if (pair[0] === activeKey) a.setAttribute("aria-current", "page");
            sub.appendChild(a);
          });
          wrap.appendChild(sub);
        }
        host.appendChild(wrap);
      });
    });
  }

  function renderBreadcrumb(view, key) {
    if (!view) return;
    var head = view.querySelector(".page-head");
    if (!head) return;
    var old = head.querySelector(".breadcrumb");
    if (old) old.remove();
    var crumb = el("nav", "breadcrumb");
    crumb.setAttribute("aria-label", "Breadcrumb");
    (crumbs[key] || ["MochiTs", titles[key]]).forEach(function (name, i) {
      if (i) crumb.appendChild(el("span", "sep", "/"));
      crumb.appendChild(el("span", "", name));
    });
    head.insertBefore(crumb, head.firstChild);
  }

  function renderOnPage(activeView, key) {
    var hosts = [onpageNav, doc.getElementById("drawer-toc-nav")].filter(Boolean);
    hosts.forEach(function (h) { h.textContent = ""; });
    var box = doc.getElementById("drawer-toc");
    if (!activeView) { if (box) box.hidden = true; return; }
    var hs = headingsFor(activeView);
    hs.forEach(function (h) {
      hosts.forEach(function (host) {
        var a = el("a", "", h.textContent);
        a.href = paths[key] + "#" + h.id;
        if (host === onpageNav) a.setAttribute("data-target", h.id);
        host.appendChild(a);
      });
    });
    if (box) box.hidden = hs.length === 0;
    updateOnPage();
  }

  function updateOnPage() {
    if (!onpageNav) return;
    var links = Array.prototype.slice.call(onpageNav.querySelectorAll("a"));
    if (!links.length) return;
    var active = links[0];
    links.forEach(function (a) {
      var h = doc.getElementById(a.getAttribute("data-target"));
      if (h && h.getBoundingClientRect().top <= 140) active = a;
    });
    links.forEach(function (a) { a.classList.toggle("is-active", a === active); });
  }

  function route() {
    var key = currentKey();
    var target = doc.getElementById("view-" + key) || doc.getElementById("view-home");
    views.forEach(function (v) { v.classList.toggle("is-active", v === target); });
    doc.title = titles[key] + " — MochiTs";
    navLinks.forEach(function (a) {
      var href = normalize(a.getAttribute("href"));
      if (paths[key] === href) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    renderNav(key);
    renderBreadcrumb(target, key);
    renderOnPage(target, key);
    closeMenu();
    var search = doc.getElementById("search");
    if (search) search.hidden = true;
    if (location.hash) {
      var anchor = doc.getElementById(location.hash.slice(1));
      if (anchor) { anchor.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
    if (key === "changelog") loadBuilds();
  }

  function navigate(url) {
    var u = new URL(url, location.href);
    if (u.origin !== location.origin) { location.href = u.href; return; }
    history.pushState({}, "", u.pathname + u.search + u.hash);
    route();
  }

  doc.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    var u = new URL(href, location.href);
    if (u.origin !== location.origin) return;
    e.preventDefault();
    navigate(href);
  });
  window.addEventListener("popstate", route);
  window.addEventListener("scroll", updateOnPage, { passive: true });

  function openMenu() {
    drawer.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    doc.body.classList.add("menu-open");
  }
  function closeMenu() {
    if (!drawer || !menuBtn) return;
    drawer.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    doc.body.classList.remove("menu-open");
  }
  menuBtn.addEventListener("click", openMenu);
  var closeBtn = doc.querySelector("[data-menu-close]");
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer || (e.target.tagName === "A" && drawer.contains(e.target))) closeMenu();
  });

  /* Pencarian teks penuh, dibangun dari konten yang sudah ada. */
  var index = [];
  views.forEach(function (v) {
    var key = v.getAttribute("data-view");
    var currentTitle = titles[key];
    var currentId = "";
    Array.prototype.forEach.call(
      v.querySelectorAll('.prose h2[id], .prose h3[id], .prose p, .prose li, .prose td, .prose th, .task-card'),
      function (node) {
        if (/^H[23]$/.test(node.tagName) && node.id) {
          currentTitle = node.textContent.trim();
          currentId = node.id;
          return;
        }
        var text = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (text.length > 12) {
          index.push({ title: currentTitle, snippet: text, key: key, path: paths[key], id: currentId });
        }
      }
    );
  });

  var search = doc.getElementById("search");
  var searchInput = doc.getElementById("search-input");
  var searchResults = doc.getElementById("search-results");
  function plain(v) { return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function renderSearch(q) {
    var terms = plain(q).trim().split(/\s+/).filter(Boolean);
    var found = !terms.length ? index.slice(0, 12) : index.filter(function (it) {
      var hay = plain(it.title + " " + it.snippet);
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
    searchResults.textContent = "";
    if (!found.length) { searchResults.appendChild(el("p", "hint", "Tidak ada hasil.")); return; }
    found.slice(0, 12).forEach(function (it) {
      var a = el("a");
      a.href = it.path + (it.id ? "#" + it.id : "");
      a.appendChild(el("strong", "", it.title));
      a.appendChild(el("span", "search-snippet", it.snippet.slice(0, 120)));
      a.appendChild(el("small", "", titles[it.key]));
      searchResults.appendChild(a);
    });
  }
  Array.prototype.forEach.call(doc.querySelectorAll("[data-search-open]"), function (btn) {
    btn.addEventListener("click", function () { search.hidden = false; searchInput.focus(); });
  });
  doc.querySelector("[data-search-close]").addEventListener("click", function () { search.hidden = true; });
  search.addEventListener("click", function (e) {
    if (e.target === search || (e.target.tagName === "A" && searchResults.contains(e.target))) search.hidden = true;
  });
  searchInput.addEventListener("input", function () { renderSearch(searchInput.value); });
  renderSearch("");

  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeMenu(); search.hidden = true; }
    if (e.key === "/" && doc.activeElement !== searchInput) { e.preventDefault(); search.hidden = false; searchInput.focus(); }
  });

  /* Code block: salin + pewarnaan ringan. */
  function highlight(code) {
    var text = code.textContent;
    var re = /(\/\/[^\n]*|#[^\n]*|\b(?:val|var|fun|class|object|data|suspend|if|else|return|import|package|when|true|false|null)\b|\b\d+\b|"(?:[^"\\]|\\.)*")/g;
    var frag = doc.createDocumentFragment();
    var last = 0; var m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      var cls = /^(\/\/|#)/.test(m[0]) || /^\d+$/.test(m[0]) || /^"/.test(m[0]) ? "tok-muted" : "tok-accent";
      frag.appendChild(el("span", cls, m[0]));
      last = re.lastIndex;
    }
    if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
    code.textContent = "";
    code.appendChild(frag);
  }
  Array.prototype.forEach.call(doc.querySelectorAll("pre > code"), function (code) {
    var pre = code.parentElement;
    var btn = el("button", "text-btn copy-btn", "Salin");
    btn.type = "button";
    btn.addEventListener("click", function () {
      var text = code.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { btn.textContent = "Tersalin"; }, function () { btn.textContent = "Gagal"; });
      } else {
        var ta = el("textarea");
        ta.value = text;
        doc.body.appendChild(ta);
        ta.select();
        try { doc.execCommand("copy"); btn.textContent = "Tersalin"; } catch (err) { btn.textContent = "Gagal"; }
        doc.body.removeChild(ta);
      }
      setTimeout(function () { btn.textContent = "Salin"; }, 1600);
    });
    pre.insertBefore(btn, code);
    highlight(code);
  });
  Array.prototype.forEach.call(doc.querySelectorAll("table"), function (table) {
    if (table.parentElement && table.parentElement.classList.contains("table-wrap")) return;
    var wrap = el("div", "table-wrap");
    table.parentElement.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  /* Build terbaru dari artifact GitHub Actions. */
  var buildsLoaded = false;
  function loadBuilds() {
    if (buildsLoaded) return;
    buildsLoaded = true;
    var status = doc.getElementById("build-status");
    var list = doc.getElementById("build-list");
    if (!status || !list) return;
    status.textContent = "Memuat build terbaru…";
    fetch("https://api.github.com/repos/Mochizhouuu/MochiTs/actions/workflows/android-build.yml/runs?status=success&per_page=1")
      .then(function (r) { if (!r.ok) throw new Error("Build tidak dapat dimuat."); return r.json(); })
      .then(function (d) {
        var run = d.workflow_runs && d.workflow_runs[0];
        if (!run) throw new Error("Belum ada build sukses.");
        return fetch("https://api.github.com/repos/Mochizhouuu/MochiTs/actions/runs/" + run.id + "/artifacts")
          .then(function (r) { if (!r.ok) throw new Error("Artifact tidak dapat dimuat."); return r.json(); })
          .then(function (a) { return { run: run, artifacts: a.artifacts || [] }; });
      })
      .then(function (data) {
        status.textContent = "Build #" + data.run.run_number + " · " + (data.run.created_at || "").slice(0, 10);
        list.textContent = "";
        data.artifacts.forEach(function (art) {
          var li = el("li");
          var link = el("a", "", art.name);
          link.href = "https://github.com/Mochizhouuu/MochiTs/actions/runs/" + data.run.id + "/artifacts/" + art.id;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          li.appendChild(link);
          li.appendChild(el("small", "", Math.round((art.size_in_bytes || 0) / 1048576) + " MB" + (art.expired ? " · kedaluwarsa" : "")));
          list.appendChild(li);
        });
        if (!data.artifacts.length) status.textContent += " · tidak ada artifact";
      })
      .catch(function (e) { status.textContent = e.message || "Build tidak dapat dimuat."; });
  }

  if (window.MochiCekScript) window.MochiCekScript.init();
  route();
})();
