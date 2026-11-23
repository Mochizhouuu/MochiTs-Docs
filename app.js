/* MochiTs — router instan, tema, pencarian, navigasi, dan bantuan kode. */
(function () {
  "use strict";
  var doc = document;

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* Tema */
  (function () {
    var btn = doc.querySelector("[data-theme]");
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

  var routes = {
    "": "home", "cek-script": "cek", "panduan": "panduan",
    "faq": "faq", "developer": "developer", "changelog": "changelog"
  };
  var titles = {
    home: "Beranda", cek: "Cek Script", panduan: "Penggunaan editor",
    faq: "FAQ & troubleshooting", developer: "Build dari sumber", changelog: "Riwayat perubahan"
  };
  var chapters = [
    { key: "home", title: "Beranda", group: "Mulai" },
    { key: "cek", title: "Cek Script", group: "Mulai" },
    { key: "panduan", title: "Penggunaan editor", group: "Panduan" },
    { key: "developer", title: "Build dari sumber", group: "Pengembang" },
    { key: "faq", title: "FAQ & troubleshooting", group: "Bantuan" },
    { key: "changelog", title: "Riwayat perubahan", group: "Rilis" }
  ];

  var views = Array.prototype.slice.call(doc.querySelectorAll(".view"));
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll("[data-nav]"));
  var sideNav = doc.getElementById("side-nav");
  var drawerNav = doc.getElementById("drawer-nav");
  var onpageNav = doc.getElementById("onpage-nav");
  var drawer = doc.getElementById("drawer");
  var menuBtn = doc.querySelector("[data-menu-open]");

  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, "");
    var parts = raw.split("#");
    return { key: routes[parts[0]] || "home", anchor: parts[1] || "" };
  }

  function headingsFor(view) {
    return Array.prototype.slice.call(view.querySelectorAll("h2[id], h3[id]"))
      .filter(function (h) { return h.textContent.trim() !== ""; });
  }

  function routeOf(key) {
    return key === "home" ? "#/" : "#/" + (key === "cek" ? "cek-script" : key);
  }

  function renderNav(activeKey, activeView) {
    [sideNav, drawerNav].forEach(function (host) {
      if (!host) return;
      host.textContent = "";
      ["Mulai", "Panduan", "Pengembang", "Bantuan", "Rilis"].forEach(function (group) {
        var wrap = el("div", "nav-group");
        wrap.appendChild(el("p", "side-label", group));
        chapters.filter(function (c) { return c.group === group; }).forEach(function (c) {
          var a = el("a", "", c.title);
          a.href = routeOf(c.key);
          if (c.key === activeKey) a.setAttribute("aria-current", "page");
          wrap.appendChild(a);
          if (c.key === "panduan") {
            var guide = doc.getElementById("view-panduan");
            var sub = el("div", "side-sub");
            if (guide) {
              headingsFor(guide).forEach(function (h) {
                var link = el("a", "", h.textContent);
                link.href = "#/panduan#" + h.id;
                sub.appendChild(link);
              });
            }
            wrap.appendChild(sub);
          }
        });
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
    var names = [ "MochiTs", chapters.filter(function (c) { return c.key === key; })[0].group, titles[key] ];
    names.forEach(function (name, i) {
      if (i) crumb.appendChild(el("span", "sep", "/"));
      crumb.appendChild(el("span", "", name));
    });
    head.insertBefore(crumb, head.firstChild);
  }

  function renderOnPage(activeView) {
    var hosts = [onpageNav, doc.getElementById("drawer-toc-nav")].filter(Boolean);
    hosts.forEach(function (host) { host.textContent = ""; });
    var box = doc.getElementById("drawer-toc");
    if (!activeView) { if (box) box.hidden = true; return; }
    var key = activeView.getAttribute("data-view");
    var routeName = key === "cek" ? "cek-script" : key;
    headingsFor(activeView).forEach(function (h) {
      hosts.forEach(function (host) {
        var a = el("a", "", h.textContent);
        a.href = "#/" + (key === "home" ? "" : routeName) + "#" + h.id;
        if (host === onpageNav) a.setAttribute("data-target", h.id);
        host.appendChild(a);
      });
    });
    if (box) box.hidden = headingsFor(activeView).length === 0;
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
    var r = parseHash();
    var target = doc.getElementById("view-" + r.key) || doc.getElementById("view-home");
    views.forEach(function (v) { v.classList.toggle("is-active", v === target); });
    var key = target.getAttribute("data-view");
    doc.title = titles[key] + " — MochiTs";
    navLinks.forEach(function (a) {
      if (a.getAttribute("data-nav") === key) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    renderNav(key, target);
    renderBreadcrumb(target, key);
    renderOnPage(target);
    if (key === "changelog") loadRelease();
    closeMenu();
    if (r.anchor) {
      var elm = doc.getElementById(r.anchor);
      if (elm) { elm.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

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

  /* Pencarian client-side */
  var search = doc.getElementById("search");
  var searchInput = doc.getElementById("search-input");
  var searchResults = doc.getElementById("search-results");
  var index = [];
  views.forEach(function (v) {
    var key = v.getAttribute("data-view");
    headingsFor(v).forEach(function (h) {
      index.push({ title: h.textContent.trim(), key: key, id: h.id });
    });
    if (key === "home") index.push({ title: "Beranda", key: "home", id: "" });
  });

  function plain(v) {
    return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function renderSearch(q) {
    var terms = plain(q).trim().split(/\s+/).filter(Boolean);
    var found = !terms.length ? index.slice(0, 10) : index.filter(function (it) {
      var t = plain(it.title);
      return terms.every(function (x) { return t.indexOf(x) !== -1; });
    });
    searchResults.textContent = "";
    if (!found.length) { searchResults.appendChild(el("p", "hint", "Tidak ada hasil.")); return; }
    found.forEach(function (it) {
      var a = el("a");
      var routeName = it.key === "cek" ? "cek-script" : it.key;
      a.href = "#/" + (it.key === "home" ? "" : routeName) + (it.id ? "#" + it.id : "");
      a.appendChild(el("strong", "", it.title));
      a.appendChild(el("small", "", titles[it.key]));
      searchResults.appendChild(a);
    });
  }
  doc.querySelector("[data-search-open]").addEventListener("click", function () {
    search.hidden = false;
    searchInput.focus();
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
  window.addEventListener("hashchange", route);
  window.addEventListener("scroll", updateOnPage, { passive: true });

  /* Code block: copy + pewarnaan ringan */
  function highlight(code) {
    var text = code.textContent;
    var re = /(\/\/[^\n]*|#[^\n]*|\b(?:val|var|fun|class|object|data|suspend|if|else|return|import|package|when|true|false|null)\b|\b\d+\b|"(?:[^"\\]|\\.)*")/g;
    var frag = doc.createDocumentFragment();
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      var span = el("span", /^(\/\/|#)/.test(m[0]) || /^\d+$/.test(m[0]) || /^"/.test(m[0]) ? "tok-muted" : "tok-accent", m[0]);
      frag.appendChild(span);
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
        try { doc.execCommand("copy"); btn.textContent = "Tersalin"; } catch (e) { btn.textContent = "Gagal"; }
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

  /* Rilis terbaru dari GitHub (tapi mati bila tak ada rilis / offline). */
  var releaseLoaded = false;
  function loadRelease() {
    if (releaseLoaded) return;
    releaseLoaded = true;
    var status = doc.getElementById("release-status");
    var card = doc.getElementById("release-card");
    if (!status || !card) return;
    status.textContent = "Memuat rilis terbaru…";
    fetch("https://api.github.com/repos/Mochizhouuu/MochiTs/releases/latest")
      .then(function (r) {
        if (!r.ok) throw new Error(r.status === 404 ? "Belum ada rilis publik." : "Gagal memuat rilis.");
        return r.json();
      })
      .then(function (d) {
        status.textContent = "";
        doc.getElementById("release-title").textContent = d.tag_name || "Rilis terbaru";
        doc.getElementById("release-meta").textContent =
          (d.name ? d.name + " · " : "") + (d.published_at || "").slice(0, 10);
        var body = doc.getElementById("release-body");
        body.textContent = (d.body || "Tidak ada catatan rilis.").slice(0, 3000);
        card.hidden = false;
      })
      .catch(function (e) {
        status.textContent = e.message === "Belum ada rilis publik."
          ? "Belum ada rilis publik."
          : "Rilis tidak dapat dimuat. Cek tautan GitHub di bawah.";
      });
  }

  if (window.MochiCekScript) window.MochiCekScript.init();
  route();
})();
