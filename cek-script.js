/* Pemeriksa naskah Script TL — mengikuti ScriptParser.kt di aplikasi.
   Murni sisi klien; tidak ada jaringan. */
(function (global) {
  "use strict";

  var LIMIT_CHARS = 20000;
  var LIMIT_LINES = 2000;
  var PAGE_RE = /^P\d+$/i;
  var SYMBOLS = ["//[]", "//-", "[]", "**", "<>", "-", "#", "*"];

  function normalize(raw) {
    return String(raw || "")
      .replace(/\uFEFF/g, "")
      .replace(/\u200B/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, "    ");
  }

  function textStartColumn(rawLine, symbol) {
    var symStart = 0;
    while (symStart < rawLine.length && rawLine.charAt(symStart) === " ") symStart++;
    var i = symStart + symbol.length;
    while (i < rawLine.length && rawLine.charAt(i) === " ") i++;
    return i;
  }

  function validate(raw) {
    if (typeof raw !== "string" || raw.trim() === "") {
      return { ok: false, error: "Naskah kosong. Tempel naskah terlebih dahulu." };
    }
    if (raw.length > LIMIT_CHARS) {
      return {
        ok: false,
        error: "Naskah terlalu panjang: " + raw.length + " karakter. Batas " + LIMIT_CHARS + " karakter."
      };
    }
    var lines = normalize(raw).split("\n");
    if (lines.length > LIMIT_LINES) {
      return {
        ok: false,
        error: "Terlalu banyak baris: " + lines.length + ". Batas " + LIMIT_LINES + " baris."
      };
    }

    var firstSep = -1;
    for (var s = 0; s < lines.length; s++) {
      if (PAGE_RE.test(lines[s].trim())) { firstSep = s; break; }
    }
    var work = firstSep >= 0 ? lines.slice(firstSep) : lines;
    var pages = [];
    var current = null;
    var last = null;
    var textColumn = 0;
    var warnings = [];

    work.forEach(function (line, index) {
      var no = (firstSep >= 0 ? firstSep : 0) + index + 1;
      var trimmed = line.trim();
      if (!trimmed) return;

      if (PAGE_RE.test(trimmed)) {
        current = { label: trimmed, entries: [] };
        pages.push(current);
        last = null;
        textColumn = 0;
        return;
      }

      var symbol = null;
      for (var i = 0; i < SYMBOLS.length; i++) {
        if (trimmed.indexOf(SYMBOLS[i]) === 0) { symbol = SYMBOLS[i]; break; }
      }

      if (symbol) {
        if (!current) {
          current = { label: "Halaman 1", entries: [] };
          pages.push(current);
        }
        last = {
          symbol: symbol,
          text: trimmed.slice(symbol.length).trimStart(),
          line: no,
          linked: symbol.indexOf("//") === 0
        };
        current.entries.push(last);
        textColumn = textStartColumn(line, symbol);
        return;
      }

      if (trimmed.indexOf("//") === 0) {
        warnings.push({
          line: no,
          text: "Baris " + no + ': awalan "//" tidak cocok dengan simbol; dibaca sebagai lanjutan entri.'
        });
      }

      if (last) {
        var leading = 0;
        while (leading < line.length && line.charAt(leading) === " ") leading++;
        var continuation = line.substring(Math.min(leading, textColumn)).trimEnd();
        if (continuation) last.text += "\n" + continuation;
        return;
      }

      warnings.push({
        line: no,
        text: "Baris " + no + " diabaikan karena belum ada entri."
      });
    });

    pages = pages.filter(function (page) { return page.entries.length > 0; });
    if (!pages.length) pages.push({ label: "Halaman 1", entries: [] });

    var total = 0;
    var linked = 0;
    pages.forEach(function (page) {
      page.entries.forEach(function (entry) {
        total++;
        if (entry.linked) linked++;
      });
    });
    if (total === 0) {
      warnings.unshift({ line: 0, text: "Tidak ada entri bersimbol yang terbaca." });
    }

    return {
      ok: true,
      pages: pages,
      totalPages: pages.length,
      totalEntries: total,
      linked: linked,
      warnings: warnings
    };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render(result, mount, summary, warningBox) {
    if (!mount) return;
    mount.textContent = "";
    if (!result.ok) {
      mount.appendChild(el("p", "cek-error", result.error));
      if (summary) summary.textContent = "Pemeriksaan gagal.";
      if (warningBox) warningBox.textContent = "";
      return;
    }
    if (summary) {
      summary.textContent = result.totalPages + " halaman · " + result.totalEntries +
        " entri · " + result.linked + " terhubung · " + result.warnings.length + " peringatan";
    }
    if (warningBox) {
      warningBox.textContent = "";
      result.warnings.forEach(function (w) {
        warningBox.appendChild(el("p", "cek-warning", w.text));
      });
    }
    result.pages.forEach(function (page) {
      var section = el("section", "cek-page");
      section.appendChild(el("h3", "", page.label));
      if (!page.entries.length) section.appendChild(el("p", "cek-muted", "Tidak ada entri."));
      page.entries.forEach(function (entry) {
        var row = el("div", "cek-entry");
        row.appendChild(el("code", "cek-symbol", entry.symbol));
        var text = el("span", "cek-text", entry.text || "(kosong)");
        if (entry.linked) text.appendChild(el("small", "cek-linked", "terhubung"));
        row.appendChild(text);
        section.appendChild(row);
      });
      mount.appendChild(section);
    });
  }

  function init() {
    var input = docGet("cek-input");
    if (!input) return;
    var mount = docGet("cek-output");
    var summary = docGet("cek-summary");
    var warnings = docGet("cek-warnings");
    var timer = null;
    var run = function () { render(validate(input.value), mount, summary, warnings); };

    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });

    var exampleBtn = docGet("muat-contoh");
    var example = docGet("contoh-naskah");
    if (exampleBtn && example && input) {
      exampleBtn.addEventListener("click", function () {
        input.value = example.textContent;
        run();
        input.focus();
      });
    }
    run();
  }

  function docGet(id) { return document.getElementById(id); }

  var api = { validate: validate, render: render, init: init };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.MochiCekScript = api;
})(typeof window !== "undefined" ? window : globalThis);
