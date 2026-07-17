/**
 * kubePill — a floating kubectl cheat sheet.
 *
 * The pill in the titlebar IS the search prompt: typing in it auto-expands
 * the window and greps the command list live.
 *
 * Command data lives in commands.json — add commands there, not here.
 */

const $ = (s) => document.querySelector(s);

/* ── state ───────────────────────────────────────────────── */
let CATEGORIES = [];
let activeCat = null;
let expanded = false;
let pinned = false;

const SIZES = {
  collapsed: { width: 520, height: 64 },
  expanded: { width: 620, height: 800 },
};

const qEl = () => $("#q");
const query = () => qEl().value;

/* ── helpers ─────────────────────────────────────────────── */
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function updateCursor() {
  const hide = document.activeElement === qEl() || query().length > 0;
  $("#blockcursor").classList.toggle("off", hide);
}

/* ── rendering ───────────────────────────────────────────── */
function renderTabs() {
  const el = $("#tabs");
  el.style.display = query().trim() ? "none" : "flex";
  el.innerHTML = CATEGORIES.map(
    (c) => `
    <button class="tab ${c.name === activeCat ? "active" : ""}" data-cat="${c.name}"
      style="${c.name === activeCat ? `border-color:${c.color};color:${c.color}` : ""}">
      ${esc(c.name)}<span class="n">${c.commands.length}</span>
    </button>`
  ).join("");
  el.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => {
      activeCat = b.dataset.cat;
      render();
    })
  );
}

function visibleCommands() {
  const q = query().trim().toLowerCase();
  if (q) {
    return CATEGORIES.flatMap((c) =>
      c.commands
        .filter(
          (cm) =>
            cm.cmd.toLowerCase().includes(q) || cm.short.toLowerCase().includes(q)
        )
        .map((cm) => ({ ...cm, _color: c.color }))
    );
  }
  const cat = CATEGORIES.find((c) => c.name === activeCat);
  if (!cat) return [];
  return cat.commands.map((cm) => ({ ...cm, _color: cat.color }));
}

function renderRows() {
  const items = visibleCommands();
  $("#count").textContent = items.length;
  const el = $("#rows");
  if (!items.length) {
    el.innerHTML = `<p class="empty">no match — try a shorter term, e.g. <b>logs</b></p>`;
    return;
  }
  el.innerHTML = items
    .map(
      (it, i) => `
    <button class="row" data-i="${i}">
      <span class="rprompt">$</span>
      <span class="cmd" style="color:${it._color}">${esc(it.cmd)}</span>
      <span class="short"># ${esc(it.short)}</span>
    </button>`
    )
    .join("");
  el.querySelectorAll(".row").forEach((b) =>
    b.addEventListener("click", () => openMan(items[+b.dataset.i]))
  );
}

function render() {
  renderTabs();
  renderRows();
  updateCursor();
}

/* ── man-page modal ──────────────────────────────────────── */
function openMan(item) {
  const manFile = "man " + item.cmd.replace("kubectl ", "kubectl-").split(" ")[0];
  $("#man").setAttribute("aria-label", item.cmd);
  $("#man").innerHTML = `
    <div class="man-titlebar">
      <span class="dot" style="background:#fb4934"></span>
      <span class="dot" style="background:#fabd2f"></span>
      <span class="dot" style="background:#b8bb26"></span>
      <span class="file">${esc(manFile)}</span>
      <button class="esc" id="close">esc</button>
    </div>
    <div class="man-body">
      <p class="sect">NAME</p>
      <p class="name-line"><span style="color:${item._color};font-weight:700">${esc(
    item.cmd
  )}</span> — ${esc(item.short)}</p>
      <p class="sect">DESCRIPTION</p>
      <p class="desc">${esc(item.desc)}</p>
      <p class="sect">EXAMPLES</p>
      ${item.examples
        .map(
          (ex, i) => `
        <div class="ex" data-ex="${i}" title="Click to copy">
          <div class="line"><span class="eprompt">$ </span>${esc(
            ex.command
          )}<span class="copied" data-c="${i}" hidden>✓ copied</span></div>
          <div class="note"># ${esc(ex.note)}</div>
        </div>`
        )
        .join("")}
    </div>`;
  $("#overlay").hidden = false;
  $("#close").addEventListener("click", closeMan);
  $("#man")
    .querySelectorAll(".ex")
    .forEach((div) => {
      div.addEventListener("click", () => {
        const i = div.dataset.ex;
        copyText(item.examples[+i].command);
        const tag = div.querySelector(`[data-c="${i}"]`);
        tag.hidden = false;
        setTimeout(() => {
          tag.hidden = true;
        }, 1200);
      });
    });
}

function closeMan() {
  $("#overlay").hidden = true;
}

/* ── clipboard ───────────────────────────────────────────── */
function copyText(text) {
  if (window.Neutralino && Neutralino.clipboard) {
    Neutralino.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch (e) {
    /* no clipboard available — nothing to do */
  }
}

/* ── window control ──────────────────────────────────────────
   Ordering matters for clean resizes:
     expand:   grow the window FIRST, then reveal the panel
     collapse: hide the panel FIRST (app shrinks to the bar),
               then shrink the window
   Otherwise the window and its contents disagree mid-transition
   and the widget renders malformed. */
async function applySize(s) {
  try {
    await Neutralino.window.setSize({ width: s.width, height: s.height });
  } catch (e) {
    /* running outside Neutralino (e.g. plain browser) */
  }
  // Some WebView2 builds need a second nudge once layout settles.
  setTimeout(async () => {
    try {
      await Neutralino.window.setSize({ width: s.width, height: s.height });
    } catch (e) {}
  }, 80);
}

async function setExpanded(v, { focusSearch = true, keepQuery = false } = {}) {
  if (v === expanded) return;
  expanded = v;
  if (v) {
    await applySize(SIZES.expanded);
    document.body.classList.add("expanded");
    render();
    if (focusSearch) qEl().focus();
  } else {
    document.body.classList.remove("expanded");
    if (!keepQuery) qEl().value = "";
    render();
    qEl().blur();
    await applySize(SIZES.collapsed);
  }
}

/* ── events ──────────────────────────────────────────────── */
function wireEvents() {
  $("#toggle").addEventListener("click", () =>
    setExpanded(!expanded, { focusSearch: false })
  );
  $("#dragzone").addEventListener("dblclick", () =>
    setExpanded(!expanded, { focusSearch: false })
  );

  $("#quit").addEventListener("click", () => {
    try {
      Neutralino.app.exit();
    } catch (e) {
      window.close();
    }
  });

  $("#pin").addEventListener("click", async () => {
    pinned = !pinned;
    $("#pin").classList.toggle("pinned", pinned);
    $("#pin").title = pinned ? "Unpin" : "Pin on top";
    try {
      await Neutralino.window.setAlwaysOnTop(pinned);
    } catch (e) {}
  });

  // The core interaction: typing in the pill expands it live.
  qEl().addEventListener("input", () => {
    if (query().length > 0 && !expanded) {
      setExpanded(true, { keepQuery: true });
    }
    render();
  });
  qEl().addEventListener("focus", updateCursor);
  qEl().addEventListener("blur", updateCursor);

  $("#overlay").addEventListener("click", (e) => {
    if (e.target === $("#overlay")) closeMan();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("#overlay").hidden) closeMan();
      else if (query()) {
        qEl().value = "";
        render();
      } else if (expanded) setExpanded(false);
      else qEl().blur();
      return;
    }
    if (e.key === "/" && document.activeElement !== qEl()) {
      e.preventDefault();
      qEl().focus();
      return;
    }
    // Any printable key while the pill is idle → start typing in it.
    if (
      !expanded &&
      document.activeElement !== qEl() &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey
    ) {
      qEl().focus();
    }
  });
}

/* ── boot ────────────────────────────────────────────────── */
async function loadCommands() {
  const res = await fetch("commands.json");
  if (!res.ok) throw new Error(`commands.json: HTTP ${res.status}`);
  CATEGORIES = await res.json();
  activeCat = CATEGORIES[0]?.name ?? null;
}

async function main() {
  if (typeof Neutralino !== "undefined") {
    Neutralino.init();
    Neutralino.events.on("ready", async () => {
      try {
        await Neutralino.window.setDraggableRegion("dragzone");
      } catch (e) {}
    });
    Neutralino.events.on("windowClose", () => Neutralino.app.exit());
  }

  try {
    await loadCommands();
  } catch (err) {
    $("#rows").innerHTML = `<p class="empty">failed to load commands.json — ${esc(
      String(err.message)
    )}</p>`;
    document.body.classList.add("expanded");
    return;
  }

  wireEvents();
  render();
}

main();
