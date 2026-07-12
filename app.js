const CATEGORIES = [
  "ストーリー",
  "キャラクター",
  "世界観",
  "演出",
  "作画",
  "音楽",
  "感情",
  "テーマ",
  "テンポ",
  "独創性"
];

const COLORS = [
  "#4c66e5",
  "#ea5b7b",
  "#10a57b",
  "#f29c38",
  "#8a63d2",
  "#2d9bd3"
];

const STORAGE_KEY = "anime-score-lab-v1";
let works = loadWorks();
let selectedIds = new Set();

const animeForm = document.getElementById("animeForm");
const scoreInputs = document.getElementById("scoreInputs");
const animeList = document.getElementById("animeList");
const libraryEmpty = document.getElementById("libraryEmpty");
const chartEmpty = document.getElementById("chartEmpty");
const chartWrap = document.getElementById("chartWrap");
const radarChart = document.getElementById("radarChart");
const legend = document.getElementById("legend");
const editingId = document.getElementById("editingId");
const titleInput = document.getElementById("title");
const genreInput = document.getElementById("genre");
const memoInput = document.getElementById("memo");
const searchInput = document.getElementById("searchInput");

function loadWorks() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveWorks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
}

function createScoreInputs() {
  scoreInputs.innerHTML = "";
  CATEGORIES.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <div class="score-name">${category}</div>
      <input
        id="range-${index}"
        type="range"
        min="0"
        max="100"
        value="70"
        aria-label="${category}の点数"
      />
      <input
        id="number-${index}"
        class="score-number"
        type="number"
        min="0"
        max="100"
        value="70"
        aria-label="${category}の点数"
      />
    `;

    const range = row.querySelector(`#range-${index}`);
    const number = row.querySelector(`#number-${index}`);

    range.addEventListener("input", () => number.value = range.value);
    number.addEventListener("input", () => {
      let value = Math.max(0, Math.min(100, Number(number.value || 0)));
      number.value = value;
      range.value = value;
    });

    scoreInputs.appendChild(row);
  });
}

function getScores() {
  return CATEGORIES.map((_, index) =>
    Math.max(0, Math.min(100, Number(document.getElementById(`number-${index}`).value || 0)))
  );
}

function setScores(scores) {
  CATEGORIES.forEach((_, index) => {
    const value = Number(scores[index] ?? 70);
    document.getElementById(`range-${index}`).value = value;
    document.getElementById(`number-${index}`).value = value;
  });
}

function resetForm() {
  animeForm.reset();
  editingId.value = "";
  titleInput.value = "";
  genreInput.value = "";
  memoInput.value = "";
  setScores(CATEGORIES.map(() => 70));
  document.getElementById("saveBtn").textContent = "作品を保存";
}

animeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const work = {
    id: editingId.value || crypto.randomUUID(),
    title: titleInput.value.trim(),
    genre: genreInput.value.trim(),
    memo: memoInput.value.trim(),
    scores: getScores(),
    updatedAt: new Date().toISOString()
  };

  if (!work.title) return;

  const existingIndex = works.findIndex(item => item.id === work.id);
  if (existingIndex >= 0) {
    works[existingIndex] = work;
  } else {
    works.unshift(work);
  }

  saveWorks();
  resetForm();
  renderAll();
});

document.getElementById("resetBtn").addEventListener("click", resetForm);
document.getElementById("clearCompareBtn").addEventListener("click", () => {
  selectedIds.clear();
  renderAll();
});

searchInput.addEventListener("input", renderLibrary);

function average(scores) {
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function strongestCategories(work) {
  const max = Math.max(...work.scores);
  return CATEGORIES
    .filter((_, index) => work.scores[index] === max)
    .slice(0, 2)
    .join("・");
}

function renderLibrary() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = works.filter(work =>
    `${work.title} ${work.genre}`.toLowerCase().includes(query)
  );

  animeList.innerHTML = "";
  libraryEmpty.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach(work => {
    const template = document.getElementById("animeCardTemplate");
    const card = template.content.firstElementChild.cloneNode(true);

    card.querySelector(".anime-title").textContent = work.title;
    card.querySelector(".anime-genre").textContent = work.genre || "ジャンル未設定";
    card.querySelector(".anime-strength").textContent =
      `強み：${strongestCategories(work)}（最高 ${Math.max(...work.scores)}点）`;
    card.querySelector(".anime-average").textContent = average(work.scores);

    const checkbox = card.querySelector(".compare-checkbox");
    checkbox.checked = selectedIds.has(work.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (selectedIds.size >= 6) {
          checkbox.checked = false;
          alert("比較できる作品は最大6作品です。");
          return;
        }
        selectedIds.add(work.id);
      } else {
        selectedIds.delete(work.id);
      }
      renderChart();
      updateSummary();
    });

    const details = card.querySelector(".score-details");
    details.innerHTML = CATEGORIES.map((category, index) =>
      `<div class="detail-line"><span>${category}</span><strong>${work.scores[index]}</strong></div>`
    ).join("") + (work.memo ? `<div class="detail-line" style="grid-column:1/-1"><span>メモ</span><strong>${escapeHtml(work.memo)}</strong></div>` : "");

    card.querySelector(".detail-btn").addEventListener("click", (event) => {
      details.classList.toggle("hidden");
      event.currentTarget.textContent = details.classList.contains("hidden") ? "詳細" : "閉じる";
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      editingId.value = work.id;
      titleInput.value = work.title;
      genreInput.value = work.genre;
      memoInput.value = work.memo;
      setScores(work.scores);
      document.getElementById("saveBtn").textContent = "変更を保存";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      if (!confirm(`「${work.title}」を削除しますか？`)) return;
      works = works.filter(item => item.id !== work.id);
      selectedIds.delete(work.id);
      saveWorks();
      renderAll();
    });

    animeList.appendChild(card);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderChart() {
  const selectedWorks = works.filter(work => selectedIds.has(work.id));
  chartEmpty.classList.toggle("hidden", selectedWorks.length > 0);
  chartWrap.classList.toggle("hidden", selectedWorks.length === 0);

  if (!selectedWorks.length) {
    radarChart.innerHTML = "";
    legend.innerHTML = "";
    return;
  }

  const cx = 380;
  const cy = 300;
  const radius = 205;
  const labelRadius = 252;
  const levels = 5;
  const angleStep = (Math.PI * 2) / CATEGORIES.length;
  const startAngle = -Math.PI / 2;

  const point = (index, valueRadius) => {
    const angle = startAngle + index * angleStep;
    return [
      cx + Math.cos(angle) * valueRadius,
      cy + Math.sin(angle) * valueRadius
    ];
  };

  const ns = "http://www.w3.org/2000/svg";
  radarChart.innerHTML = "";

  const append = (tag, attrs, text) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
    if (text != null) el.textContent = text;
    radarChart.appendChild(el);
    return el;
  };

  append("rect", { x: 0, y: 0, width: 760, height: 620, fill: "transparent" });

  for (let level = 1; level <= levels; level++) {
    const r = radius * (level / levels);
    const points = CATEGORIES.map((_, index) => point(index, r).join(",")).join(" ");
    append("polygon", {
      points,
      fill: "none",
      stroke: "#d9dee8",
      "stroke-width": level === levels ? 1.6 : 1
    });
  }

  CATEGORIES.forEach((category, index) => {
    const [x, y] = point(index, radius);
    append("line", {
      x1: cx, y1: cy, x2: x, y2: y,
      stroke: "#e0e4ec", "stroke-width": 1
    });

    const [lx, ly] = point(index, labelRadius);
    const anchor = lx < cx - 12 ? "end" : lx > cx + 12 ? "start" : "middle";
    append("text", {
      x: lx,
      y: ly,
      "text-anchor": anchor,
      "dominant-baseline": "middle",
      fill: "#4f5967",
      "font-size": 15,
      "font-weight": 700
    }, category);
  });

  [20, 40, 60, 80, 100].forEach(value => {
    append("text", {
      x: cx + 7,
      y: cy - radius * (value / 100) + 5,
      fill: "#9aa3af",
      "font-size": 11
    }, String(value));
  });

  selectedWorks.forEach((work, workIndex) => {
    const color = COLORS[workIndex % COLORS.length];
    const points = work.scores.map((score, index) =>
      point(index, radius * (score / 100)).join(",")
    ).join(" ");

    append("polygon", {
      points,
      fill: color,
      "fill-opacity": 0.12,
      stroke: color,
      "stroke-width": 3,
      "stroke-linejoin": "round"
    });

    work.scores.forEach((score, index) => {
      const [x, y] = point(index, radius * (score / 100));
      append("circle", {
        cx: x, cy: y, r: 4.5,
        fill: "#ffffff",
        stroke: color,
        "stroke-width": 3
      });
    });
  });

  legend.innerHTML = selectedWorks.map((work, index) => `
    <div class="legend-item">
      <span class="legend-swatch" style="background:${COLORS[index % COLORS.length]}"></span>
      <span>${escapeHtml(work.title)}（平均 ${average(work.scores)}）</span>
    </div>
  `).join("");
}

function updateSummary() {
  document.getElementById("workCount").textContent = works.length;
  document.getElementById("compareCount").textContent = selectedIds.size;

  if (!works.length) {
    document.getElementById("topWork").textContent = "―";
    return;
  }

  const top = [...works].sort((a, b) => average(b.scores) - average(a.scores))[0];
  document.getElementById("topWork").textContent = `${top.title}（${average(top.scores)}）`;
}

function renderAll() {
  renderLibrary();
  renderChart();
  updateSummary();
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(works, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `anime-score-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error("形式が正しくありません。");

    const valid = imported.filter(item =>
      item &&
      typeof item.title === "string" &&
      Array.isArray(item.scores) &&
      item.scores.length === CATEGORIES.length
    ).map(item => ({
      id: item.id || crypto.randomUUID(),
      title: item.title,
      genre: item.genre || "",
      memo: item.memo || "",
      scores: item.scores.map(value => Math.max(0, Math.min(100, Number(value || 0)))),
      updatedAt: item.updatedAt || new Date().toISOString()
    }));

    if (!valid.length) throw new Error("読み込める作品データがありません。");

    works = valid;
    selectedIds.clear();
    saveWorks();
    renderAll();
    alert(`${valid.length}作品を読み込みました。`);
  } catch (error) {
    alert(`読み込みに失敗しました：${error.message}`);
  } finally {
    event.target.value = "";
  }
});

createScoreInputs();
renderAll();
