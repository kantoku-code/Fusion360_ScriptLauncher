const ANIMATION_MS = 150;
const TOOLTIP_DELAY_MS = 500;
const treeEl = document.getElementById("tree");
const toolbarEl = document.querySelector(".tv-toolbar");
const ctxMenuEl = document.getElementById("ctx-menu");
const tooltipEl = document.getElementById("tooltip");
const searchEl = document.getElementById("search");
const SEARCH_DELAY_MS = 150;
const SETTINGS_ANIMATION_MS = 200;
const settingsEl = document.getElementById("settings");
const settingsPanelEl = settingsEl.querySelector(".settings-panel");
const settingsCloseEl = settingsEl.querySelector(".settings-close");
const settingsBtnEl = toolbarEl.querySelector('.tv-btn[data-cmd="settings"]');

// ---- i18n ----（キーは manifest と同じ LCID）
const I18N = {
  1033: { search: "Search (* ? allowed)", expandAll: "Expand All", collapseAll: "Collapse All", openFolder: "Open Folder", settings: "Settings",
    theme: "Color Theme", themeLight: "Light", themeDark: "Dark", transparent: "Transparent background when not hovered" },
  2052: { search: "搜索 (可使用 * ?)", expandAll: "全部展开", collapseAll: "全部折叠", openFolder: "打开文件夹", settings: "设置",
    theme: "颜色主题", themeLight: "浅色", themeDark: "深色", transparent: "鼠标未悬停时背景透明" },
  1028: { search: "搜尋 (可使用 * ?)", expandAll: "全部展開", collapseAll: "全部摺疊", openFolder: "開啟資料夾", settings: "設定",
    theme: "色彩佈景主題", themeLight: "淺色", themeDark: "深色", transparent: "滑鼠未停留時背景透明" },
  1029: { search: "Hledat (lze použít * ?)", expandAll: "Rozbalit vše", collapseAll: "Sbalit vše", openFolder: "Otevřít složku", settings: "Nastavení",
    theme: "Barevný motiv", themeLight: "Světlý", themeDark: "Tmavý", transparent: "Průhledné pozadí bez najetí myší" },
  1036: { search: "Rechercher (* ? autorisés)", expandAll: "Tout développer", collapseAll: "Tout réduire", openFolder: "Ouvrir le dossier", settings: "Paramètres",
    theme: "Thème de couleur", themeLight: "Clair", themeDark: "Sombre", transparent: "Arrière-plan transparent hors survol" },
  1031: { search: "Suchen (* ? möglich)", expandAll: "Alle erweitern", collapseAll: "Alle reduzieren", openFolder: "Ordner öffnen", settings: "Einstellungen",
    theme: "Farbschema", themeLight: "Hell", themeDark: "Dunkel", transparent: "Transparenter Hintergrund ohne Mauszeiger" },
  1038: { search: "Keresés (* ? használható)", expandAll: "Összes kibontása", collapseAll: "Összes összecsukása", openFolder: "Mappa megnyitása", settings: "Beállítások",
    theme: "Színtéma", themeLight: "Világos", themeDark: "Sötét", transparent: "Átlátszó háttér, ha nincs fölötte az egér" },
  1040: { search: "Cerca (* ? consentiti)", expandAll: "Espandi tutto", collapseAll: "Comprimi tutto", openFolder: "Apri cartella", settings: "Impostazioni",
    theme: "Tema colori", themeLight: "Chiaro", themeDark: "Scuro", transparent: "Sfondo trasparente senza passaggio del mouse" },
  1041: { search: "検索 (* ? 使用可)", expandAll: "すべて展開", collapseAll: "すべて折りたたみ", openFolder: "フォルダオープン", settings: "設定",
    theme: "カラーテーマ", themeLight: "ライト", themeDark: "ダーク", transparent: "非ホバー時に背景を透明にする" },
  1042: { search: "검색 (* ? 사용 가능)", expandAll: "모두 펼치기", collapseAll: "모두 접기", openFolder: "폴더 열기", settings: "설정",
    theme: "색 테마", themeLight: "라이트", themeDark: "다크", transparent: "마우스가 없을 때 배경 투명" },
  1045: { search: "Szukaj (można użyć * ?)", expandAll: "Rozwiń wszystko", collapseAll: "Zwiń wszystko", openFolder: "Otwórz folder", settings: "Ustawienia",
    theme: "Motyw kolorów", themeLight: "Jasny", themeDark: "Ciemny", transparent: "Przezroczyste tło bez najechania myszą" },
  1046: { search: "Pesquisar (* ? permitidos)", expandAll: "Expandir tudo", collapseAll: "Recolher tudo", openFolder: "Abrir pasta", settings: "Configurações",
    theme: "Tema de cores", themeLight: "Claro", themeDark: "Escuro", transparent: "Fundo transparente sem o mouse sobre" },
  1049: { search: "Поиск (можно * ?)", expandAll: "Развернуть все", collapseAll: "Свернуть все", openFolder: "Открыть папку", settings: "Настройки",
    theme: "Цветовая тема", themeLight: "Светлая", themeDark: "Тёмная", transparent: "Прозрачный фон без наведения мыши" },
  1034: { search: "Buscar (se permite * ?)", expandAll: "Expandir todo", collapseAll: "Contraer todo", openFolder: "Abrir carpeta", settings: "Configuración",
    theme: "Tema de color", themeLight: "Claro", themeDark: "Oscuro", transparent: "Fondo transparente sin el ratón encima" },
  1055: { search: "Ara (* ? kullanılabilir)", expandAll: "Tümünü genişlet", collapseAll: "Tümünü daralt", openFolder: "Klasörü aç", settings: "Ayarlar",
    theme: "Renk teması", themeLight: "Açık", themeDark: "Koyu", transparent: "Fare üzerinde değilken saydam arka plan" },
};

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N[1033];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const s = dict[el.dataset.i18n];
    if (s) el.textContent = s;
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const s = dict[el.dataset.i18nTitle];
    if (s) el.dataset.tooltip = s;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const s = dict[el.dataset.i18nPlaceholder];
    if (s) el.placeholder = s;
  });
}

// ---- render ----
function createNode(item, depth) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  const li = document.createElement("li");
  li.className = "tv-node";
  li.setAttribute("role", "treeitem");
  if (item.id !== undefined) li.dataset.id = String(item.id);

  const row = document.createElement("div");
  row.className = "tv-row";
  row.tabIndex = -1;
  row.style.setProperty("--depth", depth);
  if (item.description) row.dataset.description = item.description;

  const twisty = document.createElement("span");
  twisty.className = "tv-twisty";
  row.appendChild(twisty);

  if (item.icon) {
    const icon = document.createElement("img");
    icon.className = "tv-icon";
    icon.src = item.icon;
    icon.alt = "";
    icon.draggable = false;
    row.appendChild(icon);
  }

  const label = document.createElement("span");
  label.className = "tv-label";
  label.textContent = item.text || "";
  row.appendChild(label);

  li.appendChild(row);

  if (hasChildren) {
    li.classList.add("is-parent");
    li.setAttribute("aria-expanded", "false");
    li.appendChild(createChildren(item.children, depth + 1, "tv-children"));
  }
  return li;
}

function createChildren(items, depth, className) {
  const ul = document.createElement("ul");
  ul.className = className;
  ul.setAttribute("role", "group");
  ul.style.setProperty("--depth", depth);
  items.forEach((item) => ul.appendChild(createNode(item, depth)));
  return ul;
}

function render(data) {
  hideContextMenu();
  hideTooltip();
  const ul = createChildren(data, 0, "tv-list");
  ul.setAttribute("role", "tree");
  treeEl.replaceChildren(ul);
  const first = ul.querySelector(".tv-row");
  if (first) first.tabIndex = 0;
  applySearch(searchEl.value);
}

// ---- helpers ----
function nodeOf(row) {
  return row.parentElement;
}

function rowOf(li) {
  return li ? li.querySelector(":scope > .tv-row") : null;
}

function childrenOf(li) {
  return li.querySelector(":scope > .tv-children");
}

function parentNodeOf(li) {
  return li.parentElement.closest(".tv-node");
}

function isParent(li) {
  return li.classList.contains("is-parent");
}

function isOpen(li) {
  return li.classList.contains("is-open");
}

// ---- open / close ----
function slide(ul, open) {
  if (ul._anim) ul._anim.cancel();
  ul.style.display = "block";
  ul.style.overflow = "hidden";
  const full = ul.scrollHeight + "px";
  const anim = ul.animate(
    open ? [{ height: "0px" }, { height: full }] : [{ height: full }, { height: "0px" }],
    { duration: ANIMATION_MS, easing: "ease-out" }
  );
  ul._anim = anim;
  const cleanup = () => {
    ul.style.display = "";
    ul.style.overflow = "";
    ul._anim = null;
  };
  anim.onfinish = cleanup;
  anim.oncancel = cleanup;
}

function applyOpen(li, open) {
  li.classList.toggle("is-open", open);
  li.setAttribute("aria-expanded", String(open));
}

function setOpen(li, open) {
  if (!isParent(li) || isOpen(li) === open) return;
  applyOpen(li, open);
  slide(childrenOf(li), open);
}

function toggle(li) {
  setOpen(li, !isOpen(li));
}

function setAllOpen(open) {
  treeEl.querySelectorAll(".tv-node.is-parent").forEach((li) => {
    const ul = childrenOf(li);
    if (ul._anim) ul._anim.cancel();
    applyOpen(li, open);
  });

  if (open) return;
  // フォーカス行が隠れた場合は、表示されている最も外側の祖先へ移す
  const current = treeEl.querySelector(".tv-row[tabindex='0']");
  if (!current || isRowVisible(current)) return;
  let li = nodeOf(current);
  let top = li;
  while ((li = parentNodeOf(li))) top = li;
  const row = rowOf(top);
  if (document.activeElement === current) focusRow(row);
  else setTabStop(row);
}

// ---- select / focus ----
function select(row) {
  treeEl.querySelectorAll(".tv-row.is-selected").forEach((el) => el.classList.remove("is-selected"));
  row.classList.add("is-selected");
}

function setTabStop(row) {
  treeEl.querySelectorAll(".tv-row[tabindex='0']").forEach((el) => (el.tabIndex = -1));
  row.tabIndex = 0;
}

function focusRow(row) {
  if (!row) return;
  setTabStop(row);
  row.focus();
}

function isRowVisible(row) {
  let li = parentNodeOf(nodeOf(row));
  while (li) {
    if (!isOpen(li)) return false;
    li = parentNodeOf(li);
  }
  return true;
}

function visibleRows() {
  return Array.from(treeEl.querySelectorAll(".tv-row")).filter(isRowVisible);
}

// ---- search ----
// ワイルドカード（* ?）を部分一致・大文字小文字無視の正規表現に変換する
function wildcardToRegExp(text) {
  const escaped = text.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace(/\*/g, ".*").replace(/\?/g, "."), "i");
}

function applySearch(text) {
  treeEl.querySelectorAll(".tv-row.is-match").forEach((el) => el.classList.remove("is-match"));
  const query = (text || "").trim();
  if (!query) return;

  const re = wildcardToRegExp(query);
  let firstHit = null;
  treeEl.querySelectorAll(".tv-node:not(.is-parent) > .tv-row").forEach((row) => {
    const label = row.querySelector(".tv-label");
    const name = label ? label.textContent : "";
    const desc = row.dataset.description || "";
    if (re.test(name) || re.test(desc)) {
      row.classList.add("is-match");
      if (!firstHit) firstHit = row;
    }
  });

  // ヒットを含むグループは開き、含まないグループは閉じる
  treeEl.querySelectorAll(".tv-node.is-parent").forEach((li) => {
    const ul = childrenOf(li);
    if (ul._anim) ul._anim.cancel();
    applyOpen(li, !!ul.querySelector(".tv-row.is-match"));
  });

  // フォーカス行が隠れた場合は、表示されている最も外側の祖先へ移す
  const current = treeEl.querySelector(".tv-row[tabindex='0']");
  if (current && !isRowVisible(current)) {
    let li = nodeOf(current);
    let top = li;
    while ((li = parentNodeOf(li))) top = li;
    setTabStop(rowOf(top));
  }

  if (firstHit) firstHit.scrollIntoView({ block: "nearest" });
}

// ---- fusion ----
function execScript(li) {
  if (!window.adsk) return;
  adsk.fusionSendData("execScript", JSON.stringify({ id: li.dataset.id }));
}

function openFolder(id) {
  if (!window.adsk) return;
  adsk.fusionSendData("openFolder", JSON.stringify({ id: id }));
}

// ---- popup position ----
function placePopup(el, x, y, offset) {
  el.style.left = "0px";
  el.style.top = "0px";
  el.hidden = false;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  let left = x + offset;
  let top = y + offset;
  if (left + w > vw) left = Math.max(0, x - offset - w);
  if (top + h > vh) top = Math.max(0, y - offset - h);
  el.style.left = left + "px";
  el.style.top = top + "px";
}

// ---- tooltip ----
let tooltipTimer = null;
let lastMouse = { x: 0, y: 0 };

function hideTooltip() {
  clearTimeout(tooltipTimer);
  tooltipTimer = null;
  tooltipEl.hidden = true;
}

function scheduleTooltip(row) {
  hideTooltip();
  const text = row.dataset.description;
  if (!text || isParent(nodeOf(row)) || !ctxMenuEl.hidden) return;
  tooltipTimer = setTimeout(() => {
    tooltipEl.textContent = text;
    placePopup(tooltipEl, lastMouse.x, lastMouse.y, 14);
  }, TOOLTIP_DELAY_MS);
}

// ---- context menu ----
let ctxTargetId = null;

function hideContextMenu() {
  ctxMenuEl.hidden = true;
  ctxTargetId = null;
}

function hidePopups() {
  hideContextMenu();
  hideTooltip();
}

// ---- settings ----
let settingsTimer = null;

function isSettingsOpen() {
  return settingsEl.classList.contains("is-open");
}

function openSettings() {
  if (isSettingsOpen()) return;
  hidePopups();
  clearTimeout(settingsTimer);
  settingsEl.hidden = false;
  void settingsPanelEl.offsetHeight; // reflow してから transition を開始する
  settingsEl.classList.add("is-open");
  settingsCloseEl.focus();
}

function closeSettings() {
  if (!isSettingsOpen()) return;
  settingsEl.classList.remove("is-open");
  clearTimeout(settingsTimer);
  // transitionend が来ない場合の保険を兼ねて、アニメーション時間後に非表示にする
  settingsTimer = setTimeout(() => {
    if (!isSettingsOpen()) settingsEl.hidden = true;
  }, SETTINGS_ANIMATION_MS);
  settingsBtnEl.focus();
}

settingsCloseEl.addEventListener("click", closeSettings);
settingsEl.querySelector(".settings-backdrop").addEventListener("click", closeSettings);

// ---- settings: values ----
const themeEl = document.getElementById("setting-theme");
const transparentEl = document.getElementById("setting-transparent");
let settings = { theme: "light", transparent: true };

function applySettings(s) {
  settings = {
    theme: s && s.theme === "dark" ? "dark" : "light",
    transparent: !(s && s.transparent === false),
  };
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.classList.toggle("is-transparent", settings.transparent);
  themeEl.value = settings.theme;
  transparentEl.checked = settings.transparent;
}

function saveSettings() {
  if (!window.adsk) return;
  adsk.fusionSendData("saveSettings", JSON.stringify(settings));
}

themeEl.addEventListener("change", () => {
  applySettings({ ...settings, theme: themeEl.value });
  saveSettings();
});
transparentEl.addEventListener("change", () => {
  applySettings({ ...settings, transparent: transparentEl.checked });
  saveSettings();
});

// ---- events: mouse ----
// パレット全体のホバー状態（CSS の :hover はウィンドウ外へ出た時の解除が遅れるため JS で管理）
function setHover(on) {
  document.documentElement.classList.toggle("is-hover", on);
  if (!on) hideTooltip();
}
document.addEventListener("mouseover", () => setHover(true));
document.addEventListener("mouseout", (e) => {
  if (!e.relatedTarget) setHover(false);
});
document.documentElement.addEventListener("mouseleave", () => setHover(false));

treeEl.addEventListener("mouseover", (e) => {
  const row = e.target.closest(".tv-row");
  if (row && !row.contains(e.relatedTarget)) {
    lastMouse = { x: e.clientX, y: e.clientY };
    scheduleTooltip(row);
  }
});
treeEl.addEventListener("mouseout", (e) => {
  const row = e.target.closest(".tv-row");
  if (row && !row.contains(e.relatedTarget)) hideTooltip();
});
treeEl.addEventListener("mousemove", (e) => {
  lastMouse = { x: e.clientX, y: e.clientY };
});

treeEl.addEventListener("click", (e) => {
  const row = e.target.closest(".tv-row");
  if (!row) return;
  if (e.target.closest(".tv-twisty")) {
    toggle(nodeOf(row));
    return;
  }
  select(row);
  focusRow(row);
});

treeEl.addEventListener("dblclick", (e) => {
  const row = e.target.closest(".tv-row");
  if (!row || e.target.closest(".tv-twisty")) return;
  const sel = window.getSelection && window.getSelection();
  if (sel) sel.removeAllRanges();
  const li = nodeOf(row);
  if (isParent(li)) toggle(li);
  else execScript(li);
});

treeEl.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  hidePopups();
  const row = e.target.closest(".tv-row");
  if (!row) return;
  const li = nodeOf(row);
  if (isParent(li) || !/^\d+$/.test(li.dataset.id || "")) return;
  select(row);
  focusRow(row);
  ctxTargetId = li.dataset.id;
  placePopup(ctxMenuEl, e.clientX, e.clientY, 2);
});

ctxMenuEl.addEventListener("contextmenu", (e) => e.preventDefault());
ctxMenuEl.addEventListener("click", (e) => {
  const item = e.target.closest(".ctx-item");
  if (!item || ctxTargetId === null) return;
  if (item.dataset.action === "openFolder") openFolder(ctxTargetId);
  hideContextMenu();
});

// ツールバーボタンのツールチップ（スクリプト説明と同じ見た目）
toolbarEl.addEventListener("mouseover", (e) => {
  const btn = e.target.closest(".tv-btn");
  if (!btn || btn.contains(e.relatedTarget)) return;
  lastMouse = { x: e.clientX, y: e.clientY };
  hideTooltip();
  const text = btn.dataset.tooltip;
  if (!text || !ctxMenuEl.hidden) return;
  tooltipTimer = setTimeout(() => {
    tooltipEl.textContent = text;
    placePopup(tooltipEl, lastMouse.x, lastMouse.y, 14);
  }, TOOLTIP_DELAY_MS);
});
toolbarEl.addEventListener("mouseout", (e) => {
  const btn = e.target.closest(".tv-btn");
  if (btn && !btn.contains(e.relatedTarget)) hideTooltip();
});
toolbarEl.addEventListener("mousemove", (e) => {
  lastMouse = { x: e.clientX, y: e.clientY };
});

toolbarEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tv-btn");
  if (!btn) return;
  hidePopups();
  if (btn.dataset.cmd === "expandAll") setAllOpen(true);
  else if (btn.dataset.cmd === "collapseAll") setAllOpen(false);
  else if (btn.dataset.cmd === "settings") openSettings();
});

let searchTimer = null;
searchEl.addEventListener("input", () => {
  hidePopups();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => applySearch(searchEl.value), SEARCH_DELAY_MS);
});
searchEl.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  clearTimeout(searchTimer);
  searchEl.value = "";
  applySearch("");
});

document.addEventListener("mousedown", (e) => {
  hideTooltip();
  if (!ctxMenuEl.contains(e.target)) hideContextMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isSettingsOpen()) {
    e.preventDefault();
    closeSettings();
  }
  hidePopups();
});
treeEl.addEventListener("scroll", hidePopups);
window.addEventListener("scroll", hidePopups);
window.addEventListener("blur", hidePopups);

// ---- events: keyboard ----
treeEl.addEventListener("keydown", (e) => {
  const row = e.target.closest(".tv-row");
  if (!row) return;
  const li = nodeOf(row);
  const list = visibleRows();
  const idx = list.indexOf(row);
  switch (e.key) {
    case "ArrowUp":
      focusRow(list[idx - 1]);
      break;
    case "ArrowDown":
      focusRow(list[idx + 1]);
      break;
    case "ArrowRight":
      if (isParent(li)) {
        if (!isOpen(li)) setOpen(li, true);
        else focusRow(rowOf(childrenOf(li).querySelector(":scope > .tv-node")));
      }
      break;
    case "ArrowLeft":
      if (isParent(li) && isOpen(li)) setOpen(li, false);
      else focusRow(rowOf(parentNodeOf(li)));
      break;
    case "Home":
      focusRow(list[0]);
      break;
    case "End":
      focusRow(list[list.length - 1]);
      break;
    case "Enter":
      select(row);
      break;
    default:
      return;
  }
  e.preventDefault();
});

// ---- init ----
applySettings(settings);
render([{ text: "Loading..." }]);

document.addEventListener("DOMContentLoaded", () => {
  let adskWaiter = setInterval(() => {
    console.log("DOMContentLoaded");
    if (window.adsk) {
      console.log("adsk ok");
      clearInterval(adskWaiter);

      adsk.fusionSendData("htmlLoaded", "").then((ret) => {
        let obj = JSON.parse(ret || "null");
        if (!obj) return;
        applyLanguage(obj.lang);
        applySettings(obj.settings);
        if (!obj.data) return;
        render(obj.data);
      });
    }
  }, 100);
});
