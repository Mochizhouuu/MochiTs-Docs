/* MochiTs Docs: navigasi, pencarian, dan tester parser TL. */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var overlay = doc.getElementById("search-overlay");
  var searchInput = doc.getElementById("search-input");
  var searchResults = doc.getElementById("search-results");
  var searchSummary = doc.getElementById("search-summary");
  var menu = doc.getElementById("site-menu");
  var menuBtn = doc.querySelector(".menu-btn");
  var progressBar = doc.querySelector(".reading-progress span");
  var path = location.pathname.replace(/\/index\.html$/, "/");
  var lastFocused = null;

  function all(selector, root) {
    return Array.prototype.slice.call((root || doc).querySelectorAll(selector));
  }

  function on(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  /* ---------- Menu ---------- */
  function setMenu(open, restoreFocus) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    body.classList.toggle("menu-open", open);
    if (open) {
      setSearch(false);
      var first = menu.querySelector("a, button");
      if (first) first.focus();
    } else if (restoreFocus) {
      menuBtn.focus();
    }
  }

  on(menuBtn, "click", function () {
    setMenu(menu.hidden, false);
  });

  all("#site-menu a").forEach(function (link) {
    on(link, "click", function () { setMenu(false, false); });
  });

  all(".menu-btn, .search-btn, .search-wide").forEach(function (button) {
    if (button.classList.contains("menu-btn")) return;
    on(button, "click", function () {
      setMenu(false, false);
      openSearch();
    });
  });

  /* ---------- Pencarian ---------- */
  var searchIndex = null;
  var searchLoading = null;
  var currentResults = [];
  var activeResult = -1;
  var quickLinks = [
    { page: "mulai.html", pageTitle: "Mulai", title: "Memasang aplikasi", id: "instalasi", text: "Panduan memasang MochiTs dan membuat proyek pertama." },
    { page: "script.html", pageTitle: "Script TL", title: "Format script TL", id: "contoh", text: "Contoh naskah, pemisah halaman, simbol, dan entri terhubung." },
    { page: "tester.html", pageTitle: "Tester", title: "Tester script", id: "parser", text: "Uji naskah TL langsung di browser tanpa memasang aplikasi." },
    { page: "faq.html", pageTitle: "FAQ", title: "Pertanyaan umum", id: "script", text: "Jawaban singkat untuk masalah yang paling sering muncul." }
  ];

  function setSearch(open) {
    if (!overlay) return;
    overlay.hidden = !open;
    body.classList.toggle("search-open", open);
    if (!open) {
      activeResult = -1;
      currentResults = [];
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
      lastFocused = null;
    }
  }

  function openSearch() {
    if (!overlay) return;
    setMenu(false, false);
    lastFocused = doc.activeElement;
    if (lastFocused && lastFocused.closest && lastFocused.closest("#site-menu")) {
      lastFocused = doc.querySelector(".search-btn") || menuBtn;
    }
    overlay.hidden = false;
    body.classList.add("search-open");
    if (searchInput) {
      searchInput.value = "";
      renderSearch("");
      setTimeout(function () { searchInput.focus(); }, 30);
    }
    loadSearchIndex();
  }

  function closeSearch(restore) {
    if (!overlay) return;
    overlay.hidden = true;
    body.classList.remove("search-open");
    activeResult = -1;
    currentResults = [];
    if (restore !== false && lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function loadSearchIndex() {
    if (searchIndex || searchLoading) return searchLoading;
    if (typeof fetch !== "function") return null;
    searchLoading = fetch("search-index.json")
      .then(function (response) {
        if (!response.ok) throw new Error("indeks tidak tersedia");
        return response.json();
      })
      .then(function (data) {
        searchIndex = Array.isArray(data) ? data : [];
        if (searchInput && searchInput.value.trim()) renderSearch(searchInput.value);
      })
      .catch(function () {
        if (searchResults) {
          searchResults.innerHTML = '<div class="search-empty">Indeks pencarian belum termuat. Coba muat ulang halaman ini.</div>';
        }
      });
    return searchLoading;
  }

  function plain(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function scoreEntry(entry, terms) {
    var title = plain(entry.title);
    var pageTitle = plain(entry.pageTitle);
    var text = plain(entry.text);
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (title.indexOf(term) !== -1) score += 8;
      else if (pageTitle.indexOf(term) !== -1) score += 4;
      else if (text.indexOf(term) !== -1) score += 2;
      else return 0;
    }
    if (title.indexOf(terms[0]) === 0) score += 3;
    return score;
  }

  function resultMarkup(entry, i) {
    return '<a class="search-result" href="' + escapeHtml(entry.page) + "#" + escapeHtml(entry.id) + '" data-result="' + i + '">' +
      '<span class="result-page">' + escapeHtml(entry.pageTitle) + '</span>' +
      '<span class="result-title">' + escapeHtml(entry.title) + '</span>' +
      '<span class="result-excerpt">' + escapeHtml(entry.text) + '</span>' +
      '</a>';
  }

  function renderSearch(raw) {
    if (!searchResults) return;
    var query = raw.trim();
    var entries;
    if (!query) {
      entries = quickLinks;
      searchResults.innerHTML = '<div class="search-group-label">Sering dibuka</div>' +
        entries.map(resultMarkup).join("");
      currentResults = entries;
      activeResult = -1;
      if (searchSummary) searchSummary.textContent = "Mulai dari sini";
      return;
    }
    if (!searchIndex) {
      searchResults.innerHTML = '<div class="search-empty">Memuat indeks pencarian...</div>';
      if (searchSummary) searchSummary.textContent = "Mencari";
      return;
    }
    var terms = plain(query).split(/\s+/).filter(Boolean);
    entries = searchIndex
      .map(function (entry) { return { entry: entry, score: scoreEntry(entry, terms) }; })
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 10)
      .map(function (item) { return item.entry; });

    currentResults = entries;
    activeResult = -1;
    if (!entries.length) {
      searchResults.innerHTML = '<div class="search-empty">Tidak ada hasil untuk “' + escapeHtml(query) + '”. Coba kata yang lebih pendek.</div>';
      if (searchSummary) searchSummary.textContent = "0 hasil";
      return;
    }
    searchResults.innerHTML = '<div class="search-group-label">Hasil teratas</div>' +
      entries.map(resultMarkup).join("");
    if (searchSummary) {
      searchSummary.textContent = entries.length + (entries.length === 1 ? " hasil" : " hasil");
    }
  }

  function highlightResult(next) {
    var links = all(".search-result", searchResults);
    if (!links.length) return;
    if (activeResult >= 0 && links[activeResult]) links[activeResult].classList.remove("is-active");
    activeResult = (next + links.length) % links.length;
    links[activeResult].classList.add("is-active");
    links[activeResult].scrollIntoView({ block: "nearest" });
  }

  function goToActive() {
    if (activeResult < 0) {
      if (currentResults.length) location.href = currentResults[0].page + "#" + currentResults[0].id;
      return;
    }
    var entry = currentResults[activeResult];
    if (entry) location.href = entry.page + "#" + entry.id;
  }

  on(searchInput, "input", function () { renderSearch(searchInput.value); });
  on(searchInput, "keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightResult(activeResult + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightResult(activeResult - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      goToActive();
    }
  });
  all("[data-search-close]").forEach(function (button) {
    on(button, "click", function () { closeSearch(); });
  });
  on(overlay, "click", function (event) {
    if (event.target === overlay) closeSearch();
  });
  on(searchResults, "click", function (event) {
    var target = event.target.closest ? event.target.closest(".search-result") : null;
    if (target && target.href) {
      closeSearch(false);
    }
  });

  if (doc.addEventListener) {
    doc.addEventListener("keydown", function (event) {
      var key = event.key;
      if (key === "Escape") {
        if (overlay && !overlay.hidden) {
          event.preventDefault();
          closeSearch();
        } else if (menu && !menu.hidden) {
          event.preventDefault();
          setMenu(false, true);
        }
        return;
      }
      if (overlay && !overlay.hidden) return;
      if (!isTyping(event.target) && (key === "/" || ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "k"))) {
        event.preventDefault();
        openSearch();
      }
    });
  }

  /* ---------- Halaman aktif ---------- */
  var file = path.split("/").pop() || "index.html";
  all(".site-nav a, .side-nav a").forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("#")[0];
    if (href === file) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Progres baca ---------- */
  var progressFrame = false;
  function updateProgress() {
    progressFrame = false;
    if (!progressBar || !body.classList.contains("has-progress")) return;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var value = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
    progressBar.style.width = (value * 100).toFixed(2) + "%";
  }
  function queueProgress() {
    if (progressFrame) return;
    progressFrame = true;
    window.requestAnimationFrame(updateProgress);
  }

  /* ---------- TOC aktif ---------- */
  var tocLinks = all(".toc-nav a, .mobile-toc a");
  var headings = all(".doc-body h2[id], .doc-body h3[id]");
  var tocFrame = false;
  function updateToc() {
    tocFrame = false;
    if (!headings.length) return;
    var top = 120;
    var current = headings[0];
    headings.forEach(function (heading) {
      if (heading.getBoundingClientRect().top <= top) current = heading;
    });
    tocLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + current.id;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function queueToc() {
    if (tocFrame) return;
    tocFrame = true;
    window.requestAnimationFrame(updateToc);
  }

  if (window.addEventListener) {
    window.addEventListener("scroll", function () {
      queueProgress();
      queueToc();
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (menu && !menu.hidden && window.innerWidth > 980) setMenu(false, true);
      queueProgress();
      queueToc();
    });
  }
  updateProgress();
  updateToc();

  all(".mobile-toc a").forEach(function (link) {
    on(link, "click", function () {
      var details = link.closest("details");
      if (details) details.open = false;
    });
  });

  /* ---------- Label tabel untuk layar kecil ---------- */
  all(".doc-body table").forEach(function (table) {
    var labels = all("thead th", table).map(function (th) { return th.textContent.trim(); });
    all("tbody tr", table).forEach(function (row) {
      all("td", row).forEach(function (cell, i) {
        if (labels[i]) cell.setAttribute("data-label", labels[i]);
      });
    });
  });

  /* ---------- Tombol salin ---------- */
  all(".doc-body pre").forEach(function (pre) {
    if (pre.querySelector(".copy-btn")) return;
    var button = doc.createElement("button");
    button.className = "copy-btn";
    button.type = "button";
    button.textContent = "Salin";
    button.setAttribute("aria-label", "Salin isi blok kode");
    on(button, "click", function () {
      var code = pre.querySelector("code") || pre;
      var text = code.innerText;
      var done = function () {
        button.textContent = "Tersalin";
        setTimeout(function () { button.textContent = "Salin"; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    });
    pre.appendChild(button);
  });

  function fallbackCopy(text) {
    var area = doc.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    body.appendChild(area);
    area.select();
    try { doc.execCommand("copy"); } catch (e) { /* diabaikan */ }
    body.removeChild(area);
  }

  /* ---------- Parser dan tester ---------- */
  function normalize(raw) {
    return raw
      .replace(/\uFEFF/g, "")
      .replace(/\u200B/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, "    ");
  }

  function parseMappings(raw) {
    var list = [];
    raw.split("\n").forEach(function (line) {
      var clean = line.trim();
      if (!clean) return;
      var type = "normal";
      var match = clean.match(/^(.*?)\s*=\s*(gabung|terhubung|normal)\s*$/i);
      var symbol = clean;
      if (match) {
        symbol = match[1].trim();
        type = match[2].toLowerCase();
      }
      if (!symbol) return;
      list.push({ symbol: symbol, append: type === "gabung", linked: type === "terhubung" });
    });
    list.sort(function (a, b) { return b.symbol.length - a.symbol.length; });
    var seen = {};
    return list.filter(function (entry) {
      if (seen[entry.symbol]) return false;
      seen[entry.symbol] = true;
      return true;
    });
  }

  function parseScript(rawText, mappings, separator) {
    var warnings = [];
    var sepRegex = null;
    if (separator && separator.trim() !== "") {
      try {
        sepRegex = new RegExp("^(?:" + separator + ")$");
      } catch (error) {
        warnings.push({ type: "err", text: "Regex pemisah halaman tidak valid: " + error.message });
      }
    }

    var lines = normalize(rawText).split("\n");
    var droppedHeader = 0;
    if (sepRegex) {
      var first = -1;
      for (var i = 0; i < lines.length; i++) {
        if (sepRegex.test(lines[i].trim())) { first = i; break; }
      }
      if (first >= 0) {
        droppedHeader = first;
        lines = lines.slice(first);
      }
    }

    var pages = [{ label: "", entries: [] }];
    var current = pages[0].entries;
    var seenSep = false;
    var textColumn = 0;

    function pushPage(label) {
      pages.push({ label: label, entries: [] });
      current = pages[pages.length - 1].entries;
      textColumn = 0;
    }

    function mergeLast(text) {
      if (!current.length) return;
      var last = current[current.length - 1];
      last.text = last.text ? last.text + "\n" + text : text;
    }

    function textStartColumn(rawLine, symbol) {
      var symbolStart = 0;
      while (symbolStart < rawLine.length && rawLine.charAt(symbolStart) === " ") symbolStart++;
      var index = symbolStart + symbol.length;
      while (index < rawLine.length && rawLine.charAt(index) === " ") index++;
      return index;
    }

    function linkedParentFor(symbol, entries) {
      if (symbol.indexOf("//") === 0) {
        var stripped = symbol.slice(2);
        if (stripped) return stripped;
      }
      var previous = entries.length ? entries[entries.length - 1] : null;
      if (!previous) return null;
      return previous.parent || previous.symbol;
    }

    lines.forEach(function (rawLine) {
      var trimmed = rawLine.trim();
      if (!trimmed) return;
      if (sepRegex && sepRegex.test(trimmed)) {
        seenSep = true;
        pushPage(trimmed);
        return;
      }
      var hit = null;
      for (var k = 0; k < mappings.length; k++) {
        if (trimmed.indexOf(mappings[k].symbol) === 0) { hit = mappings[k]; break; }
      }
      if (hit) {
        var text = trimmed.slice(hit.symbol.length).replace(/^\s+/, "");
        if (hit.append && current.length) {
          mergeLast(text);
        } else {
          var parent = hit.linked ? linkedParentFor(hit.symbol, current) : null;
          current.push({ symbol: hit.symbol, text: text, parent: parent });
          textColumn = textStartColumn(rawLine, hit.symbol);
        }
      } else if (current.length) {
        var leading = 0;
        while (leading < rawLine.length && rawLine.charAt(leading) === " ") leading++;
        if (leading >= rawLine.length) leading = rawLine.length;
        var continuation = rawLine.slice(Math.min(leading, textColumn)).replace(/\s+$/, "");
        if (continuation) mergeLast(continuation);
      }
    });

    var nonEmpty = pages.filter(function (page) { return page.entries.length > 0; });
    if (!nonEmpty.length) nonEmpty = [{ label: "", entries: [] }];
    nonEmpty.forEach(function (page) { if (!seenSep) page.label = ""; });

    if (!mappings.length) warnings.push({ type: "err", text: "Belum ada simbol. Tambahkan minimal satu simbol." });
    if (sepRegex && !seenSep) warnings.push({ type: "warn", text: "Tidak ada baris yang cocok dengan pemisah halaman. Semua entri masuk satu halaman." });
    if (droppedHeader > 0) warnings.push({ type: "warn", text: droppedHeader + " baris sebelum pemisah pertama dibuang (kepala file)." });

    var unknownSlashes = 0;
    normalize(rawText).split("\n").forEach(function (line) {
      var trimmed = line.trim();
      if (trimmed.indexOf("//") !== 0) return;
      var known = mappings.some(function (mapping) { return trimmed.indexOf(mapping.symbol) === 0; });
      if (!known) unknownSlashes++;
    });
    if (unknownSlashes > 0) warnings.push({ type: "warn", text: unknownSlashes + " baris berawalan // tidak cocok dengan simbol mana pun." });

    var missingLinked = [];
    ["//-", "//[]"].forEach(function (symbol) {
      var used = normalize(rawText).split("\n").some(function (line) {
        return line.trim().indexOf(symbol) === 0;
      });
      var mapped = mappings.some(function (mapping) { return mapping.symbol === symbol; });
      if (used && !mapped) missingLinked.push(symbol);
    });
    if (missingLinked.length) warnings.push({ type: "warn", text: "Simbol " + missingLinked.join(", ") + " dipakai di naskah tetapi belum ada di daftar simbol." });

    return { pages: nonEmpty, warnings: warnings, droppedHeader: droppedHeader };
  }

  var scriptInput = doc.getElementById("script-input");
  if (scriptInput) {
    var separatorInput = doc.getElementById("script-separator");
    var mappingInput = doc.getElementById("script-mappings");
    var output = doc.getElementById("script-output");
    var stats = doc.getElementById("script-stats");
    var warningBox = doc.getElementById("script-warnings");
    var timer = null;

    var render = function () {
      var mappings = parseMappings(mappingInput.value);
      var parsed = parseScript(scriptInput.value, mappings, separatorInput.value);
      var total = 0;
      var linked = 0;
      var html = "";

      parsed.pages.forEach(function (page, index) {
        total += page.entries.length;
        html += '<div class="result-page">';
        if (page.label) html += '<div class="page-label">' + escapeHtml(page.label) + "</div>";
        else if (parsed.pages.length > 1 || index === 0) html += '<div class="page-label">Halaman ' + (index + 1) + "</div>";
        if (!page.entries.length) html += '<div class="empty-note">Tidak ada entri.</div>';
        page.entries.forEach(function (entry) {
          if (entry.parent) linked++;
          html += '<div class="entry">';
          html += '<span class="sym' + (entry.parent ? " linked" : "") + '">' + escapeHtml(entry.symbol) + "</span>";
          html += '<span class="body">' + escapeHtml(entry.text || "(kosong)");
          if (entry.parent) html += '<span class="parent">terhubung ke ' + escapeHtml(entry.parent) + "</span>";
          html += "</span></div>";
        });
        html += "</div>";
      });

      output.innerHTML = html;
      stats.innerHTML =
        '<span class="stat"><b>' + parsed.pages.length + "</b> halaman</span>" +
        '<span class="stat"><b>' + total + "</b> entri</span>" +
        '<span class="stat"><b>' + linked + "</b> terhubung</span>";

      warningBox.innerHTML = parsed.warnings.map(function (warning) {
        return '<div class="' + (warning.type === "warn" ? "warn" : "") + '">' + escapeHtml(warning.text) + "</div>";
      }).join("");
    };

    var schedule = function () {
      clearTimeout(timer);
      timer = setTimeout(render, 120);
    };
    scriptInput.addEventListener("input", schedule);
    separatorInput.addEventListener("input", schedule);
    mappingInput.addEventListener("input", schedule);
    render();
  }

  var regexInput = doc.getElementById("regex-input");
  if (regexInput) {
    var patternInput = doc.getElementById("regex-pattern");
    var regexOutput = doc.getElementById("regex-output");
    var matchList = doc.getElementById("regex-matches");
    var regexTimer = null;

    var renderRegex = function () {
      var pattern = patternInput.value;
      var flags = "g";
      ["i", "m", "s"].forEach(function (flag) {
        var box = doc.getElementById("flag-" + flag);
        if (box && box.checked) flags += flag;
      });
      var raw = regexInput.value;
      var regex;
      try {
        regex = new RegExp(pattern, flags);
      } catch (error) {
        regexOutput.innerHTML = '<div class="warnings"><div>Regex tidak valid: ' + escapeHtml(error.message) + "</div></div>";
        matchList.textContent = "";
        return;
      }

      var matches = [];
      var out = "";
      var last = 0;
      var guard = 0;
      var match;
      while ((match = regex.exec(raw)) !== null && guard++ < 500) {
        matches.push(match[0]);
        out += escapeHtml(raw.slice(last, match.index));
        out += "<mark>" + escapeHtml(match[0] === "" ? "(kosong)" : match[0]) + "</mark>";
        last = match.index + match[0].length;
        if (match[0] === "") regex.lastIndex++;
      }
      out += escapeHtml(raw.slice(last));
      if (!out) out = '<span class="empty-note">Tidak ada teks uji.</span>';
      regexOutput.innerHTML = out;

      if (matches.length) {
        matchList.innerHTML = matches.map(function (text, index) {
          return (index + 1) + ". " + escapeHtml(text === "" ? "(kosong)" : text);
        }).join("\n");
      } else {
        matchList.textContent = "Tidak ada kecocokan.";
      }
    };

    var scheduleRegex = function () {
      clearTimeout(regexTimer);
      regexTimer = setTimeout(renderRegex, 100);
    };
    patternInput.addEventListener("input", scheduleRegex);
    regexInput.addEventListener("input", scheduleRegex);
    ["i", "m", "s"].forEach(function (flag) {
      var box = doc.getElementById("flag-" + flag);
      if (box) box.addEventListener("change", scheduleRegex);
    });
    renderRegex();
  }

  if (typeof window !== "undefined") {
    window.MochiTester = {
      normalize: normalize,
      parseMappings: parseMappings,
      parseScript: parseScript
    };
  }
})();
