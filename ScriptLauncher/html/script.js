const ANIMATION_MS = 200;
const TOOLTIP_DELAY_MS = 500;
const treeEl = document.getElementById("tree");
const ctxMenuEl = document.getElementById("ctx-menu");
const tooltipEl = document.getElementById("tooltip");

// ---- render ----
function createNode(item, isLast) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  const li = document.createElement("li");
  li.className = "jstree-node " + (hasChildren ? "jstree-closed" : "jstree-leaf");
  if (isLast) li.classList.add("jstree-last");
  if (item.id !== undefined) li.id = String(item.id);
  li.setAttribute("role", "treeitem");

  const ocl = document.createElement("i");
  ocl.className = "jstree-icon jstree-ocl";
  ocl.setAttribute("role", "presentation");
  li.appendChild(ocl);

  const a = document.createElement("a");
  a.className = "jstree-anchor";
  a.href = "#";
  a.tabIndex = -1;
  if (item.a_attr && item.a_attr.title) a.dataset.description = item.a_attr.title;

  const icon = document.createElement("i");
  icon.className = "jstree-icon jstree-themeicon";
  icon.setAttribute("role", "presentation");
  if (item.icon) {
    icon.classList.add("jstree-themeicon-custom");
    icon.style.backgroundImage = "url('" + item.icon + "')";
    icon.style.backgroundPosition = "center center";
    icon.style.backgroundSize = "auto";
  }
  a.appendChild(icon);
  a.appendChild(document.createTextNode(item.text || ""));
  li.appendChild(a);

  if (hasChildren) {
    li.appendChild(createChildren(item.children, "jstree-children"));
  }
  return li;
}

function createChildren(items, className) {
  const ul = document.createElement("ul");
  ul.className = className;
  ul.setAttribute("role", "group");
  items.forEach((item, idx) => {
    ul.appendChild(createNode(item, idx === items.length - 1));
  });
  return ul;
}

function render(data) {
  const ul = createChildren(data, "jstree-container-ul jstree-children");
  ul.setAttribute("role", "tree");
  treeEl.replaceChildren(ul);
  const first = ul.querySelector(".jstree-anchor");
  if (first) first.tabIndex = 0;
}

// ---- open / close ----
function isParent(li) {
  return li.classList.contains("jstree-open") || li.classList.contains("jstree-closed");
}

function slide(ul, open) {
  if (ul._anim) ul._anim.cancel();
  const full = ul.scrollHeight + "px";
  ul.classList.add("jstree-animated");
  ul.style.display = "block";
  ul.style.overflow = "hidden";
  const anim = ul.animate(
    open ? [{ height: "0px" }, { height: full }] : [{ height: full }, { height: "0px" }],
    { duration: ANIMATION_MS, easing: "ease" }
  );
  ul._anim = anim;
  const cleanup = () => {
    ul.classList.remove("jstree-animated");
    ul.style.display = "";
    ul.style.overflow = "";
    ul._anim = null;
  };
  anim.onfinish = cleanup;
  anim.oncancel = cleanup;
}

function setOpen(li, open) {
  if (!isParent(li) || li.classList.contains("jstree-open") === open) return;
  li.classList.toggle("jstree-open", open);
  li.classList.toggle("jstree-closed", !open);
  slide(li.querySelector(":scope > .jstree-children"), open);
}

function toggle(li) {
  setOpen(li, !li.classList.contains("jstree-open"));
}

// ---- select / focus ----
function select(a) {
  treeEl.querySelectorAll(".jstree-clicked").forEach((el) => el.classList.remove("jstree-clicked"));
  a.classList.add("jstree-clicked");
}

function focusAnchor(a) {
  if (!a) return;
  treeEl.querySelectorAll(".jstree-anchor[tabindex='0']").forEach((el) => (el.tabIndex = -1));
  a.tabIndex = 0;
  a.focus();
}

function visibleAnchors() {
  return Array.from(treeEl.querySelectorAll(".jstree-anchor")).filter((a) => {
    let li = a.parentElement.parentElement.closest(".jstree-node");
    while (li) {
      if (!li.classList.contains("jstree-open")) return false;
      li = li.parentElement.closest(".jstree-node");
    }
    return true;
  });
}

function execScript(li) {
  if (!window.adsk) return;
  adsk.fusionSendData("execScript", JSON.stringify({ id: li.id }));
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

function scheduleTooltip(a) {
  hideTooltip();
  const text = a.dataset.description;
  if (!text || isParent(a.parentElement) || !ctxMenuEl.hidden) return;
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

function openFolder(id) {
  if (!window.adsk) return;
  adsk.fusionSendData("openFolder", JSON.stringify({ id: id }));
}

// ---- events ----
treeEl.addEventListener("mouseover", (e) => {
  const a = e.target.closest(".jstree-anchor");
  if (a && !a.contains(e.relatedTarget)) {
    a.classList.add("jstree-hovered");
    lastMouse = { x: e.clientX, y: e.clientY };
    scheduleTooltip(a);
  }
});
treeEl.addEventListener("mouseout", (e) => {
  const a = e.target.closest(".jstree-anchor");
  if (a && !a.contains(e.relatedTarget)) {
    a.classList.remove("jstree-hovered");
    hideTooltip();
  }
});
treeEl.addEventListener("mousemove", (e) => {
  lastMouse = { x: e.clientX, y: e.clientY };
});

treeEl.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  hideTooltip();
  hideContextMenu();
  const a = e.target.closest(".jstree-anchor");
  if (!a) return;
  const li = a.parentElement;
  if (isParent(li) || !/^\d+$/.test(li.id)) return;
  select(a);
  focusAnchor(a);
  ctxTargetId = li.id;
  placePopup(ctxMenuEl, e.clientX, e.clientY, 2);
});

ctxMenuEl.addEventListener("contextmenu", (e) => e.preventDefault());
ctxMenuEl.addEventListener("click", (e) => {
  const item = e.target.closest(".ctx-item");
  if (!item || ctxTargetId === null) return;
  if (item.dataset.action === "openFolder") openFolder(ctxTargetId);
  hideContextMenu();
});

document.addEventListener("mousedown", (e) => {
  hideTooltip();
  if (!ctxMenuEl.contains(e.target)) hideContextMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideContextMenu();
    hideTooltip();
  }
});
treeEl.addEventListener("scroll", () => {
  hideContextMenu();
  hideTooltip();
});
window.addEventListener("scroll", () => {
  hideContextMenu();
  hideTooltip();
});
window.addEventListener("blur", () => {
  hideContextMenu();
  hideTooltip();
});

treeEl.addEventListener("click", (e) => {
  const ocl = e.target.closest(".jstree-ocl");
  if (ocl) {
    toggle(ocl.parentElement);
    return;
  }
  const a = e.target.closest(".jstree-anchor");
  if (!a) return;
  e.preventDefault();
  select(a);
  focusAnchor(a);
});

treeEl.addEventListener("dblclick", (e) => {
  const a = e.target.closest(".jstree-anchor");
  if (!a) return;
  const sel = window.getSelection && window.getSelection();
  if (sel) sel.removeAllRanges();
  const li = a.parentElement;
  if (isParent(li)) {
    toggle(li);
  } else {
    execScript(li);
  }
});

treeEl.addEventListener("keydown", (e) => {
  const a = e.target.closest(".jstree-anchor");
  if (!a) return;
  const li = a.parentElement;
  const list = visibleAnchors();
  const idx = list.indexOf(a);
  switch (e.key) {
    case "ArrowUp":
      focusAnchor(list[idx - 1]);
      break;
    case "ArrowDown":
      focusAnchor(list[idx + 1]);
      break;
    case "ArrowRight":
      if (li.classList.contains("jstree-closed")) setOpen(li, true);
      else if (li.classList.contains("jstree-open")) focusAnchor(li.querySelector(":scope > .jstree-children .jstree-anchor"));
      break;
    case "ArrowLeft":
      if (li.classList.contains("jstree-open")) setOpen(li, false);
      else {
        const parent = li.parentElement.closest(".jstree-node");
        if (parent) focusAnchor(parent.querySelector(":scope > .jstree-anchor"));
      }
      break;
    case "Home":
      focusAnchor(list[0]);
      break;
    case "End":
      focusAnchor(list[list.length - 1]);
      break;
    case "Enter":
      select(a);
      break;
    default:
      return;
  }
  e.preventDefault();
});

treeEl.addEventListener("focusin", (e) => {
  const a = e.target.closest(".jstree-anchor");
  if (a) a.classList.add("jstree-hovered");
});
treeEl.addEventListener("focusout", (e) => {
  const a = e.target.closest(".jstree-anchor");
  if (a && !a.matches(":hover")) a.classList.remove("jstree-hovered");
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
