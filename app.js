const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]"
]);
const IS_LOCAL =
  location.protocol === "file:" ||
  LOCAL_HOSTS.has(location.hostname);
const LOCAL_STORAGE_KEY = "anime-score-lab-v2-dev";

let firebaseConfig = null;
let initializeApp;
let getAuth;
let GoogleAuthProvider;
let onAuthStateChanged;
let signInWithPopup;
let signOut;
let setPersistence;
let browserLocalPersistence;
let getFirestore;
let collection;
let doc;
let setDoc;
let deleteDoc;
let onSnapshot;
let writeBatch;

const CATEGORIES = [
  {
    key: "story",
    label: "ストーリー",
    description: "ストーリー展開・伏線・キャラクター関係"
  },
  {
    key: "visual",
    label: "映像・演出",
    description: "アクション・グラフィック・演出・音響"
  },
  {
    key: "emotion",
    label: "感情表現",
    description: "表情・心理描写・感情移入"
  },
  {
    key: "moving",
    label: "感動",
    description: "催涙度・心を動かされた度合い"
  },
  {
    key: "theme",
    label: "テーマ性",
    description: "人生の教訓・共感・メッセージ性"
  },
  {
    key: "addiction",
    label: "中毒性",
    description: "テンポ・見やすさ・繰り返し見たくなる度合い"
  }
];

const CATEGORY_KEYS = CATEGORIES.map(category => category.key);
const SCHEMA_VERSION = 3;

const GENRES = [
  "アクション",
  "アドベンチャー",
  "コメディ",
  "恋愛",
  "青春",
  "日常",
  "ドラマ",
  "ファンタジー",
  "ダークファンタジー",
  "異世界",
  "SF",
  "ミステリー",
  "サスペンス",
  "ホラー",
  "スポーツ",
  "音楽",
  "歴史",
  "戦争",
  "ロボット",
  "その他"
];

const COLORS = [
  "#d7b95f",
  "#7fa8d8",
  "#d77f91",
  "#70b79e",
  "#b08bd1",
  "#d89658",
  "#7fc0cf",
  "#c7a062",
  "#8d9bd1",
  "#c477b2"
];

let works = [];
let selectedIds = new Set();
const hiddenRadarIds = new Set();
const DEFAULT_VISIBLE_COUNT = 3;
const MAX_COMPARE_COUNT = 10;
let showAllOverall = false;
let showAllGenre = false;
let showAllCategory = false;
const libraryDrafts = new Map();
let librarySaveInProgress = false;
let librarySort = { key: "title", direction: "asc" };
const categoryRankingExpanded = Object.fromEntries(
  CATEGORY_KEYS.map(key => [key, false])
);
const categoryRankingOrder = Object.fromEntries(
  CATEGORY_KEYS.map(key => [key, "desc"])
);
const categoryApproximation = Object.fromEntries(
  CATEGORY_KEYS.map(key => [key, null])
);
const comparisonDrafts = new Map();
let comparisonSaveInProgress = false;
let formScoreBaseline = Object.fromEntries(
  CATEGORY_KEYS.map(key => [key, 70])
);

let currentUser = null;
let unsubscribeReviews = null;
let auth = null;
let db = null;

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginStatus = document.getElementById("loginStatus");
const configHelp = document.getElementById("configHelp");
const syncBanner = document.getElementById("syncBanner");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPhoto = document.getElementById("userPhoto");

const animeForm = document.getElementById("animeForm");
const scoreInputs = document.getElementById("scoreInputs");
const libraryEmpty = document.getElementById("libraryEmpty");
const librarySpreadsheetWrap = document.getElementById("librarySpreadsheetWrap");
const librarySpreadsheetHead = document.getElementById("librarySpreadsheetHead");
const librarySpreadsheetBody = document.getElementById("librarySpreadsheetBody");
const libraryCards = document.getElementById("libraryCards");
const libraryGenreFilter = document.getElementById("libraryGenreFilter");
const librarySaveBar = document.getElementById("librarySaveBar");
const librarySaveMessage = document.getElementById("librarySaveMessage");
const librarySaveBtn = document.getElementById("librarySaveBtn");
const libraryDiscardBtn = document.getElementById("libraryDiscardBtn");
const chartWrap = document.getElementById("chartWrap");
const radarChart = document.getElementById("radarChart");
const legend = document.getElementById("legend");
const radarTooltip = document.getElementById("radarTooltip");
const compareSearchInput = document.getElementById("compareSearchInput");
const compareSearchResults = document.getElementById("compareSearchResults");
const selectedCompareWorks = document.getElementById("selectedCompareWorks");
const comparePickerCount = document.getElementById("comparePickerCount");
const scoreComparisonEmpty = document.getElementById("scoreComparisonEmpty");
const scoreComparisonTableWrap = document.getElementById("scoreComparisonTableWrap");
const scoreComparisonHead = document.getElementById("scoreComparisonHead");
const scoreComparisonBody = document.getElementById("scoreComparisonBody");
const comparisonSaveBar = document.getElementById("comparisonSaveBar");
const comparisonSaveMessage = document.getElementById("comparisonSaveMessage");
const comparisonSaveBtn = document.getElementById("comparisonSaveBtn");
const comparisonDiscardBtn = document.getElementById("comparisonDiscardBtn");
const aiSummary = document.getElementById("aiSummary");
const totalWorksStat = document.getElementById("totalWorksStat");
const totalEpisodesStat = document.getElementById("totalEpisodesStat");
const totalWatchTimeStat = document.getElementById("totalWatchTimeStat");
const genreStatsFirst = document.getElementById("genreStatsFirst");
const genreStatsSecond = document.getElementById("genreStatsSecond");
const overallRankingToggle = document.getElementById("overallRankingToggle");
const genreRankingToggle = document.getElementById("genreRankingToggle");
const editingId = document.getElementById("editingId");
const titleInput = document.getElementById("title");
const genreOptions = document.getElementById("genreOptions");
const episodesInput = document.getElementById("episodes");
const memoInput = document.getElementById("memo");
const searchInput = document.getElementById("searchInput");
const saveBtn = document.getElementById("saveBtn");
const overallRanking = document.getElementById("overallRanking");
const overallRankingEmpty = document.getElementById("overallRankingEmpty");
const overallRankingCount = document.getElementById("overallRankingCount");
const genreRanking = document.getElementById("genreRanking");
const genreRankingEmpty = document.getElementById("genreRankingEmpty");
const genreRankingCount = document.getElementById("genreRankingCount");
const genreRankingSelect = document.getElementById("genreRankingSelect");

function loadLocalWorks() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.map(item => normalizeWork(item)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function saveLocalWorks() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(works));
}

function refreshLocalWorks(message = `ローカル保存済み：${works.length}作品`) {
  works.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const existingIds = new Set(works.map(work => work.id));
  selectedIds = new Set([...selectedIds].filter(id => existingIds.has(id)));
  [...comparisonDrafts.keys()].forEach(id => {
    if (!existingIds.has(id)) comparisonDrafts.delete(id);
  });
  saveLocalWorks();
  renderAll();
  setSyncStatus(message, "local");
}

async function loadFirebaseConfig() {
  const configModule = await import("./firebase-config.js");
  firebaseConfig = configModule.firebaseConfig;

  if (!firebaseConfig || typeof firebaseConfig !== "object") {
    throw new Error("firebase-config.js からFirebase設定を読み込めませんでした。");
  }
}

async function loadFirebaseModules() {
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
  ]);

  ({ initializeApp } = appModule);
  ({
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    setPersistence,
    browserLocalPersistence
  } = authModule);
  ({
    getFirestore,
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    writeBatch
  } = firestoreModule);
}

function isFirebaseConfigured() {
  if (!firebaseConfig || typeof firebaseConfig !== "object") {
    return false;
  }

  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId
  ];

  return required.every(value =>
    typeof value === "string" &&
    value.trim() !== "" &&
    !value.includes("YOUR_")
  );
}

function setLoginStatus(message = "", isError = false) {
  loginStatus.textContent = message;
  loginStatus.classList.toggle("error", isError);
}

function setSyncStatus(message, type = "") {
  syncBanner.textContent = message;
  syncBanner.className = "sync-banner";
  if (type) syncBanner.classList.add(type);
}

function showLoginScreen() {
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function showAppScreen() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
}

function reviewsCollection(uid = currentUser?.uid) {
  if (!db || !uid) throw new Error("ログイン情報を確認できません。");
  return collection(db, "users", uid, "animeReviews");
}

function reviewDocument(reviewId, uid = currentUser?.uid) {
  if (!db || !uid) throw new Error("ログイン情報を確認できません。");
  return doc(db, "users", uid, "animeReviews", reviewId);
}

function clampScore(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function mean(values) {
  const valid = values.map(Number).filter(Number.isFinite);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function migrateLegacyScores(rawScores) {
  // Ver2までの10項目配列をVer3の6項目へ近似変換します。
  if (Array.isArray(rawScores) && rawScores.length >= 10) {
    const old = rawScores.map(value => clampScore(value));
    return {
      story: mean([old[0], old[1], old[2]]),
      visual: mean([old[3], old[4], old[5]]),
      emotion: old[6],
      moving: old[6],
      theme: old[7],
      addiction: mean([old[8], old[9]])
    };
  }

  // 6項目配列のバックアップも読み込めるようにします。
  if (Array.isArray(rawScores) && rawScores.length >= 6) {
    return Object.fromEntries(
      CATEGORY_KEYS.map((key, index) => [key, clampScore(rawScores[index])])
    );
  }

  if (rawScores && typeof rawScores === "object") {
    return Object.fromEntries(
      CATEGORY_KEYS.map(key => [key, clampScore(rawScores[key])])
    );
  }

  return Object.fromEntries(CATEGORY_KEYS.map(key => [key, 0]));
}

function normalizeGenres(value) {
  if (Array.isArray(value)) {
    return [...new Set(
      value
        .map(item => String(item || "").trim())
        .filter(Boolean)
    )];
  }

  const text = String(value || "").trim();
  if (!text) return [];

  return [...new Set(
    text
      .split(/[、,\\/|]/)
      .map(item => item.trim())
      .filter(Boolean)
  )];
}

function genreText(work) {
  const genres = normalizeGenres(work?.genres ?? work?.genre);
  return genres.length ? genres.join("・") : "ジャンル未設定";
}

function normalizeWork(item, fallbackId = crypto.randomUUID()) {
  const legacyScores = Array.isArray(item?.scores) && item.scores.length >= 10;

  return {
    id: String(item?.id || fallbackId),
    title: String(item?.title || "").trim(),
    genres: normalizeGenres(item?.genres ?? item?.genre),
    genre: normalizeGenres(item?.genres ?? item?.genre).join("、"),
    memo: String(item?.memo || "").trim(),
    episodes: Math.max(0, Math.round(Number(item?.episodes || 0))),
    scores: migrateLegacyScores(item?.scores),
    schemaVersion: SCHEMA_VERSION,
    migratedFromLegacy: legacyScores,
    updatedAt: typeof item?.updatedAt === "string"
      ? item.updatedAt
      : new Date().toISOString()
  };
}

function scoreValues(scores) {
  const normalized = migrateLegacyScores(scores);
  return CATEGORY_KEYS.map(key => normalized[key]);
}

function scoreValue(scores, categoryKey) {
  return migrateLegacyScores(scores)[categoryKey] ?? 0;
}

function populateGenreOptions(selectedValues = []) {
  const selected = new Set(normalizeGenres(selectedValues));
  genreOptions.innerHTML = "";

  GENRES.forEach(genre => {
    const label = document.createElement("label");
    label.className = "genre-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = genre;
    checkbox.checked = selected.has(genre);

    const text = document.createElement("span");
    text.textContent = genre;

    label.append(checkbox, text);
    genreOptions.appendChild(label);
  });

  normalizeGenres(selectedValues)
    .filter(genre => !GENRES.includes(genre))
    .forEach(genre => {
      const label = document.createElement("label");
      label.className = "genre-option legacy";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = genre;
      checkbox.checked = true;

      const text = document.createElement("span");
      text.textContent = `${genre}（既存値）`;

      label.append(checkbox, text);
      genreOptions.appendChild(label);
    });
}

function getSelectedGenres() {
  return [...genreOptions.querySelectorAll('input[type="checkbox"]:checked')]
    .map(input => input.value);
}

function captureFormScoreBaseline(scores = getScores()) {
  formScoreBaseline = { ...migrateLegacyScores(scores) };
}

function updateCategoryApproximationFromForm(categoryKey, value) {
  const normalizedValue = clampScore(value);
  const baselineValue = formScoreBaseline[categoryKey] ?? 70;
  const editingWorkId = editingId.value || null;

  if (normalizedValue !== baselineValue) {
    setCategoryApproximation(
      categoryKey,
      editingWorkId,
      normalizedValue,
      "form"
    );
  } else if (categoryApproximation[categoryKey]?.source === "form") {
    categoryApproximation[categoryKey] = null;
  }

  renderCategoryRankingCards();
}

function initializeStaticUi() {
  populateGenreOptions([]);
  createScoreInputs();
  captureFormScoreBaseline();
}

function createScoreInputs() {
  scoreInputs.innerHTML = "";

  CATEGORIES.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <div class="score-label">
        <div class="score-name">${escapeHtml(category.label)}</div>
        <div class="score-description">${escapeHtml(category.description)}</div>
      </div>
      <input
        id="range-${category.key}"
        type="range"
        min="0"
        max="100"
        value="70"
        aria-label="${escapeHtml(category.label)}の点数"
      />
      <input
        id="number-${category.key}"
        class="score-number"
        type="number"
        min="0"
        max="100"
        value="70"
        aria-label="${escapeHtml(category.label)}の点数"
      />
    `;

    const range = row.querySelector(`#range-${category.key}`);
    const number = row.querySelector(`#number-${category.key}`);

    range.addEventListener("input", () => {
      number.value = range.value;
      updateCategoryApproximationFromForm(category.key, range.value);
    });

    number.addEventListener("input", () => {
      const value = clampScore(number.value);
      number.value = value;
      range.value = value;
      updateCategoryApproximationFromForm(category.key, value);
    });

    scoreInputs.appendChild(row);
  });
}

function getScores() {
  return Object.fromEntries(
    CATEGORIES.map(category => [
      category.key,
      clampScore(document.getElementById(`number-${category.key}`).value)
    ])
  );
}

function setScores(scores) {
  const normalized = migrateLegacyScores(scores);

  CATEGORIES.forEach(category => {
    const value = normalized[category.key] ?? 70;
    document.getElementById(`range-${category.key}`).value = value;
    document.getElementById(`number-${category.key}`).value = value;
  });
}

function resetForm() {
  animeForm.reset();
  editingId.value = "";
  titleInput.value = "";
  populateGenreOptions([]);
  memoInput.value = "";
  episodesInput.value = "0";
  const defaultScores = Object.fromEntries(
    CATEGORY_KEYS.map(key => [key, 70])
  );
  setScores(defaultScores);
  captureFormScoreBaseline(defaultScores);
  clearAllCategoryApproximations();
  renderCategoryRankingCards();
  saveBtn.textContent = "作品を保存";
}

function setFormBusy(isBusy) {
  saveBtn.disabled = isBusy;
  saveBtn.textContent = isBusy
    ? "保存中…"
    : editingId.value
      ? "変更を保存"
      : "作品を保存";
}

animeForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser) return;

  const work = normalizeWork({
    id: editingId.value || crypto.randomUUID(),
    title: titleInput.value,
    genres: getSelectedGenres(),
    genre: getSelectedGenres().join("、"),
    memo: memoInput.value,
    episodes: Math.max(0, Math.round(Number(episodesInput.value || 0))),
    scores: getScores(),
    updatedAt: new Date().toISOString()
  });

  if (!work.title) return;

  if (!work.genres.length) {
    alert("ジャンルを1つ以上選択してください。");
    return;
  }

  setFormBusy(true);
  setSyncStatus(IS_LOCAL ? "ローカルへ保存しています…" : "Firestoreへ保存しています…");

  try {
    if (IS_LOCAL) {
      const existingIndex = works.findIndex(item => item.id === work.id);
      if (existingIndex >= 0) {
        works[existingIndex] = work;
      } else {
        works.unshift(work);
      }
      resetForm();
      refreshLocalWorks(`ローカル保存済み：${works.length}作品`);
    } else {
      await setDoc(reviewDocument(work.id), {
        title: work.title,
        genres: work.genres,
        genre: work.genres.join("、"),
        memo: work.memo,
        episodes: work.episodes,
        scores: work.scores,
        schemaVersion: SCHEMA_VERSION,
        updatedAt: work.updatedAt
      });
      resetForm();
      setSyncStatus("保存しました。ほかの端末にも同期されます。", "success");
    }
  } catch (error) {
    console.error(error);
    setSyncStatus(`保存に失敗しました：${friendlyError(error)}`, "error");
    alert(`保存に失敗しました：${friendlyError(error)}`);
  } finally {
    setFormBusy(false);
  }
});

document.getElementById("resetBtn").addEventListener("click", resetForm);
document.getElementById("clearCompareBtn").addEventListener("click", () => {
  selectedIds.clear();
  hiddenRadarIds.clear();
  comparisonDrafts.clear();
  clearAllCategoryApproximations();
  compareSearchInput.value = "";
  renderAll();
});


genreRankingSelect.addEventListener("change", () => {
  showAllGenre = false;
  renderRankings();
});


function average(scores) {
  const values = scoreValues(scores);
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

function strongestCategories(work) {
  const values = scoreValues(effectiveScores(work));
  const max = Math.max(...values);

  return CATEGORIES
    .filter((category, index) => values[index] === max)
    .slice(0, 2)
    .map(category => category.label)
    .join("・");
}

function updateToggleButton(button, totalCount, expanded, collapsedLabel, expandedLabel) {
  if (!button) return;
  const canExpand = totalCount > DEFAULT_VISIBLE_COUNT;
  button.classList.toggle("hidden", !canExpand);
  button.textContent = expanded ? expandedLabel : collapsedLabel;
  button.setAttribute("aria-expanded", String(expanded));
}

function getLibraryEffectiveWork(work) {
  const draft = libraryDrafts.get(work.id);
  if (!draft) return work;
  return { ...work, ...draft, genres: draft.genres ?? work.genres, genre: (draft.genres ?? work.genres ?? []).join("、"), scores: draft.scores ?? work.scores };
}

function updateLibraryDraft(workId, updater) {
  const work = works.find(item => item.id === workId);
  if (!work) return null;

  const existingDraft = libraryDrafts.get(workId);
  const current = {
    title: existingDraft?.title ?? work.title,
    episodes: existingDraft?.episodes ?? work.episodes ?? 0,
    genres: [...(existingDraft?.genres ?? normalizeGenres(work.genres ?? work.genre))],
    scores: {
      ...migrateLegacyScores(work.scores),
      ...(existingDraft?.scores || {})
    }
  };

  updater(current);

  current.title = String(current.title || "");
  current.episodes = Math.max(0, Math.round(Number(current.episodes || 0)));
  current.genres = normalizeGenres(current.genres);
  current.scores = migrateLegacyScores(current.scores);

  const originalGenres = normalizeGenres(work.genres ?? work.genre);
  const originalScores = migrateLegacyScores(work.scores);
  const changed =
    current.title !== work.title ||
    current.episodes !== Number(work.episodes || 0) ||
    JSON.stringify(current.genres) !== JSON.stringify(originalGenres) ||
    CATEGORY_KEYS.some(key => current.scores[key] !== originalScores[key]);

  if (changed) {
    libraryDrafts.set(workId, current);
  } else {
    libraryDrafts.delete(workId);
  }

  updateLibrarySaveBar();
  return getLibraryEffectiveWork(work);
}

function syncLibraryWorkViews(workId, sourceElement = null) {
  const work = works.find(item => item.id === workId);
  if (!work) return;

  const effective = getLibraryEffectiveWork(work);
  const escapedId = typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(workId)
    : workId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  document
    .querySelectorAll(`[data-work-id="${escapedId}"]`)
    .forEach(container => {
      const titleInput = container.querySelector(".sheet-title-input");
      const episodesInput = container.querySelector(".sheet-episodes-input");
      const averageCell = container.querySelector(".sheet-average-cell, .mobile-average");

      if (titleInput && titleInput !== sourceElement) {
        titleInput.value = effective.title;
      }
      if (episodesInput && episodesInput !== sourceElement) {
        episodesInput.value = effective.episodes || 0;
      }
      if (averageCell) {
        averageCell.textContent = average(effective.scores);
      }

      container.querySelectorAll(".sheet-score-input").forEach(input => {
        if (input !== sourceElement) {
          input.value = scoreValue(effective.scores, input.dataset.categoryKey);
        }
      });

      const selectedGenres = new Set(normalizeGenres(effective.genres ?? effective.genre));
      container.querySelectorAll(".sheet-genre-editor input").forEach(input => {
        if (input !== sourceElement) {
          input.checked = selectedGenres.has(input.value);
        }
      });

      const summary = container.querySelector(".sheet-genre-editor summary");
      if (summary) summary.textContent = genreText(effective);
    });
}

function updateLibrarySaveBar() {
  const count = libraryDrafts.size;
  librarySaveBar.classList.toggle("hidden", count === 0);
  librarySaveMessage.textContent = count ? `${count}作品に未保存の変更があります` : "作品一覧に未保存の変更があります";
  librarySaveBtn.disabled = librarySaveInProgress || count === 0;
  libraryDiscardBtn.disabled = librarySaveInProgress || count === 0;
  librarySaveBtn.textContent = librarySaveInProgress ? "保存中…" : "変更を保存";
}

function compareLibraryWorks(a,b) {
  const A=getLibraryEffectiveWork(a), B=getLibraryEffectiveWork(b), d=librarySort.direction === "asc" ? 1 : -1;
  if (librarySort.key === "title") return A.title.localeCompare(B.title,"ja")*d;
  let va,vb;
  if (librarySort.key === "average") { va=average(A.scores); vb=average(B.scores); }
  else if (librarySort.key === "episodes") { va=Number(A.episodes||0); vb=Number(B.episodes||0); }
  else { va=scoreValue(A.scores,librarySort.key); vb=scoreValue(B.scores,librarySort.key); }
  if (va !== vb) return (va-vb)*d;
  return A.title.localeCompare(B.title,"ja");
}
function sortIndicator(key) { return librarySort.key !== key ? "↕" : librarySort.direction === "asc" ? "▲" : "▼"; }

function renderLibraryHead() {
  librarySpreadsheetHead.innerHTML = `<tr>
    <th class="sticky-title"><button class="sheet-sort-button" data-sort-key="title" type="button">作品名 ${sortIndicator("title")}</button></th>
    <th><button class="sheet-sort-button" data-sort-key="episodes" type="button">話数 ${sortIndicator("episodes")}</button></th>
    <th>ジャンル</th>
    <th><button class="sheet-sort-button" data-sort-key="average" type="button">平均 ${sortIndicator("average")}</button></th>
    ${CATEGORIES.map(c=>`<th><button class="sheet-sort-button" data-sort-key="${c.key}" type="button">${escapeHtml(c.label)} ${sortIndicator(c.key)}</button></th>`).join("")}</tr>`;
  librarySpreadsheetHead.querySelectorAll(".sheet-sort-button").forEach(button=>button.addEventListener("click",()=>{
    const key=button.dataset.sortKey;
    if (librarySort.key === key) librarySort.direction=librarySort.direction === "asc" ? "desc" : "asc";
    else librarySort={key,direction:key === "title" ? "asc" : "desc"};
    renderLibrary();
  }));
}

function genreEditorHtml(work) {
  const selected=new Set(normalizeGenres(work.genres ?? work.genre));
  return `<details class="sheet-genre-editor"><summary>${escapeHtml(genreText(work))}</summary><div class="sheet-genre-options">
    ${GENRES.map(g=>`<label><input type="checkbox" value="${escapeHtml(g)}" ${selected.has(g)?"checked":""}/><span>${escapeHtml(g)}</span></label>`).join("")}
  </div></details>`;
}

function spreadsheetRowHtml(work) {
  const e=getLibraryEffectiveWork(work);
  return `<tr data-work-id="${escapeHtml(work.id)}">
    <td class="sticky-title"><input class="sheet-title-input" type="text" value="${escapeHtml(e.title)}" maxlength="80"/></td>
    <td><input class="sheet-number-input sheet-episodes-input" type="number" min="0" max="9999" value="${Number(e.episodes||0)}"/></td>
    <td class="sheet-genre-cell">${genreEditorHtml(e)}</td>
    <td class="sheet-average-cell">${average(e.scores)}</td>
    ${CATEGORIES.map(c=>`<td><input class="sheet-number-input sheet-score-input" type="number" min="0" max="100" value="${scoreValue(e.scores,c.key)}" data-category-key="${c.key}"/></td>`).join("")}
  </tr>`;
}

function mobileCardHtml(work) {
  const e=getLibraryEffectiveWork(work);
  return `<article class="library-mobile-card" data-work-id="${escapeHtml(work.id)}">
    <label><span>作品名</span><input class="sheet-title-input" type="text" value="${escapeHtml(e.title)}"/></label>
    <div class="mobile-card-meta"><label><span>話数</span><input class="sheet-number-input sheet-episodes-input" type="number" min="0" max="9999" value="${Number(e.episodes||0)}"/></label><div><span>平均</span><strong class="mobile-average">${average(e.scores)}</strong></div></div>
    <div class="sheet-genre-cell">${genreEditorHtml(e)}</div>
    <div class="mobile-score-grid">${CATEGORIES.map(c=>`<label><span>${escapeHtml(c.label)}</span><input class="sheet-number-input sheet-score-input" type="number" min="0" max="100" value="${scoreValue(e.scores,c.key)}" data-category-key="${c.key}"/></label>`).join("")}</div>
  </article>`;
}

function bindLibraryEditors(container) {
  container.querySelectorAll("[data-work-id]").forEach(row => {
    const workId = row.dataset.workId;

    row.querySelector(".sheet-title-input")?.addEventListener("input", event => {
      updateLibraryDraft(workId, draft => {
        draft.title = event.target.value;
      });
      syncLibraryWorkViews(workId, event.target);
    });

    row.querySelector(".sheet-episodes-input")?.addEventListener("input", event => {
      const value = Math.max(0, Math.round(Number(event.target.value || 0)));
      updateLibraryDraft(workId, draft => {
        draft.episodes = value;
      });
      syncLibraryWorkViews(workId, event.target);
    });

    row.querySelectorAll(".sheet-score-input").forEach(input => {
      input.addEventListener("input", () => {
        const value = clampScore(input.value);
        input.value = value;
        updateLibraryDraft(workId, draft => {
          draft.scores[input.dataset.categoryKey] = value;
        });
        syncLibraryWorkViews(workId, input);
      });
    });

    row.querySelectorAll(".sheet-genre-editor input").forEach(input => {
      input.addEventListener("change", () => {
        const selectedGenres = [
          ...row.querySelectorAll(".sheet-genre-editor input:checked")
        ].map(item => item.value);

        updateLibraryDraft(workId, draft => {
          draft.genres = selectedGenres;
        });
        syncLibraryWorkViews(workId, input);
      });
    });
  });
}

function renderLibraryGenreFilter() {
  const current=libraryGenreFilter.value;
  const available=[...new Set(works.flatMap(w=>normalizeGenres(w.genres ?? w.genre)))].sort((a,b)=>a.localeCompare(b,"ja"));
  libraryGenreFilter.innerHTML=`<option value="">すべてのジャンル</option>${available.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}`;
  libraryGenreFilter.value=available.includes(current)?current:"";
}

function renderLibrary() {
  renderLibraryHead(); renderLibraryGenreFilter();
  const q=searchInput.value.trim().toLowerCase(), genre=libraryGenreFilter.value;
  const filtered=works.filter(w=>{const e=getLibraryEffectiveWork(w);return `${e.title} ${genreText(e)}`.toLowerCase().includes(q) && (!genre || normalizeGenres(e.genres ?? e.genre).includes(genre));}).sort(compareLibraryWorks);
  libraryEmpty.classList.toggle("hidden",filtered.length>0);
  librarySpreadsheetWrap.classList.toggle("hidden",filtered.length===0);
  libraryCards.classList.toggle("hidden",filtered.length===0);
  librarySpreadsheetBody.innerHTML=filtered.map(spreadsheetRowHtml).join("");
  libraryCards.innerHTML=filtered.map(mobileCardHtml).join("");
  bindLibraryEditors(librarySpreadsheetBody); bindLibraryEditors(libraryCards); updateLibrarySaveBar();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function updateComparisonSelection(workId, shouldSelect) {
  if (shouldSelect) {
    if (selectedIds.size >= MAX_COMPARE_COUNT && !selectedIds.has(workId)) {
      alert(`比較できる作品は最大${MAX_COMPARE_COUNT}作品です。`);
      return false;
    }
    selectedIds.add(workId);
  } else {
    selectedIds.delete(workId);
    comparisonDrafts.delete(workId);
    hiddenRadarIds.delete(workId);
  }

  renderComparisonPicker();
  renderScoreComparisonTable();
  renderChart();
  renderLibrary();
  updateSummary();
  return true;
}

function renderSelectedCompareWorks() {
  const selectedWorks = works.filter(work => selectedIds.has(work.id));
  comparePickerCount.textContent = `${selectedWorks.length} / ${MAX_COMPARE_COUNT}`;

  if (!selectedWorks.length) {
    selectedCompareWorks.innerHTML =
      '<p class="compare-selection-empty">まだ比較作品が選択されていません。</p>';
    return;
  }

  selectedCompareWorks.innerHTML = selectedWorks.map(work => `
    <button
      type="button"
      class="compare-chip"
      data-work-id="${escapeHtml(work.id)}"
      title="${escapeHtml(work.title)}を比較から外す"
    >
      <span>${escapeHtml(work.title)}</span>
      <span class="compare-chip-remove" aria-hidden="true">×</span>
    </button>
  `).join("");

  selectedCompareWorks.querySelectorAll(".compare-chip").forEach(button => {
    button.addEventListener("click", () => {
      updateComparisonSelection(button.dataset.workId, false);
    });
  });
}

function renderCompareSearchResults() {
  const query = compareSearchInput.value.trim().toLowerCase();

  if (!query) {
    compareSearchResults.innerHTML = "";
    compareSearchResults.classList.add("hidden");
    return;
  }

  const matches = works
    .filter(work =>
      !selectedIds.has(work.id) &&
      `${work.title} ${genreText(work)}`.toLowerCase().includes(query)
    )
    .slice(0, 8);

  if (!matches.length) {
    compareSearchResults.innerHTML =
      '<div class="compare-result-empty">該当する作品がありません。</div>';
    compareSearchResults.classList.remove("hidden");
    return;
  }

  compareSearchResults.innerHTML = matches.map(work => `
    <button
      type="button"
      class="compare-result-item"
      data-work-id="${escapeHtml(work.id)}"
      role="option"
    >
      <span>
        <strong>${escapeHtml(work.title)}</strong>
        <small>${escapeHtml(genreText(work))}</small>
      </span>
      <span class="compare-result-score">平均 ${average(work.scores)}</span>
    </button>
  `).join("");

  compareSearchResults.querySelectorAll(".compare-result-item").forEach(button => {
    button.addEventListener("click", () => {
      const added = updateComparisonSelection(button.dataset.workId, true);
      if (added) {
        compareSearchInput.value = "";
        renderCompareSearchResults();
        compareSearchInput.focus();
      }
    });
  });

  compareSearchResults.classList.remove("hidden");
}

function renderComparisonPicker() {
  renderSelectedCompareWorks();
  renderCompareSearchResults();
}

function effectiveScores(work) {
  return comparisonDrafts.get(work.id) || migrateLegacyScores(work.scores);
}

function effectiveScoreValue(work, categoryKey) {
  return effectiveScores(work)[categoryKey] ?? 0;
}

function getChangedComparisonWorks() {
  return works.filter(work => comparisonDrafts.has(work.id));
}

function updateComparisonSaveBar() {
  const changedWorks = getChangedComparisonWorks();
  const changedCount = changedWorks.length;

  comparisonSaveBar.classList.toggle("hidden", changedCount === 0);
  comparisonSaveMessage.textContent = changedCount
    ? `${changedCount}作品の点数が変更されています`
    : "点数が変更されています";

  comparisonSaveBtn.disabled = comparisonSaveInProgress || changedCount === 0;
  comparisonDiscardBtn.disabled = comparisonSaveInProgress || changedCount === 0;
  comparisonSaveBtn.textContent = comparisonSaveInProgress
    ? "保存中…"
    : "変更を保存";
}

function updateComparisonDraft(workId, categoryKey, value) {
  const work = works.find(item => item.id === workId);
  if (!work) return;

  const originalScores = migrateLegacyScores(work.scores);
  const currentDraft = {
    ...(comparisonDrafts.get(workId) || originalScores)
  };

  currentDraft[categoryKey] = clampScore(value);
  const hasChanges = CATEGORY_KEYS.some(
    key => currentDraft[key] !== originalScores[key]
  );

  if (hasChanges) {
    comparisonDrafts.set(workId, currentDraft);
  } else {
    comparisonDrafts.delete(workId);
  }

  const changedCategoryValue =
    currentDraft[categoryKey] !== originalScores[categoryKey];

  if (changedCategoryValue) {
    setCategoryApproximation(categoryKey, workId, currentDraft[categoryKey], "comparison");
  } else if (
    categoryApproximation[categoryKey]?.workId === workId
  ) {
    categoryApproximation[categoryKey] = null;
  }

  updateComparisonSaveBar();
  renderChart();
  renderCategoryRankingCards();
}

function renderScoreComparisonTable() {
  const selectedWorks = works.filter(work => selectedIds.has(work.id));

  scoreComparisonEmpty.classList.toggle("hidden", selectedWorks.length > 0);
  scoreComparisonTableWrap.classList.toggle("hidden", selectedWorks.length === 0);

  if (!selectedWorks.length) {
    scoreComparisonHead.innerHTML = "";
    scoreComparisonBody.innerHTML = "";
    updateComparisonSaveBar();
    return;
  }

  scoreComparisonHead.innerHTML = `
    <tr>
      <th>観点</th>
      ${selectedWorks.map(work => `<th>${escapeHtml(work.title)}</th>`).join("")}
    </tr>
  `;

  scoreComparisonBody.innerHTML = CATEGORIES.map(category => `
    <tr>
      <th>
        <span>${escapeHtml(category.label)}</span>
        <small>${escapeHtml(category.description)}</small>
      </th>
      ${selectedWorks.map(work => `
        <td>
          <label class="comparison-score-field">
            <span class="sr-only">${escapeHtml(work.title)}の${escapeHtml(category.label)}</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value="${effectiveScoreValue(work, category.key)}"
              data-work-id="${escapeHtml(work.id)}"
              data-category-key="${escapeHtml(category.key)}"
              aria-label="${escapeHtml(work.title)}の${escapeHtml(category.label)}"
            />
            <span>点</span>
          </label>
        </td>
      `).join("")}
    </tr>
  `).join("");

  scoreComparisonBody
    .querySelectorAll(".comparison-score-field input")
    .forEach(input => {
      input.addEventListener("input", () => {
        const value = clampScore(input.value);
        input.value = value;
        updateComparisonDraft(
          input.dataset.workId,
          input.dataset.categoryKey,
          value
        );
      });
    });

  updateComparisonSaveBar();
}

async function saveComparisonDrafts() {
  const changedWorks = getChangedComparisonWorks();
  if (!changedWorks.length || comparisonSaveInProgress) return;

  comparisonSaveInProgress = true;
  updateComparisonSaveBar();
  setSyncStatus(
    IS_LOCAL ? "比較表の変更をローカルへ保存しています…" : "比較表の変更をFirestoreへ保存しています…"
  );

  try {
    const updatedAt = new Date().toISOString();

    if (IS_LOCAL) {
      changedWorks.forEach(work => {
        work.scores = { ...comparisonDrafts.get(work.id) };
        work.updatedAt = updatedAt;
      });

      comparisonDrafts.clear();
      clearAllCategoryApproximations();
      refreshLocalWorks(`比較表から${changedWorks.length}作品を保存しました。`);
    } else {
      const batch = writeBatch(db);

      changedWorks.forEach(work => {
        const scores = { ...comparisonDrafts.get(work.id) };
        batch.set(
          reviewDocument(work.id),
          {
            scores,
            schemaVersion: SCHEMA_VERSION,
            updatedAt
          },
          { merge: true }
        );
      });

      await batch.commit();

      changedWorks.forEach(work => {
        work.scores = { ...comparisonDrafts.get(work.id) };
        work.updatedAt = updatedAt;
      });

      comparisonDrafts.clear();
      clearAllCategoryApproximations();
      renderAll();
      setSyncStatus(
        `比較表から${changedWorks.length}作品を保存しました。`,
        "success"
      );
    }
  } catch (error) {
    console.error(error);
    setSyncStatus(
      `比較表の保存に失敗しました：${friendlyError(error)}`,
      "error"
    );
    alert(`保存に失敗しました：${friendlyError(error)}`);
  } finally {
    comparisonSaveInProgress = false;
    updateComparisonSaveBar();
  }
}

function discardComparisonDrafts() {
  if (!comparisonDrafts.size) return;

  comparisonDrafts.clear();
  clearAllCategoryApproximations();
  renderScoreComparisonTable();
  renderChart();
  updateComparisonSaveBar();
}

function sortWorksForCategory(categoryKey, order = "desc") {
  return [...works].sort((a, b) => {
    const scoreA = effectiveScoreValue(a, categoryKey);
    const scoreB = effectiveScoreValue(b, categoryKey);
    const scoreDifference = order === "asc"
      ? scoreA - scoreB
      : scoreB - scoreA;

    if (scoreDifference !== 0) return scoreDifference;

    const averageDifference = order === "asc"
      ? average(effectiveScores(a)) - average(effectiveScores(b))
      : average(effectiveScores(b)) - average(effectiveScores(a));

    if (averageDifference !== 0) return averageDifference;
    return a.title.localeCompare(b.title, "ja");
  });
}

function getProximityRanking(categoryKey, approximation) {
  const globallyRanked = sortWorksForCategory(categoryKey, "desc");
  if (!globallyRanked.length || !approximation) return [];

  let centerIndex = approximation.workId
    ? globallyRanked.findIndex(work => work.id === approximation.workId)
    : -1;

  if (centerIndex < 0) {
    centerIndex = globallyRanked.reduce((bestIndex, work, index) => {
      const currentDifference = Math.abs(
        effectiveScoreValue(work, categoryKey) - approximation.score
      );
      const bestDifference = Math.abs(
        effectiveScoreValue(globallyRanked[bestIndex], categoryKey) -
          approximation.score
      );

      if (currentDifference !== bestDifference) {
        return currentDifference < bestDifference ? index : bestIndex;
      }

      return effectiveScoreValue(work, categoryKey) >
        effectiveScoreValue(globallyRanked[bestIndex], categoryKey)
        ? index
        : bestIndex;
    }, 0);
  }

  const maxItems = Math.min(5, globallyRanked.length);
  let start = Math.max(0, centerIndex - Math.floor(maxItems / 2));
  let end = start + maxItems;

  if (end > globallyRanked.length) {
    end = globallyRanked.length;
    start = Math.max(0, end - maxItems);
  }

  return globallyRanked.slice(start, end).map((work, offset) => ({
    work,
    globalRank: start + offset + 1
  }));
}

function setCategoryApproximation(
  categoryKey,
  workId,
  score,
  source = "comparison"
) {
  categoryApproximation[categoryKey] = {
    workId,
    score: clampScore(score),
    source
  };
}

function clearCategoryApproximation(categoryKey) {
  categoryApproximation[categoryKey] = null;
  renderCategoryRankingCards();
}

function clearAllCategoryApproximations() {
  CATEGORY_KEYS.forEach(key => {
    categoryApproximation[key] = null;
  });
}

function renderCategoryRankingCards() {
  CATEGORIES.forEach(category => {
    const list = document.getElementById(`categoryList-${category.key}`);
    const toggle = document.getElementById(`categoryToggle-${category.key}`);
    const orderControls = document.getElementById(
      `categoryOrderControls-${category.key}`
    );
    const ascButton = document.getElementById(`categoryAsc-${category.key}`);
    const descButton = document.getElementById(`categoryDesc-${category.key}`);
    const approxClearButton = document.getElementById(
      `categoryApproxClear-${category.key}`
    );

    if (
      !list ||
      !toggle ||
      !orderControls ||
      !ascButton ||
      !descButton ||
      !approxClearButton
    ) return;

    const approximation = categoryApproximation[category.key];
    const isApproximationMode = Boolean(approximation);

    orderControls.classList.toggle("hidden", isApproximationMode);
    toggle.classList.toggle("force-hidden", isApproximationMode);
    approxClearButton.classList.toggle("hidden", !isApproximationMode);

    if (isApproximationMode) {
      const nearby = getProximityRanking(category.key, approximation);

      list.innerHTML = nearby.length
        ? nearby.map(({ work, globalRank }, index) => rankingItemHtml(
            work,
            index,
            effectiveScoreValue(work, category.key),
            category.label,
            globalRank
          )).join("")
        : '<li class="ranking-empty compact">近似作品がありません</li>';

      return;
    }

    const order = categoryRankingOrder[category.key] || "desc";
    const ranked = sortWorksForCategory(category.key, order);
    const expanded = Boolean(categoryRankingExpanded[category.key]);
    const visible = expanded
      ? ranked
      : ranked.slice(0, DEFAULT_VISIBLE_COUNT);

    ascButton.classList.toggle("active", order === "asc");
    descButton.classList.toggle("active", order === "desc");

    list.innerHTML = visible.length
      ? visible.map((work, index) => rankingItemHtml(
          work,
          index,
          effectiveScoreValue(work, category.key),
          category.label
        )).join("")
      : '<li class="ranking-empty compact">作品未登録</li>';

    updateToggleButton(
      toggle,
      ranked.length,
      expanded,
      "すべて表示",
      "3件表示に戻す"
    );
  });
}

function buildAiSummary() {
  if (!works.length) {
    return {
      headline: "まだ分析できる作品がありません",
      paragraphs: [
        "作品を登録すると、評価観点・ジャンル・視聴量から好みの傾向を自動で要約します。"
      ],
      facts: []
    };
  }

  const rankedWorks = [...works].sort(compareByScoreThenTitle);
  const topWork = rankedWorks[0];
  const categoryAverages = CATEGORIES.map(category => ({
    key: category.key,
    label: category.label,
    value: Math.round(
      works.reduce(
        (sum, work) => sum + scoreValue(work.scores, category.key),
        0
      ) / works.length
    )
  })).sort((a, b) => b.value - a.value);

  const strongest = categoryAverages[0];
  const secondStrongest = categoryAverages[1];
  const strictest = categoryAverages[categoryAverages.length - 1];

  const genreCounts = GENRES.map(genre => ({
    genre,
    works: works.filter(work => normalizeGenres(work.genres ?? work.genre).includes(genre))
  }))
    .filter(item => item.works.length > 0)
    .map(item => ({
      genre: item.genre,
      count: item.works.length,
      average: Math.round(
        item.works.reduce(
          (sum, work) => sum + average(work.scores),
          0
        ) / item.works.length
      )
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.average - a.average;
    });

  const favoriteGenres = genreCounts.slice(0, 3);
  const highRatedWorks = works.filter(work => average(work.scores) >= 85);
  const totalEpisodes = works.reduce(
    (sum, work) => sum + Math.max(0, Number(work.episodes || 0)),
    0
  );

  const preferenceSentence =
    strongest && secondStrongest
      ? `特に「${strongest.label}」と「${secondStrongest.label}」を高く評価する傾向があります。`
      : "";

  const strictSentence =
    strictest
      ? `一方、「${strictest.label}」の平均は${strictest.value}点で、6観点の中では最も厳しく評価しています。`
      : "";

  const genreSentence = favoriteGenres.length
    ? `視聴数が多いジャンルは${favoriteGenres
        .map(item => `「${item.genre}」${item.count}作品`)
        .join("、")}です。`
    : "ジャンル傾向を出すには、作品へジャンルを設定してください。";

  const recommendation =
    strongest?.key === "story"
      ? "物語構成や伏線回収、人間関係が緻密な作品との相性が良さそうです。"
      : strongest?.key === "visual"
        ? "映像表現やアクション、音響に力を入れた作品との相性が良さそうです。"
        : strongest?.key === "emotion" || strongest?.key === "moving"
          ? "人物の感情を丁寧に描き、心を強く動かす作品との相性が良さそうです。"
          : strongest?.key === "theme"
            ? "現実へ持ち帰れる教訓やメッセージ性のある作品との相性が良さそうです。"
            : "テンポが良く、繰り返し視聴したくなる作品との相性が良さそうです。";

  return {
    headline: `あなたの視聴傾向：${strongest?.label || "分析中"}重視`,
    paragraphs: [
      topWork
        ? `現在の総合1位は「${topWork.title}」で、平均${average(topWork.scores)}点です。`
        : "",
      `${preferenceSentence}${strictSentence}`,
      `${genreSentence}${recommendation}`
    ].filter(Boolean),
    facts: [
      `${works.length}作品を登録`,
      `${totalEpisodes}話を視聴`,
      `85点以上：${highRatedWorks.length}作品`
    ]
  };
}

function renderAiSummary() {
  const summary = buildAiSummary();

  aiSummary.innerHTML = `
    <div class="insight-heading">
      <span class="insight-mark" aria-hidden="true">✦</span>
      <strong>${escapeHtml(summary.headline)}</strong>
    </div>
    <div class="insight-copy">
      ${summary.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
    ${summary.facts.length
      ? `<div class="insight-facts">${summary.facts
          .map(fact => `<span>${escapeHtml(fact)}</span>`)
          .join("")}</div>`
      : ""}
  `;
}

function renderStatistics() {
  const totalEpisodes = works.reduce(
    (sum, work) => sum + Math.max(0, Number(work.episodes || 0)),
    0
  );
  const totalMinutes = totalEpisodes * 25;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  totalWorksStat.textContent = works.length;
  totalEpisodesStat.textContent = totalEpisodes;
  totalWatchTimeStat.textContent =
    minutes ? `${hours}時間${minutes}分` : `${hours}時間`;

  const genreCounts = GENRES.map(genre => ({
    genre,
    count: works.filter(work => normalizeGenres(work.genres ?? work.genre).includes(genre)).length
  }));

  const renderGenreGroup = items => items.map(item => `
    <div class="genre-count-item">
      <span>${escapeHtml(item.genre)}</span>
      <strong>${item.count}</strong>
    </div>
  `).join("");

  genreStatsFirst.innerHTML = renderGenreGroup(genreCounts.slice(0, 10));
  genreStatsSecond.innerHTML = renderGenreGroup(genreCounts.slice(10, 20));
  renderAiSummary();
}

function showRadarTooltip(event, category, selectedWorks) {
  if (!radarTooltip) return;

  const categoryIndex = CATEGORIES.findIndex(
    item => item.key === category.key
  );

  const rows = selectedWorks.map((work, index) => {
    const score = effectiveScoreValue(work, category.key);
    const color = COLORS[index % COLORS.length];

    return `
      <span class="radar-tooltip-row">
        <i style="background:${color}"></i>
        <b>${escapeHtml(work.title)}</b>
        <strong>${score}点</strong>
      </span>
    `;
  }).join("");

  radarTooltip.innerHTML = `
    <span class="radar-tooltip-category">${escapeHtml(category.label)}</span>
    ${rows}
  `;
  radarTooltip.classList.remove("hidden");

  const wrapRect = chartWrap.getBoundingClientRect();
  const tooltipWidth = radarTooltip.offsetWidth || 220;
  const tooltipHeight = radarTooltip.offsetHeight || 120;

  const rawLeft = event.clientX - wrapRect.left + 14;
  const rawTop = event.clientY - wrapRect.top + 14;
  const maxLeft = Math.max(8, wrapRect.width - tooltipWidth - 8);
  const maxTop = Math.max(8, wrapRect.height - tooltipHeight - 8);

  radarTooltip.style.left = `${Math.max(8, Math.min(rawLeft, maxLeft))}px`;
  radarTooltip.style.top = `${Math.max(8, Math.min(rawTop, maxTop))}px`;
}

function hideRadarTooltip() {
  radarTooltip?.classList.add("hidden");
}

function renderChart() {
  const selectedWorks = works.filter(work => selectedIds.has(work.id));
  const visibleWorks = selectedWorks.filter(work => !hiddenRadarIds.has(work.id));
  chartWrap.classList.toggle("hidden", selectedWorks.length === 0);

  if (!selectedWorks.length) {
    radarChart.innerHTML = "";
    legend.innerHTML = "";
    hideRadarTooltip();
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
    const element = document.createElementNS(ns, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (text != null) element.textContent = text;
    radarChart.appendChild(element);
    return element;
  };

  append("rect", { x: 0, y: 0, width: 760, height: 620, fill: "transparent" });

  for (let level = 1; level <= levels; level += 1) {
    const levelRadius = radius * (level / levels);
    const points = CATEGORIES.map((_, index) => point(index, levelRadius).join(",")).join(" ");
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
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      stroke: "#e0e4ec",
      "stroke-width": 1
    });

    const [labelX, labelY] = point(index, labelRadius);
    const anchor = labelX < cx - 12 ? "end" : labelX > cx + 12 ? "start" : "middle";
    append("text", {
      x: labelX,
      y: labelY,
      "text-anchor": anchor,
      "dominant-baseline": "middle",
      fill: "#4f5967",
      "font-size": 15,
      "font-weight": 700
    }, category.label);
  });

  [20, 40, 60, 80, 100].forEach(value => {
    append("text", {
      x: cx + 7,
      y: cy - radius * (value / 100) + 5,
      fill: "#9aa3af",
      "font-size": 11
    }, String(value));
  });

  visibleWorks.forEach((work, workIndex) => {
    const color = COLORS[workIndex % COLORS.length];
    const values = scoreValues(work.scores);
    const points = values.map((score, index) =>
      point(index, radius * (score / 100)).join(",")
    ).join(" ");

    append("polygon", {
      points,
      fill: color,
      "fill-opacity": visibleWorks.length <= 4 ? 0.1 : 0.035,
      stroke: color,
      "stroke-opacity": visibleWorks.length <= 4 ? 0.92 : 0.66,
      "stroke-width": visibleWorks.length <= 4 ? 2.6 : 1.7,
      "stroke-linejoin": "round"
    });

    values.forEach((score, index) => {
      const [x, y] = point(index, radius * (score / 100));
      const offset = (workIndex - (visibleWorks.length - 1) / 2) * 2.4;
      const angle = startAngle + index * angleStep;
      const displayX = x + Math.cos(angle + Math.PI / 2) * offset;
      const displayY = y + Math.sin(angle + Math.PI / 2) * offset;

      const pointCircle = append("circle", {
        cx: displayX,
        cy: displayY,
        r: 7,
        fill: "#ffffff",
        stroke: color,
        "stroke-width": 3,
        tabindex: 0,
        role: "button",
        "aria-label": `${work.title} ${CATEGORIES[index].label} ${score}点`,
        class: "radar-point"
      });

      pointCircle.addEventListener("mouseenter", event => {
        showRadarTooltip(event, CATEGORIES[index], visibleWorks);
      });
      pointCircle.addEventListener("mousemove", event => {
        showRadarTooltip(event, CATEGORIES[index], visibleWorks);
      });
      pointCircle.addEventListener("mouseleave", hideRadarTooltip);
      pointCircle.addEventListener("focus", event => {
        const rect = event.currentTarget.getBoundingClientRect();
        showRadarTooltip(
          { clientX: rect.left + rect.width / 2, clientY: rect.top },
          CATEGORIES[index],
          selectedWorks
        );
      });
      pointCircle.addEventListener("blur", hideRadarTooltip);
    });
  });

  legend.innerHTML = selectedWorks.map((work, index) => {
    const hidden = hiddenRadarIds.has(work.id);
    return `
      <button
        type="button"
        class="legend-item legend-toggle${hidden ? " is-hidden" : ""}"
        data-work-id="${escapeHtml(work.id)}"
        aria-pressed="${String(!hidden)}"
        title="${hidden ? "チャートへ表示" : "チャートから一時的に非表示"}"
      >
        <span class="legend-swatch" style="background:${COLORS[index % COLORS.length]}"></span>
        <span>${escapeHtml(work.title)}（平均 ${average(effectiveScores(work))}）</span>
      </button>
    `;
  }).join("");

  legend.querySelectorAll(".legend-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const workId = button.dataset.workId;

      if (hiddenRadarIds.has(workId)) {
        hiddenRadarIds.delete(workId);
      } else {
        hiddenRadarIds.add(workId);
      }

      renderChart();
    });
  });
}

function splitGenres(value) {
  return normalizeGenres(value);
}

function compareByScoreThenTitle(a, b) {
  const scoreDifference = average(b.scores) - average(a.scores);
  if (scoreDifference !== 0) return scoreDifference;
  return a.title.localeCompare(b.title, "ja");
}

function rankingItemHtml(work, index, scoreValue, scoreLabel, rankNumber = index + 1) {
  const title = String(work?.title ?? "作品名未設定");
  const genres = normalizeGenres(work?.genres ?? work?.genre).join("・");
  const numericScore = Number(scoreValue);
  const displayScore = Number.isFinite(numericScore) ? Math.round(numericScore) : "―";

  return `
    <li class="ranking-item">
      <span class="ranking-position">${rankNumber}</span>
      <div class="ranking-work">
        <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
        <span title="${escapeHtml(genres)}">${escapeHtml(genres)}</span>
      </div>
      <div class="ranking-score">
        <strong>${displayScore}</strong>
        <span>${escapeHtml(String(scoreLabel || "点数"))}</span>
      </div>
    </li>
  `;
}

function availableGenres() {
  return [...new Set(works.flatMap(work => normalizeGenres(work.genres ?? work.genre)))]
    .sort((a, b) => {
      if (a === "未設定") return 1;
      if (b === "未設定") return -1;
      return a.localeCompare(b, "ja");
    });
}

function updateGenreOptions(genres) {
  const previousValue = genreRankingSelect.value;
  genreRankingSelect.innerHTML = genres
    .map(genre => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`)
    .join("");

  if (genres.includes(previousValue)) {
    genreRankingSelect.value = previousValue;
  } else if (genres.length) {
    genreRankingSelect.value = genres[0];
  }

  genreRankingSelect.disabled = genres.length === 0;
}



function compareByCategoryThenAverageThenTitle(categoryKey) {
  return (a, b) => {
    const categoryDifference =
      scoreValue(b.scores, categoryKey) - scoreValue(a.scores, categoryKey);
    if (categoryDifference !== 0) return categoryDifference;

    const averageDifference = average(b.scores) - average(a.scores);
    if (averageDifference !== 0) return averageDifference;

    return a.title.localeCompare(b.title, "ja");
  };
}

function renderRankingList({
  listElement,
  toggleButton,
  items,
  expanded,
  scoreResolver,
  scoreLabelResolver
}) {
  updateToggleButton(
    toggleButton,
    items.length,
    expanded,
    "すべて表示",
    "3件表示に戻す"
  );

  const visibleItems = expanded
    ? items
    : items.slice(0, DEFAULT_VISIBLE_COUNT);

  listElement.innerHTML = visibleItems
    .map((work, index) => rankingItemHtml(
      work,
      index,
      scoreResolver(work),
      scoreLabelResolver(work)
    ))
    .join("");
}

async function saveLibraryDrafts() {
  if (!libraryDrafts.size || librarySaveInProgress) return;
  librarySaveInProgress=true; updateLibrarySaveBar();
  try {
    const changed=works.filter(w=>libraryDrafts.has(w.id)), updatedAt=new Date().toISOString();
    if (IS_LOCAL) {
      changed.forEach(w=>{const d=libraryDrafts.get(w.id);Object.assign(w,{title:d.title,episodes:d.episodes,genres:[...d.genres],genre:d.genres.join("、"),scores:{...d.scores},updatedAt});});
      libraryDrafts.clear(); refreshLocalWorks(`作品一覧から${changed.length}作品を保存しました。`);
    } else {
      const batch=writeBatch(db);
      changed.forEach(w=>{const d=libraryDrafts.get(w.id);batch.set(reviewDocument(w.id),{title:d.title,episodes:d.episodes,genres:[...d.genres],genre:d.genres.join("、"),scores:{...d.scores},schemaVersion:SCHEMA_VERSION,updatedAt},{merge:true});});
      await batch.commit();
      changed.forEach(w=>{const d=libraryDrafts.get(w.id);Object.assign(w,{title:d.title,episodes:d.episodes,genres:[...d.genres],genre:d.genres.join("、"),scores:{...d.scores},updatedAt});});
      libraryDrafts.clear(); renderAll(); setSyncStatus(`作品一覧から${changed.length}作品を保存しました。`,"success");
    }
  } catch(error) { console.error(error); alert(`保存に失敗しました：${friendlyError(error)}`); setSyncStatus(`保存に失敗しました：${friendlyError(error)}`,"error"); }
  finally { librarySaveInProgress=false; updateLibrarySaveBar(); }
}
function discardLibraryDrafts() { libraryDrafts.clear(); renderLibrary(); }

function renderRankings() {
  const sortedWorks = [...works].sort(compareByScoreThenTitle);
  overallRankingCount.textContent = `${sortedWorks.length}作品`;

  renderRankingList({
    listElement: overallRanking,
    toggleButton: overallRankingToggle,
    items: sortedWorks,
    expanded: showAllOverall,
    scoreResolver: work => average(work.scores),
    scoreLabelResolver: () => "平均点"
  });
  overallRankingEmpty.classList.toggle("hidden", sortedWorks.length > 0);
  overallRanking.classList.toggle("hidden", sortedWorks.length === 0);

  const genres = availableGenres();
  const currentOptions = [...genreRankingSelect.options].map(option => option.value);
  if (JSON.stringify(currentOptions) !== JSON.stringify(genres)) {
    updateGenreOptions(genres);
  }

  const selectedGenre = genreRankingSelect.value;
  const genreWorks = selectedGenre
    ? works
        .filter(work => normalizeGenres(work.genres ?? work.genre).includes(selectedGenre))
        .sort(compareByScoreThenTitle)
    : [];

  genreRankingCount.textContent = selectedGenre
    ? `${selectedGenre}：${genreWorks.length}作品`
    : "0作品";
  renderRankingList({
    listElement: genreRanking,
    toggleButton: genreRankingToggle,
    items: genreWorks,
    expanded: showAllGenre,
    scoreResolver: work => average(work.scores),
    scoreLabelResolver: () => "平均点"
  });
  genreRankingEmpty.textContent = genres.length
    ? "このジャンルの作品はまだありません。"
    : "ジャンルを設定した作品を登録してください。";
  genreRankingEmpty.classList.toggle("hidden", genreWorks.length > 0);
  genreRanking.classList.toggle("hidden", genreWorks.length === 0);


}

function updateSummary() {
  // Ver4では集計値をrenderStatistics()で描画します。
}

function renderAll() {
  renderComparisonPicker();
  renderScoreComparisonTable();
  renderLibrary();
  renderChart();
  renderCategoryRankingCards();
  renderRankings();
  renderStatistics();
  updateSummary();
}

async function migrateFirestoreDocuments(items) {
  if (IS_LOCAL || !db || !items.length) return;

  for (let start = 0; start < items.length; start += 400) {
    const batch = writeBatch(db);

    items.slice(start, start + 400).forEach(({ work }) => {
      batch.set(
        reviewDocument(work.id),
        {
          scores: work.scores,
          schemaVersion: SCHEMA_VERSION
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  setSyncStatus(
    `旧10項目データ${items.length}作品を6項目形式へ移行しました。`,
    "success"
  );
}

function subscribeReviews(uid) {
  if (unsubscribeReviews) unsubscribeReviews();

  setSyncStatus("Firestoreからデータを読み込んでいます…");
  unsubscribeReviews = onSnapshot(
    reviewsCollection(uid),
    snapshot => {
      const normalizedDocuments = snapshot.docs.map(documentSnapshot => {
        const raw = {
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        };
        return {
          raw,
          work: normalizeWork(raw, documentSnapshot.id)
        };
      });

      works = normalizedDocuments
        .map(item => item.work)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

      const legacyDocuments = normalizedDocuments.filter(
        item =>
          Array.isArray(item.raw.scores) ||
          item.raw.schemaVersion !== SCHEMA_VERSION
      );

      if (legacyDocuments.length) {
        migrateFirestoreDocuments(legacyDocuments).catch(error => {
          console.error("旧データの移行に失敗しました。", error);
          setSyncStatus(
            `表示は変換済みですが、Firestoreへの移行保存に失敗しました：${friendlyError(error)}`,
            "error"
          );
        });
      }

      const existingIds = new Set(works.map(work => work.id));
      selectedIds = new Set([...selectedIds].filter(id => existingIds.has(id)));
      renderAll();
      setSyncStatus(`同期済み：${works.length}作品`, "success");
    },
    error => {
      console.error(error);
      setSyncStatus(`同期に失敗しました：${friendlyError(error)}`, "error");
    }
  );
}

function renderUser(user) {
  userName.textContent = user.displayName || "Googleユーザー";
  userEmail.textContent = user.email || "";

  if (user.photoURL) {
    userPhoto.src = user.photoURL;
    userPhoto.alt = `${user.displayName || "ユーザー"}のプロフィール画像`;
    userPhoto.classList.remove("hidden");
  } else {
    userPhoto.removeAttribute("src");
    userPhoto.classList.add("hidden");
  }
}



async function loginWithGoogle() {
  if (!auth) return;

  loginBtn.disabled = true;
  setLoginStatus("Googleログインを開始しています…");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    // PC・スマホともにポップアップ方式を使用します。
    // GitHub Pages と Firebase のドメインが異なる環境では、
    // モバイルのリダイレクト認証がブラウザのストレージ制限を受けるためです。
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    setLoginStatus(`ログインに失敗しました：${friendlyError(error)}`, true);
  } finally {
    loginBtn.disabled = false;
  }
}

function friendlyError(error) {
  const messages = {
    "auth/unauthorized-domain": "このGitHub PagesドメインがFirebase Authenticationで許可されていません。",
    "auth/popup-blocked": "ログイン画面のポップアップがブロックされました。",
    "auth/popup-closed-by-user": "ログイン画面が閉じられました。",
    "auth/network-request-failed": "ネットワーク接続を確認してください。",
    "permission-denied": "Firestoreのセキュリティルールにより拒否されました。",
    "failed-precondition": "Firestoreの設定が完了していない可能性があります。",
    "unavailable": "Firebaseへ接続できません。時間を置いて再度お試しください。"
  };

  return messages[error?.code] || error?.message || "不明なエラーです。";
}

loginBtn.addEventListener("click", loginWithGoogle);

logoutBtn.addEventListener("click", async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    alert(`ログアウトに失敗しました：${friendlyError(error)}`);
  }
});

async function initializeApplication() {
  initializeStaticUi();
  renderAll();

  if (IS_LOCAL) {
    currentUser = {
      uid: "local-development-user",
      displayName: "ローカル開発モード",
      email: "データはこのブラウザ内に保存されます",
      photoURL: ""
    };
    works = loadLocalWorks();
    saveLocalWorks();
    renderUser(currentUser);
    logoutBtn.classList.add("hidden");
    showAppScreen();
    renderAll();
    setSyncStatus(`ローカル開発モード：${works.length}作品をブラウザ内に保存中`, "local");
    return;
  }

  showLoginScreen();

  try {
    await loadFirebaseConfig();

    if (!isFirebaseConfigured()) {
      loginBtn.disabled = true;
      configHelp.classList.remove("hidden");
      setLoginStatus("firebase-config.jsを設定してください。", true);
      return;
    }

    await loadFirebaseModules();
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    db = getFirestore(app);

    onAuthStateChanged(auth, user => {
      if (user) {
        currentUser = user;
        setLoginStatus("");
        renderUser(user);
        showAppScreen();
        subscribeReviews(user.uid);
      } else {
        currentUser = null;
        works = [];
        selectedIds.clear();
        resetForm();
        renderAll();

        if (unsubscribeReviews) {
          unsubscribeReviews();
          unsubscribeReviews = null;
        }

        showLoginScreen();
        setLoginStatus("");
      }
    });
  } catch (error) {
    console.error(error);
    loginBtn.disabled = true;
    configHelp.classList.remove("hidden");
    const message = error?.message?.includes("firebase-config.js")
      ? "firebase-config.jsを読み込めません。GitHub上の配置を確認してください。"
      : `Firebaseの初期化に失敗しました：${friendlyError(error)}`;
    setLoginStatus(message, true);
  }
}

function bindUiEvents() {
  searchInput?.addEventListener("input", renderLibrary);
  libraryGenreFilter?.addEventListener("change", renderLibrary);
  librarySaveBtn?.addEventListener("click", saveLibraryDrafts);
  libraryDiscardBtn?.addEventListener("click", discardLibraryDrafts);
  comparisonSaveBtn?.addEventListener("click", saveComparisonDrafts);
  comparisonDiscardBtn?.addEventListener("click", discardComparisonDrafts);

  CATEGORY_KEYS.forEach(categoryKey => {
    const toggle = document.getElementById(`categoryToggle-${categoryKey}`);
    const ascButton = document.getElementById(`categoryAsc-${categoryKey}`);
    const descButton = document.getElementById(`categoryDesc-${categoryKey}`);
    const approxClearButton = document.getElementById(
      `categoryApproxClear-${categoryKey}`
    );

    toggle?.addEventListener("click", () => {
      categoryRankingExpanded[categoryKey] =
        !categoryRankingExpanded[categoryKey];
      renderCategoryRankingCards();
    });

    ascButton?.addEventListener("click", () => {
      categoryRankingOrder[categoryKey] = "asc";
      categoryRankingExpanded[categoryKey] = false;
      renderCategoryRankingCards();
    });

    descButton?.addEventListener("click", () => {
      categoryRankingOrder[categoryKey] = "desc";
      categoryRankingExpanded[categoryKey] = false;
      renderCategoryRankingCards();
    });

    approxClearButton?.addEventListener("click", () => {
      clearCategoryApproximation(categoryKey);
    });
  });

  compareSearchInput?.addEventListener("input", renderCompareSearchResults);

  compareSearchInput?.addEventListener("focus", () => {
    if (compareSearchInput.value.trim()) {
      renderCompareSearchResults();
    }
  });

  document.addEventListener("click", event => {
    if (
      !compareSearchResults.contains(event.target) &&
      event.target !== compareSearchInput
    ) {
      compareSearchResults.classList.add("hidden");
    }
  });

  overallRankingToggle?.addEventListener("click", () => {
    showAllOverall = !showAllOverall;
    renderRankings();
  });

  genreRankingToggle?.addEventListener("click", () => {
    showAllGenre = !showAllGenre;
    renderRankings();
  });




}

bindUiEvents();
initializeApplication();
