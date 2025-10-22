/* =========================
   Dynamic Quote Generator
   with Web Storage + JSON
   ========================= */

// ---- Seed data ----
const DEFAULT_QUOTES = [
  { text: "Stay hungry, stay foolish.", category: "inspiration" },
  { text: "Programs must be written for people to read.", category: "technology" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", category: "wisdom" },
  { text: "Simplicity is the soul of efficiency.", category: "technology" },
  { text: "The best way out is always through.", category: "motivation" },
];

// ---- Storage keys ----
const LS_KEY = "alx.dom.quotes.v1";           // localStorage: persistent quotes
const SS_LAST = "alx.dom.session.lastQuote";   // sessionStorage: last viewed quote

// ---- Local Storage helpers ----
function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [...DEFAULT_QUOTES];
    const parsed = JSON.parse(raw);
    // merge defaults without duplicates
    const merged = [...DEFAULT_QUOTES];
    parsed.forEach(q => {
      if (!merged.some(m => m.text === q.text && m.category === q.category)) merged.push(q);
    });
    return merged;
  } catch {
    return [...DEFAULT_QUOTES];
  }
}
function saveQuotes(quotes) {
  // persist only user-added (exclude defaults)
  const extras = quotes.filter(
    q => !DEFAULT_QUOTES.some(d => d.text === q.text && d.category === q.category)
  );
  localStorage.setItem(LS_KEY, JSON.stringify(extras));
}

// ---- State & DOM refs ----
let quotes = loadQuotes();
let current = null;

const quoteTextEl = document.getElementById("quoteText");
const quoteCatEl  = document.getElementById("quoteCategory");
const newBtn      = document.getElementById("newQuote");
const filterEl    = document.getElementById("categoryFilter");
const recentList  = document.getElementById("recentList");
const addMount    = document.getElementById("addQuoteFormMount");

const exportBtn   = document.getElementById("exportJson");
const importBtn   = document.getElementById("importBtn");
const importInput = document.getElementById("importFile");

// ---- Utilities ----
const unique = arr => Array.from(new Set(arr));
const uniqueCategories = list => unique(list.map(q => q.category)).sort();
const pickRandom = list => list[Math.floor(Math.random() * list.length)];

function sanitizeQuote(obj) {
  // ensure {text, category} strings
  if (!obj || typeof obj !== "object") return null;
  const text = String(obj.text ?? "").trim();
  const category = String(obj.category ?? "").trim().toLowerCase();
  if (!text || !category) return null;
  return { text, category };
}

// ---- Rendering ----
function renderCategories() {
  const selected = filterEl.value || "__all__";
  filterEl.innerHTML = `<option value="__all__">All</option>`;
  uniqueCategories(quotes).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat[0].toUpperCase() + cat.slice(1);
    if (cat === selected) opt.selected = true;
    filterEl.appendChild(opt);
  });
}

function renderQuote(q) {
  quoteTextEl.textContent = `“${q.text}”`;
  quoteCatEl.textContent  = `#${q.category}`;

  // small animation
  [quoteTextEl, quoteCatEl].forEach(el => {
    el.classList.remove("fade-in");
    void el.offsetWidth;
    el.classList.add("fade-in");
  });

  // save last viewed quote for THIS session only
  try { sessionStorage.setItem(SS_LAST, JSON.stringify(q)); } catch {}
}

// ---- Core functions ----
function showRandomQuote() {
  const cat = filterEl.value;
  const pool = (cat && cat !== "__all__") ? quotes.filter(q => q.category === cat) : quotes;
  if (pool.length === 0) {
    renderQuote({ text: "No quotes in this category yet. Add one below!", category: "info" });
    return;
  }
  current = pickRandom(pool);
  renderQuote(current);
}

function createAddQuoteForm(mountEl) {
  const wrap = document.createElement("div");
  wrap.className = "card";

  const row1 = document.createElement("div");
  row1.className = "form-row";

  const inputText = document.createElement("input");
  inputText.type = "text";
  inputText.id = "newQuoteText";
  inputText.placeholder = "Enter a new quote";

  const inputCat = document.createElement("input");
  inputCat.type = "text";
  inputCat.id = "newQuoteCategory";
  inputCat.placeholder = "Enter quote category (e.g., motivation)";

  row1.append(inputText, inputCat);

  const row2 = document.createElement("div");
  row2.className = "form-row";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "Add Quote";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.textContent = "Clear";
  clearBtn.style.background = "#374151";

  row2.append(addBtn, clearBtn);

  const helper = document.createElement("p");
  helper.className = "helper";
  helper.textContent = "Tip: short categories help filtering (e.g., ‘tech’, ‘wisdom’).";

  wrap.append(row1, row2, helper);
  mountEl.replaceChildren(wrap);

  addBtn.addEventListener("click", () => {
    addQuote(inputText.value, inputCat.value);
    inputText.value = "";
    inputCat.value = "";
    inputText.focus();
  });
  clearBtn.addEventListener("click", () => {
    inputText.value = "";
    inputCat.value = "";
    inputText.focus();
  });
}

function addQuote(text, category) {
  const q = sanitizeQuote({ text, category });
  if (!q) return;

  // de-dupe
  if (!quotes.some(m => m.text === q.text && m.category === q.category)) {
    quotes.push(q);
    saveQuotes(quotes);                // <- LOCAL STORAGE (persist)
    renderCategories();
    appendRecent(q);
    showRandomQuote();
  }
}

// Recent list utility (DOM insert/remove demo)
function appendRecent(q) {
  const li = document.createElement("li");
  li.textContent = `“${q.text}” — ${q.category}`;
  li.className = "fade-in";
  li.title = "Click to remove from this list (does not delete the quote)";
  li.addEventListener("click", () => li.remove());
  recentList.prepend(li);
}

// ---- JSON Export / Import ----
function exportQuotesToJson() {
  try {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Export failed.");
    console.error(e);
  }
}

async function importFromJsonFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      alert("Invalid JSON: expected an array of {text, category}.");
      return;
    }

    // sanitize + merge + de-dupe
    const cleaned = parsed
      .map(sanitizeQuote)
      .filter(Boolean);

    let added = 0;
    cleaned.forEach(q => {
      if (!quotes.some(m => m.text === q.text && m.category === q.category)) {
        quotes.push(q);
        added++;
      }
    });

    if (added > 0) {
      saveQuotes(quotes);              // persist to LOCAL STORAGE
      renderCategories();
      showRandomQuote();
    }
    alert(`Import complete. ${added} new quote(s) added.`);
  } catch (e) {
    alert("Failed to import JSON.");
    console.error(e);
  } finally {
    // allow re-selecting the same file later
    importInput.value = "";
  }
}

// ---- Boot ----
function init() {
  // categories first
  renderCategories();

  // If session has a last quote, show it; else random
  try {
    const last = JSON.parse(sessionStorage.getItem(SS_LAST) || "null");
    if (last && last.text && last.category) {
      current = last;
      renderQuote(current);
    } else {
      showRandomQuote();
    }
  } catch {
    showRandomQuote();
  }

  createAddQuoteForm(addMount);

  // wire controls
  newBtn.addEventListener("click", showRandomQuote);
  filterEl.addEventListener("change", showRandomQuote);

  exportBtn.addEventListener("click", exportQuotesToJson);
  importBtn.addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", (e) => importFromJsonFile(e.target.files[0]));
}

document.addEventListener("DOMContentLoaded", init);
