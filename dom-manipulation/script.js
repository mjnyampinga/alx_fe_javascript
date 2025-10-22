/* =========================
   Dynamic Quote Generator
   ========================= */

// Seed data (can be replaced/extended by user)
const DEFAULT_QUOTES = [
  { text: "Stay hungry, stay foolish.", category: "inspiration" },
  { text: "Programs must be written for people to read.", category: "technology" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", category: "wisdom" },
  { text: "Simplicity is the soul of efficiency.", category: "technology" },
  { text: "The best way out is always through.", category: "motivation" },
];

// --- Storage helpers (persist user-added quotes) ---
const LS_KEY = "alx.dom.quotes.v1";

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [...DEFAULT_QUOTES];
    const parsed = JSON.parse(raw);
    // Merge defaults (without duplicates)
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
  // Only persist user additions (exclude defaults)
  const extras = quotes.filter(
    q => !DEFAULT_QUOTES.some(d => d.text === q.text && d.category === q.category)
  );
  localStorage.setItem(LS_KEY, JSON.stringify(extras));
}

// --- State ---
let quotes = loadQuotes();
let current = null;

// --- DOM refs ---
const quoteTextEl = document.getElementById("quoteText");
const quoteCatEl  = document.getElementById("quoteCategory");
const newBtn      = document.getElementById("newQuote");
const filterEl    = document.getElementById("categoryFilter");
const recentList  = document.getElementById("recentList");
const addMount    = document.getElementById("addQuoteFormMount");

// ============ Utilities ============
function uniqueCategories(list) {
  return Array.from(new Set(list.map(q => q.category))).sort();
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ============ Rendering ============
function renderCategories() {
  const selected = filterEl.value || "__all__";
  // Reset options
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
  quoteCatEl.textContent = `#${q.category}`;
  // tiny animation cue
  [quoteTextEl, quoteCatEl].forEach(el => {
    el.classList.remove("fade-in");
    void el.offsetWidth; // reflow to restart animation
    el.classList.add("fade-in");
  });
}

// ============ Core required functions ============

/**
 * showRandomQuote()
 * Displays a random quote, honoring the category filter.
 */
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

/**
 * createAddQuoteForm()
 * Builds the “Add Quote” form dynamically and wires events.
 */
function createAddQuoteForm(mountEl) {
  // Wrapper
  const wrap = document.createElement("div");
  wrap.className = "card";

  // Row 1: inputs
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

  // Row 2: actions
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

  // Helper text
  const helper = document.createElement("p");
  helper.className = "helper";
  helper.textContent = "Tip: categories fuel the filter above. Keep them short (e.g., ‘tech’, ‘wisdom’).";

  // Assemble
  wrap.append(row1, row2, helper);
  mountEl.replaceChildren(wrap);

  // Handlers
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

/**
 * addQuote(text, category)
 * Updates the quotes array + DOM list + storage.
 */
function addQuote(text, category) {
  const t = (text || "").trim();
  const c = (category || "").trim().toLowerCase();
  if (!t || !c) return;

  const newQ = { text: t, category: c };
  quotes.push(newQ);
  saveQuotes(quotes);
  renderCategories();
  appendRecent(newQ);
  showRandomQuote(); // immediate feedback
}

// “Recently added” list item
function appendRecent(q) {
  const li = document.createElement("li");
  li.textContent = `“${q.text}”  — ${q.category}`;
  li.className = "fade-in";
  // Allow remove-on-click to demonstrate DOM removal
  li.title = "Click to remove from recent list (does not delete the quote)";
  li.addEventListener("click", () => li.remove());
  recentList.prepend(li);
}

// ============ Boot ============
function init() {
  // initial UI
  renderCategories();
  showRandomQuote();
  createAddQuoteForm(addMount);

  // wire controls
  newBtn.addEventListener("click", showRandomQuote);
  filterEl.addEventListener("change", showRandomQuote);

  // keyboard shortcut: Enter while focused on filter shows a new quote
  filterEl.addEventListener("keyup", (e) => {
    if (e.key === "Enter") showRandomQuote();
  });
}

document.addEventListener("DOMContentLoaded", init);
