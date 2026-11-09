const ANIMATION_MS = 150;
const TOOLTIP_DELAY_MS = 500;
const treeEl = document.getElementById("tree");
const toolbarEl = document.querySelector(".tv-toolbar");
const ctxMenuEl = document.getElementById("ctx-menu");
const tooltipEl = document.getElementById("tooltip");

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

// ---- events: mouse ----
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

toolbarEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tv-btn");
  if (!btn) return;
  hidePopups();
  if (btn.dataset.cmd === "expandAll") setAllOpen(true);
  else if (btn.dataset.cmd === "collapseAll") setAllOpen(false);
});

document.addEventListener("mousedown", (e) => {
  hideTooltip();
  if (!ctxMenuEl.contains(e.target)) hideContextMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hidePopups();
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
render([{ text: "Loading..." }]);

document.addEventListener("DOMContentLoaded", () => {
  let adskWaiter = setInterval(() => {
    console.log("DOMContentLoaded");
    if (window.adsk) {
      console.log("adsk ok");
      clearInterval(adskWaiter);

      adsk.fusionSendData("htmlLoaded", "").then((ret) => {
        let obj = JSON.parse(ret || "null");
        if (!obj || !obj.data) return;
        render(obj.data);
      });
    }
  }, 100);
});
