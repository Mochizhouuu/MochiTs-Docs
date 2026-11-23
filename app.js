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
    "": "home", "cek-script": "cek", "panduan": "panduan", "faq": "faq"
  };
  var titles = {
    home: "Beranda", cek: "Cek Script", panduan: "Panduan penggunaan editor", faq: "FAQ"
  };
  var chapters = [
    { key: "home", title: "Beranda" },
    { key: "cek", title: "Cek Script" },
    { key: "panduan", title: "Panduan penggunaan editor" },
    { key: "faq", title: "FAQ" }
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
    return Array.prototype.slice.call(view.querySelectorAll("h2[id], h3[id]"));
  }

  function renderNav(activeKey, activeView) {
    [sideNav, drawerNav].forEach(function (host) {
      if (!host) return;
      host.textContent = "";
      chapters.forEach(function (c) {
        var a = el("a", "", c.title);
        a.href = c.key === "home" ? "#/" : "#/" + (c.key === "cek" ? "cek-script" : c.key);
        if (c.key === activeKey) a.setAttribute("aria-current", "page");
        host.appendChild(a);
        if (c.key === activeKey && host === sideNav && activeView) {
          var sub = el("div", "side-sub");
          headingsFor(activeView).forEach(function (h) {
            var s = el("a", "", h.textContent);
            s.href = "#/" + (activeKey === "cek" ? "cek-script" : activeKey) + "#" + h.id;
            sub.appendChild(s);
          });
          host.appendChild(sub);
        }
      });
    });
  }

  function renderOnPage(activeView) {
    if (!onpageNav) return;
    onpageNav.textContent = "";
    if (!activeView) return;
    headingsFor(activeView).forEach(function (h) {
      var a = el("a", "", h.textContent);
      a.href = "#/" + (activeView.getAttribute("data-view") === "cek" ? "cek-script" : activeView.getAttribute("data-view")) + "#" + h.id;
      a.setAttribute("data-target", h.id);
      onpageNav.appendChild(a);
    });
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
    renderOnPage(target);
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

  if (window.MochiCekScript) window.MochiCekScript.init();
  route();
})();
