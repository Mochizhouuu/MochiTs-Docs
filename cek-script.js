/* Pemeriksa naskah Script TL — murni sisi klien.
   Aturan default: baris P<angka> = halaman; simbol di awal baris = entri;
   baris dengan indentasi 3+ spasi = lanjutan entri sebelumnya. */
(function (global) {
  "use strict";

  var LIMIT_CHARS = 20000;
  var LIMIT_LINES = 2000;
  var PAGE_RE = /^P\d+\s*$/i;
  var SYMBOLS = ["//-", "//[]", "[]", "**", "-", "#", "*", "<>"];
  var CONT_RE = /^\s{3,}\S/;

  function normalize(raw) {
    return String(raw || "")
      .replace(/\uFEFF/g, "")
      .replace(/\u200B/g, "")
      .replace(/\u00A0/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, "    ");
  }

  function validate(raw) {
    if (typeof raw !== "string" || raw.trim() === "") {
      return { ok: false, error: "Masukkan naskah terlebih dahulu." };
    }
    if (raw.length > LIMIT_CHARS) {
      return { ok: false, error: "Naskah terlalu panjang (maksimal " + LIMIT_CHARS + " karakter)." };
    }
    var lines = normalize(raw).split("\n");
    if (lines.length > LIMIT_LINES) {
      return { ok: false, error: "Terlalu banyak baris (maksimal " + LIMIT_LINES + ")." };
    }

    var pages = [];
    var warnings = [];
    var current = null;
    var last = null;

    lines.forEach(function (line, index) {
      var no = index + 1;
      var trimmed = line.trim();
      if (!trimmed) return;

      if (PAGE_RE.test(trimmed)) {
        current = { label: trimmed, entries: [] };
        pages.push(current);
        last = null;
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
          text: trimmed.slice(symbol.length).replace(/^\s+/, ""),
          line: no,
          linked: symbol.indexOf("//") === 0
        };
        current.entries.push(last);
        return;
      }

      if (CONT_RE.test(line) && last) {
        last.text += "\n" + trimmed;
        return;
      }

      warnings.push({
        line: no,
        text: 'Baris ' + no + ' tidak dikenali: "' + trimmed.slice(0, 40) + '".'
      });
    });

    if (!pages.length) pages.push({ label: "Halaman 1", entries: [] });

    var total = 0;
    var linked = 0;
    pages.forEach(function (page) {
      page.entries.forEach(function (entry) {
        total++;
        if (entry.linked) linked++;
      });
    });
    if (total === 0) warnings.unshift({ line: 0, text: "Tidak ada entri yang dikenali." });

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
      if (summary) summary.textContent = "";
      if (warningBox) warningBox.textContent = "";
      return;
    }
    if (summary) {
      summary.textContent = result.totalPages + " halaman · " + result.totalEntries +
        " entri · " + result.linked + " terhubung";
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
      if (!page.entries.length) {
        section.appendChild(el("p", "cek-muted", "Tidak ada entri."));
      }
      page.entries.forEach(function (entry) {
        var row = el("div", "cek-entry");
        row.appendChild(el("code", "cek-symbol", entry.symbol));
        row.appendChild(el("span", "cek-text", entry.text || "(kosong)"));
        section.appendChild(row);
      });
      mount.appendChild(section);
    });
  }

  function init() {
    var input = document.getElementById("cek-input");
    if (!input) return;
    var mount = document.getElementById("cek-output");
    var summary = document.getElementById("cek-summary");
    var warnings = document.getElementById("cek-warnings");
    var timer = null;
    var run = function () {
      render(validate(input.value), mount, summary, warnings);
    };
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });
    run();
  }

  var api = { validate: validate, render: render, init: init };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.MochiCekScript = api;
})(typeof window !== "undefined" ? window : globalThis);
