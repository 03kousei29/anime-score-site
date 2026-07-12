import { firebaseConfig } from "./firebase-config.js";

const IS_LOCAL = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
const LOCAL_STORAGE_KEY = "anime-score-lab-v2-dev";

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

let works = [];
let selectedIds = new Set();
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
const saveBtn = document.getElementById("saveBtn");
const importInput = document.getElementById("importInput");
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
  saveLocalWorks();
  renderAll();
  setSyncStatus(message, "local");
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

function normalizeWork(item, fallbackId = crypto.randomUUID()) {
  return {
    id: String(item.id || fallbackId),
    title: String(item.title || "").trim(),
    genre: String(item.genre || "").trim(),
    memo: String(item.memo || "").trim(),
    scores: CATEGORIES.map((_, index) =>
      Math.max(0, Math.min(100, Number(item.scores?.[index] ?? 0)))
    ),
    updatedAt: typeof item.updatedAt === "string"
      ? item.updatedAt
      : new Date().toISOString()
  };
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

    range.addEventListener("input", () => {
      number.value = range.value;
    });

    number.addEventListener("input", () => {
      const value = Math.max(0, Math.min(100, Number(number.value || 0)));
      number.value = value;
      range.value = value;
    });

    scoreInputs.appendChild(row);
  });
}

function getScores() {
  return CATEGORIES.map((_, index) =>
    Math.max(
      0,
      Math.min(
        100,
        Number(document.getElementById(`number-${index}`).value || 0)
      )
    )
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
    genre: genreInput.value,
    memo: memoInput.value,
    scores: getScores(),
    updatedAt: new Date().toISOString()
  });

  if (!work.title) return;

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
        genre: work.genre,
        memo: work.memo,
        scores: work.scores,
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
  renderAll();
});

searchInput.addEventListener("input", renderLibrary);
genreRankingSelect.addEventListener("change", renderRankings);

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
  const queryText = searchInput.value.trim().toLowerCase();
  const filtered = works.filter(work =>
    `${work.title} ${work.genre}`.toLowerCase().includes(queryText)
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
    ).join("") + (work.memo
      ? `<div class="detail-line" style="grid-column:1/-1"><span>メモ</span><strong>${escapeHtml(work.memo)}</strong></div>`
      : "");

    card.querySelector(".detail-btn").addEventListener("click", event => {
      details.classList.toggle("hidden");
      event.currentTarget.textContent = details.classList.contains("hidden") ? "詳細" : "閉じる";
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      editingId.value = work.id;
      titleInput.value = work.title;
      genreInput.value = work.genre;
      memoInput.value = work.memo;
      setScores(work.scores);
      saveBtn.textContent = "変更を保存";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      if (!confirm(`「${work.title}」を削除しますか？`)) return;

      setSyncStatus(IS_LOCAL ? "ローカルデータを削除しています…" : "Firestoreから削除しています…");
      try {
        if (IS_LOCAL) {
          works = works.filter(item => item.id !== work.id);
          selectedIds.delete(work.id);
          refreshLocalWorks(`ローカル保存済み：${works.length}作品`);
        } else {
          await deleteDoc(reviewDocument(work.id));
          selectedIds.delete(work.id);
          setSyncStatus("削除しました。", "success");
        }
      } catch (error) {
        console.error(error);
        setSyncStatus(`削除に失敗しました：${friendlyError(error)}`, "error");
        alert(`削除に失敗しました：${friendlyError(error)}`);
      }
    });

    animeList.appendChild(card);
  });
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
        cx: x,
        cy: y,
        r: 4.5,
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

function splitGenres(genreText) {
  const genres = String(genreText || "")
    .split(/[、,，/／|｜]+/)
    .map(genre => genre.trim())
    .filter(Boolean);

  return genres.length ? [...new Set(genres)] : ["未設定"];
}

function compareByScoreThenTitle(a, b) {
  const scoreDifference = average(b.scores) - average(a.scores);
  if (scoreDifference !== 0) return scoreDifference;
  return a.title.localeCompare(b.title, "ja");
}

function rankingItemHtml(work, index) {
  const genres = splitGenres(work.genre).join("・");
  return `
    <li class="ranking-item">
      <span class="ranking-position">${index + 1}</span>
      <div class="ranking-work">
        <strong title="${escapeHtml(work.title)}">${escapeHtml(work.title)}</strong>
        <span title="${escapeHtml(genres)}">${escapeHtml(genres)}</span>
      </div>
      <div class="ranking-score">
        <strong>${average(work.scores)}</strong>
        <span>平均点</span>
      </div>
    </li>
  `;
}

function availableGenres() {
  return [...new Set(works.flatMap(work => splitGenres(work.genre)))]
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

function renderRankings() {
  const sortedWorks = [...works].sort(compareByScoreThenTitle);
  overallRankingCount.textContent = `${sortedWorks.length}作品`;
  overallRanking.innerHTML = sortedWorks.slice(0, 10).map(rankingItemHtml).join("");
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
        .filter(work => splitGenres(work.genre).includes(selectedGenre))
        .sort(compareByScoreThenTitle)
    : [];

  genreRankingCount.textContent = selectedGenre
    ? `${selectedGenre}：${genreWorks.length}作品`
    : "0作品";
  genreRanking.innerHTML = genreWorks.slice(0, 10).map(rankingItemHtml).join("");
  genreRankingEmpty.textContent = genres.length
    ? "このジャンルの作品はまだありません。"
    : "ジャンルを設定した作品を登録してください。";
  genreRankingEmpty.classList.toggle("hidden", genreWorks.length > 0);
  genreRanking.classList.toggle("hidden", genreWorks.length === 0);
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
  renderRankings();
  updateSummary();
}

function subscribeReviews(uid) {
  if (unsubscribeReviews) unsubscribeReviews();

  setSyncStatus("Firestoreからデータを読み込んでいます…");
  unsubscribeReviews = onSnapshot(
    reviewsCollection(uid),
    snapshot => {
      works = snapshot.docs
        .map(documentSnapshot => normalizeWork({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        }, documentSnapshot.id))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(works, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `anime-score-data-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file || !currentUser) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error("JSONの形式が正しくありません。");

    const valid = imported
      .filter(item =>
        item &&
        typeof item.title === "string" &&
        item.title.trim() &&
        Array.isArray(item.scores) &&
        item.scores.length === CATEGORIES.length
      )
      .map(item => normalizeWork(item));

    if (!valid.length) throw new Error("読み込める作品データがありません。");
    const destination = IS_LOCAL ? "ローカルデータ" : "Firestore";
    if (!confirm(`${valid.length}作品を${destination}へ追加・上書きしますか？`)) return;

    setSyncStatus(`${valid.length}作品を${destination}へ読み込んでいます…`);

    if (IS_LOCAL) {
      const merged = new Map(works.map(work => [work.id, work]));
      valid.forEach(work => merged.set(work.id, work));
      works = [...merged.values()];
      selectedIds.clear();
      refreshLocalWorks(`ローカル保存済み：${works.length}作品`);
    } else {
      // Firestoreのバッチ上限に余裕を持たせ、400件ずつ処理します。
      for (let start = 0; start < valid.length; start += 400) {
        const batch = writeBatch(db);
        valid.slice(start, start + 400).forEach(work => {
          batch.set(reviewDocument(work.id), {
            title: work.title,
            genre: work.genre,
            memo: work.memo,
            scores: work.scores,
            updatedAt: work.updatedAt
          });
        });
        await batch.commit();
      }
      selectedIds.clear();
      setSyncStatus(`${valid.length}作品を読み込みました。`, "success");
    }

    alert(`${valid.length}作品を${destination}へ読み込みました。`);
  } catch (error) {
    console.error(error);
    setSyncStatus(`読み込みに失敗しました：${friendlyError(error)}`, "error");
    alert(`読み込みに失敗しました：${friendlyError(error)}`);
  } finally {
    event.target.value = "";
  }
});

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
  createScoreInputs();
  renderAll();

  if (IS_LOCAL) {
    currentUser = {
      uid: "local-development-user",
      displayName: "ローカル開発モード",
      email: "データはこのブラウザ内に保存されます",
      photoURL: ""
    };
    works = loadLocalWorks();
    renderUser(currentUser);
    logoutBtn.classList.add("hidden");
    showAppScreen();
    renderAll();
    setSyncStatus(`ローカル開発モード：${works.length}作品をブラウザ内に保存中`, "local");
    return;
  }

  showLoginScreen();

  if (!isFirebaseConfigured()) {
    loginBtn.disabled = true;
    configHelp.classList.remove("hidden");
    setLoginStatus("firebase-config.jsを設定してください。", true);
    return;
  }

  try {
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
    setLoginStatus(`Firebaseの初期化に失敗しました：${friendlyError(error)}`, true);
  }
}

initializeApplication();
