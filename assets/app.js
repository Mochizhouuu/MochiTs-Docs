/* MochiTs Docs — interaksi kecil + tester parser TL (mirror ScriptParser.kt). */
(function () {
  "use strict";

  /* ---------- Menu mobile ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileNav = document.querySelector(".mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Sidebar: tandai halaman aktif ---------- */
  var path = location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll(".sidebar a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var target = href.split("#")[0];
    if (target && target !== "#" && path.endsWith("/" + target)) {
      a.classList.add("active");
    }
  });

  /* ---------- Tombol salin kode ---------- */
  document.querySelectorAll(".docs-main pre, .code-block").forEach(function (pre) {
    if (pre.querySelector(".copy-btn")) return;
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Salin";
    btn.addEventListener("click", function () {
      var code = pre.querySelector("code") || pre;
      var text = code.innerText;
      var done = function () {
        btn.textContent = "Tersalin";
        setTimeout(function () { btn.textContent = "Salin"; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text);
        done();
      }
    });
    pre.appendChild(btn);
  });

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------- Helper ---------- */
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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
      var m = clean.match(/^(.*?)\s*=\s*(gabung|terhubung|normal)\s*$/i);
      var symbol = clean;
      if (m) {
        symbol = m[1].trim();
        type = m[2].toLowerCase();
      }
      if (!symbol) return;
      list.push({ symbol: symbol, append: type === "gabung", linked: type === "terhubung" });
    });
    list.sort(function (a, b) { return b.symbol.length - a.symbol.length; });
    var seen = {};
    return list.filter(function (e) {
      if (seen[e.symbol]) return false;
      seen[e.symbol] = true;
      return true;
    });
  }

  /* ---------- Parser (padanan ScriptParser.kt) ---------- */
  function parseScript(rawText, mappings, separator) {
    var warnings = [];
    var sepRegex = null;
    if (separator && separator.trim() !== "") {
      try {
        sepRegex = new RegExp("^(?:" + separator + ")$");
      } catch (e) {
        warnings.push({ type: "err", text: "Regex pemisah halaman tidak valid: " + e.message });
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
    var currentLabel = "";
    var seenSep = false;
    var textColumn = 0;

    function pushPage(label) {
      pages.push({ label: label, entries: [] });
      current = pages[pages.length - 1].entries;
      currentLabel = label;
      textColumn = 0;
    }

    function mergeLast(text) {
      if (!current.length) return;
      var last = current[current.length - 1];
      last.text = last.text ? last.text + "\n" + text : text;
    }

    function textStartColumn(rawLine, sym) {
      var symStart = 0;
      while (symStart < rawLine.length && rawLine.charAt(symStart) === " ") symStart++;
      var i = symStart + sym.length;
      while (i < rawLine.length && rawLine.charAt(i) === " ") i++;
      return i;
    }

    function linkedParentFor(sym, entries) {
      if (sym.indexOf("//") === 0) {
        var stripped = sym.slice(2);
        if (stripped) return stripped;
      }
      var prev = entries.length ? entries[entries.length - 1] : null;
      if (!prev) return null;
      return prev.parent || prev.symbol;
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

    var nonEmpty = pages.filter(function (p) { return p.entries.length > 0; });
    if (!nonEmpty.length) nonEmpty = [{ label: "", entries: [] }];
    nonEmpty.forEach(function (p) { if (!seenSep) p.label = ""; });

    if (!mappings.length) warnings.push({ type: "err", text: "Belum ada simbol. Tambahkan minimal satu simbol." });
    if (sepRegex && !seenSep) warnings.push({ type: "warn", text: "Tidak ada baris yang cocok dengan pemisah halaman. Semua entri masuk satu halaman." });
    if (droppedHeader > 0) warnings.push({ type: "warn", text: droppedHeader + " baris sebelum pemisah pertama dibuang (kepala file)." });

    var unknownSlashes = 0;
    normalize(rawText).split("\n").forEach(function (line) {
      var t = line.trim();
      if (t.indexOf("//") !== 0) return;
      var known = mappings.some(function (m) { return t.indexOf(m.symbol) === 0; });
      if (!known) unknownSlashes++;
    });
    if (unknownSlashes > 0) warnings.push({ type: "warn", text: unknownSlashes + " baris berawalan // tidak cocok dengan simbol mana pun." });

    var missingLinked = [];
    ["//-", "//[]"].forEach(function (sym) {
      var used = normalize(rawText).split("\n").some(function (line) {
        return line.trim().indexOf(sym) === 0;
      });
      var mapped = mappings.some(function (m) { return m.symbol === sym; });
      if (used && !mapped) missingLinked.push(sym);
    });
    if (missingLinked.length) warnings.push({ type: "warn", text: "Simbol " + missingLinked.join(", ") + " dipakai di naskah tetapi belum ada di daftar simbol." });

    return { pages: nonEmpty, warnings: warnings, droppedHeader: droppedHeader };
  }

  /* ---------- Render tester ---------- */
  var scriptInput = document.getElementById("script-input");
  if (scriptInput) {
    var separatorInput = document.getElementById("script-separator");
    var mappingInput = document.getElementById("script-mappings");
    var output = document.getElementById("script-output");
    var stats = document.getElementById("script-stats");
    var warningBox = document.getElementById("script-warnings");
    var timer = null;

    var render = function () {
      var mappings = parseMappings(mappingInput.value);
      var doc = parseScript(scriptInput.value, mappings, separatorInput.value);

      var total = 0;
      var linked = 0;
      var html = "";
      doc.pages.forEach(function (page, index) {
        total += page.entries.length;
        html += '<div class="result-page">';
        if (page.label) html += '<div class="page-label">' + esc(page.label) + "</div>";
        else if (doc.pages.length > 1 || index === 0) html += '<div class="page-label">Halaman ' + (index + 1) + "</div>";
        if (!page.entries.length) {
          html += '<div class="empty-note">Tidak ada entri.</div>';
        }
        page.entries.forEach(function (entry) {
          if (entry.parent) linked++;
          html += '<div class="entry">';
          html += '<span class="sym' + (entry.parent ? " linked" : "") + '">' + esc(entry.symbol) + "</span>";
          html += '<span class="body">' + esc(entry.text || "(kosong)");
          if (entry.parent) html += '<span class="parent">terhubung ke ' + esc(entry.parent) + "</span>";
          html += "</span></div>";
        });
        html += "</div>";
      });

      output.innerHTML = html;
      stats.innerHTML =
        '<span class="stat"><b>' + doc.pages.length + "</b> halaman</span>" +
        '<span class="stat"><b>' + total + "</b> entri</span>" +
        '<span class="stat"><b>' + linked + "</b> terhubung</span>";

      if (doc.warnings.length) {
        warningBox.innerHTML = doc.warnings.map(function (w) {
          return '<div class="' + (w.type === "warn" ? "warn" : "") + '">' + esc(w.text) + "</div>";
        }).join("");
      } else {
        warningBox.innerHTML = "";
      }
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

  /* ---------- Regex lab ---------- */
  var regexInput = document.getElementById("regex-input");
  if (regexInput) {
    var patternInput = document.getElementById("regex-pattern");
    var regexOutput = document.getElementById("regex-output");
    var matchList = document.getElementById("regex-matches");
    var regexTimer = null;

    var renderRegex = function () {
      var pattern = patternInput.value;
      var flags = "g";
      ["i", "m", "s"].forEach(function (f) {
        var box = document.getElementById("flag-" + f);
        if (box && box.checked) flags += f;
      });
      var raw = regexInput.value;
      var re;
      try {
        re = new RegExp(pattern, flags);
      } catch (e) {
        regexOutput.innerHTML = '<div class="warnings"><div>Regex tidak valid: ' + esc(e.message) + "</div></div>";
        matchList.textContent = "";
        return;
      }

      var matches = [];
      var out = "";
      var last = 0;
      var guard = 0;
      var m;
      while ((m = re.exec(raw)) !== null && guard++ < 500) {
        matches.push(m[0]);
        out += esc(raw.slice(last, m.index));
        out += "<mark>" + esc(m[0] === "" ? "(kosong)" : m[0]) + "</mark>";
        last = m.index + m[0].length;
        if (m[0] === "") re.lastIndex++;
      }
      out += esc(raw.slice(last));
      if (!out) out = '<span class="empty-note">Tidak ada teks uji.</span>';
      regexOutput.innerHTML = out;

      if (matches.length) {
        matchList.innerHTML = matches.map(function (text, i) {
          return (i + 1) + ". " + esc(text === "" ? "(kosong)" : text);
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
    ["i", "m", "s"].forEach(function (f) {
      var box = document.getElementById("flag-" + f);
      if (box) box.addEventListener("change", scheduleRegex);
    });
    renderRegex();
  }

  /* Expose untuk pengujian parser (dipakai harness Node, bukan UI). */
  if (typeof window !== "undefined") {
    window.MochiTester = {
      normalize: normalize,
      parseMappings: parseMappings,
      parseScript: parseScript
    };
  }
})();
