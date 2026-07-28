// ─── Split Fiction (v2 — single-DOM rebuild) ─────────────────────────────────
// Splits the viewport into a left sci-fi half and a right fairy half without
// cloning #root. Both halves share the ONE real, interactive DOM, so clicks,
// forms, terminal input, and hover-driven React state work everywhere.
//
// Architecture (Option A — single-DOM, --split-abs-driven dual-overlay):
//   • --split-abs (px) and --split-pct (%) on :root. applySplit() is the
//     single writer; every overlay reads via CSS var — no per-frame JS.
//   • Left sci-fi lens: position:fixed, width:var(--split-abs),
//     backdrop-filter: invert/hue-rotate/saturate/contrast, pointer-events:none.
//   • Right fairy overlay: position:fixed, left:var(--split-abs), right:0,
//     backdrop-filter: hue-rotate/saturate/brightness (tints content violet);
//     background:rgba(13,0,21,0.35) fills body-gap sections with fairy dark.
//   • Fairy supplement stylesheet (body._sfActive): gradient-stop backgrounds
//     for section/card surfaces, terminal window framing, mosaic dissolve,
//     inputs, buttons. Left side stays transparent — real DOM untouched there.
//   • Sparkle layer: position:fixed right half, pointer-events:none.
//   • Draggable seam → applySplit() → CSS vars update → everything follows.
//   • Clean teardown: every node, listener, CSS var, and global is restored.

const HOLD_MS  = 4200;
const SPLIT_MS = 900;
const MIN_PCT  = 10;
const MAX_PCT  = 90;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ─── CSS variable helpers ──────────────────────────────────────────────────
function setSplitVars(pct) {
  const absPx = (pct / 100) * window.innerWidth;
  document.documentElement.style.setProperty("--split-pct", pct);
  document.documentElement.style.setProperty("--split-abs", absPx + "px");
}

function clearSplitVars() {
  document.documentElement.style.removeProperty("--split-pct");
  document.documentElement.style.removeProperty("--split-abs");
}

// ─── Left sci-fi lens ─────────────────────────────────────────────────────
// Same filter values as the previous clone-stack implementation.
function buildLeftLens() {
  const f = "invert(1) hue-rotate(150deg) saturate(2.2) contrast(1.1)";
  const el = document.createElement("div");
  el.id = "_sfLeftLens";
  el.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:var(--split-abs)",
    "bottom:0",
    "pointer-events:none",
    "z-index:99990",
    "backdrop-filter:" + f,
    "-webkit-backdrop-filter:" + f,
    "opacity:0",
    "transition:opacity " + SPLIT_MS + "ms ease",
  ].join(";");
  return el;
}

// ─── Right fairy overlay ──────────────────────────────────────────────────
// Structural fixed element that receives its opacity transition in sync with
// the seam and left lens. Visual theming of the right half is handled by:
//   • body._sfActive{background:#0d0015} (body gap fill)
//   • Section gradient hard-stops in the fairy supplement stylesheet
// No backdrop-filter here: hue-rotate was shifting the fairy dark background
// (#0d0015 ≈ violet hue 280°) by +90° into the red range (370°=10°), which
// produced a brownish-red card background instead of the intended dark purple.
function buildRightOverlay() {
  const el = document.createElement("div");
  el.id = "_sfRightOverlay";
  el.style.cssText = [
    "position:fixed",
    "top:0",
    "left:var(--split-abs)",
    "right:0",
    "bottom:0",
    "pointer-events:none",
    "z-index:99990",
    "opacity:0",
    "transition:opacity " + SPLIT_MS + "ms ease",
  ].join(";");
  return el;
}

// ─── Fairy supplement stylesheet ──────────────────────────────────────────
// Scoped to body._sfActive. Uses linear-gradient hard-stops at var(--split-abs)
// for backgrounds: left of the seam → transparent (real DOM unchanged);
// right of the seam → fairy dark fill. The right overlay's backdrop-filter
// then tints the real content on top.
//
// Class-name selectors respect the CSS Modules hash convention:
//   card_   (underscore) = card CONTAINER  → gets the purple frame
//   card-   (hyphen)     = card sub-elements (title, description, skills…)
//                          → deliberately NOT selected (avoids glowing text)
function buildFairyStylesheet() {
  const el = document.createElement("style");
  el.id = "_sfFairyStyle";

  const SECTIONS = [
    "[class*='about-section']",
    "[class*='project-section']",
    "[class*='timelineSection']",
    "[class*='contact-section']",
    // BeyondCode uses styles.section (CSS-module hash is _section_<hash>);
    // target by the stable id attribute instead.
    "#beyond-code",
    // Footer is a native <footer> element with no CSS-module class on the root.
    "footer",
  ].map((s) => "body._sfActive " + s).join(",\n");

  el.textContent = `
/* ══ Split Fiction v2 — fairy supplement (body._sfActive scope) ══
   Gradient hard-stops at var(--split-abs): left = transparent (real DOM),
   right = fairy fill. Right overlay's backdrop-filter tints over the top.
*/

/* 0. Body background — fills the black margin gaps between sections on the
      right side. Left-side gaps show the inverted version (#f2ffea, pale mint)
      which is barely distinguishable from pure white at 10px scale. */
body._sfActive {
  background: #0d0015 !important;
}

/* 1. Section backgrounds */
${SECTIONS} {
  background: linear-gradient(
    90deg,
    transparent 0 var(--split-abs),
    rgba(13, 0, 21, 0.92) var(--split-abs) 100%
  ) !important;
}

/* 2. Card CONTAINERS only (card_ underscore = container, never card- hyphen) */
body._sfActive [class*='card_'] {
  border: 1px solid rgba(196, 130, 255, 0.4) !important;
  border-radius: 10px !important;
  box-shadow: 0 0 14px rgba(196, 130, 255, 0.1) !important;
}
body._sfActive [class*='card_']:hover {
  background-color: rgba(196, 130, 255, 0.1) !important;
  border-color: rgba(196, 130, 255, 0.85) !important;
  box-shadow: 0 0 22px rgba(196, 130, 255, 0.28) !important;
}
/* NOTE: no hover * {color} rule here — overriding descendant color and then
   snapping it off causes a brief bright-green flash on the left side because
   the real card's color:#165757 momentarily bleeds through the left lens's
   invert+hue-rotate(150deg) filter during the transition, mapping to green. */

/* 2a. Card title + skills text — explicit colours so neither side shows white.
   Left side: these values pass through invert(1)+hue-rotate(150deg)+saturate(2.2)
   → title #e8d5f5 (lavender) → dark indigo; skills #c482ff (purple) → dark blue.
   Right side: title lavender and skills purple read clearly on the dark #0d0015 bg. */
body._sfActive [class*='card-title'] {
  color: #e8d5f5 !important;
}
body._sfActive [class*='card-skills'] {
  color: #c482ff !important;
}

/* 3. About terminal: framed window + fairy mac dots */
body._sfActive [class*='fakeScreen'] {
  background-color: rgba(18, 8, 28, 0.92) !important;
  border: 1px solid rgba(196, 130, 255, 0.4) !important;
  border-top: none !important;
  box-shadow: 0 0 18px rgba(196, 130, 255, 0.12) !important;
}
body._sfActive [class*='fakeMenu'] {
  background-color: rgba(45, 28, 64, 0.95) !important;
  border: 1px solid rgba(196, 130, 255, 0.4) !important;
  border-bottom: none !important;
}
body._sfActive [class*='fakeButtons'] {
  background-color: #f9a8d4 !important;
  border-color: #c76a9a !important;
}
body._sfActive [class*='fakeMinimize'] {
  background-color: #fde68a !important;
  border-color: #c7a94a !important;
}
body._sfActive [class*='fakeZoom'] {
  background-color: #86efac !important;
  border-color: #4aa96a !important;
}

/* 4. Spotify mosaic: checkerboard fill + hover dissolve
      --tile-idx is set on each tile at activation via JS. */
body._sfActive [class*='mosaicTileEven'] {
  background-color: rgba(30, 18, 45, 0.96) !important;
}
body._sfActive [class*='mosaicTileOdd'] {
  background-color: rgba(15, 6, 24, 0.96) !important;
}
body._sfActive [class*='mosaicTile'] {
  transition: transform 0.3s ease, opacity 0.3s ease !important;
  transition-delay: calc((480 - var(--tile-idx, 0)) * 0.002s) !important;
}
body._sfActive [class*='mosaicCard']:hover [class*='mosaicTile'] {
  transform: scale(0) !important;
  opacity: 0 !important;
  transition-delay: calc(var(--tile-idx, 0) * 0.002s) !important;
}
body._sfActive [class*='mosaicCard'] {
  border-color: rgba(240, 168, 48, 0.4) !important;
}
body._sfActive [class*='spotifyFront'] {
  transition: opacity 0.3s ease !important;
  transition-delay: 0.8s !important;
}
body._sfActive [class*='mosaicCard']:hover [class*='spotifyFront'] {
  opacity: 0 !important;
  transition-delay: 0s !important;
}

/* 5. Contact inputs / textareas */
body._sfActive input,
body._sfActive textarea,
body._sfActive select {
  border: 1px solid rgba(196, 130, 255, 0.5) !important;
  border-radius: 6px !important;
}
body._sfActive input::placeholder,
body._sfActive textarea::placeholder {
  /* 0.45 at full-lavender was invisible on white inputs (right) and inverted to
     dark olive on black inputs (left). Higher opacity + warmer purple is readable
     on both: right = muted purple on white; left = inverted to blue-violet on black. */
  color: rgba(180, 140, 230, 0.72) !important;
}

/* 6. Buttons */
body._sfActive button,
body._sfActive [class*='button'],
body._sfActive [class*='Button'],
body._sfActive [class*='btn'],
body._sfActive [class*='Btn'] {
  border: 1px solid rgba(196, 130, 255, 0.45) !important;
  border-radius: 5px !important;
}
/* card-buttons is the flex wrapper for GitHub+Preview — [class*='button'] above
   matches it too, so it gets an outer frame that creates a visible divider between
   the two adjacent card-button children. Clear it here (more specific / later rule). */
body._sfActive [class*='card-buttons'] {
  border: none !important;
  box-shadow: none !important;
}
body._sfActive button:hover,
body._sfActive [class*='button']:hover,
body._sfActive [class*='Button']:hover,
body._sfActive [class*='btn']:hover,
body._sfActive [class*='Btn']:hover {
  background: rgba(196, 130, 255, 0.2) !important;
  border-color: rgba(196, 130, 255, 0.6) !important;
  box-shadow: 0 0 12px rgba(196, 130, 255, 0.35) !important;
}

/* 7. Timeline nodes */
body._sfActive [class*='node'] {
  border-color: rgba(196, 130, 255, 0.6) !important;
}

/* 8. Heading glow */
body._sfActive h1, body._sfActive h2, body._sfActive h3,
body._sfActive h4, body._sfActive h5, body._sfActive h6 {
  text-shadow: 0 0 8px rgba(196, 130, 255, 0.4) !important;
}

/* 9. Links */
body._sfActive a:hover {
  text-shadow: 0 0 6px rgba(196, 130, 255, 0.4) !important;
}

/* 10. Hero name — filter shifts native teal (var(--color-accent-danger), hue ≈180°)
    by +90° → hue ≈270° (purple/violet) on the right (fairy) side. This restores
    the purple look the right overlay's backdrop-filter used to produce.
    Left compound: teal → filter(+90°) = purple → left lens invert(hue 90°=yellow-green)
    → hue-rotate(150°) = 240° → saturate = vivid blue-indigo. */
body._sfActive #hackerText {
  filter: hue-rotate(90deg) saturate(1.5) !important;
}

/* 11. Scroll-down arrow — filter on the container applies to ::before/::after too.
    Same shift as hero name: teal → +90° → purple on the right side. */
body._sfActive [class*='down-arrow'] {
  filter: hue-rotate(90deg) saturate(1.5) !important;
}
`.trim();

  document.head.appendChild(el);
  return el;
}

// ─── Sparkles ──────────────────────────────────────────────────────────────
function buildSparkles() {
  const styleEl = document.createElement("style");
  styleEl.id = "_sfSparkStyle";
  styleEl.textContent = [
    "@keyframes _sfFloat {",
    "  0%   { transform: translateY(0) scale(0.6); opacity: 0; }",
    "  15%  { opacity: 1; }",
    "  85%  { opacity: 0.9; }",
    "  100% { transform: translateY(-90px) scale(0.2); opacity: 0; }",
    "}",
    "@keyframes _sfWiggle {",
    "  0%, 100% { margin-left: 0; }",
    "  50%      { margin-left: 8px; }",
    "}",
    "._sfSpark {",
    "  position: absolute;",
    "  border-radius: 50%;",
    "  animation: _sfFloat linear infinite, _sfWiggle ease-in-out infinite;",
    "}",
  ].join("\n");
  document.head.appendChild(styleEl);

  const wrap = document.createElement("div");
  wrap.id = "_sfSparkWrap";
  wrap.style.cssText = [
    "position:fixed",
    "top:0",
    "left:var(--split-abs)",
    "right:0",
    "bottom:0",
    "z-index:99992",
    "pointer-events:none",
    "overflow:hidden",
    "opacity:0",
    "transition:opacity " + SPLIT_MS + "ms ease",
  ].join(";");

  const colors = ["#f9a8d4", "#d8b4fe", "#86efac", "#fde68a", "#a5f3fc", "#fbcfe8"];
  for (let i = 0; i < 35; i++) {
    const spark  = document.createElement("div");
    spark.className = "_sfSpark";
    const size   = (Math.random() * 7 + 3).toFixed(1);
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const dur    = (Math.random() * 2.5 + 1.8).toFixed(2);
    const delay  = (Math.random() * 4).toFixed(2);
    spark.style.cssText = [
      "width:"  + size + "px",
      "height:" + size + "px",
      "left:"   + (Math.random() * 100).toFixed(1) + "%",
      "top:"    + (Math.random() * 100).toFixed(1) + "%",
      "background:" + color,
      "box-shadow:0 0 " + (parseFloat(size) * 2.5).toFixed(0) + "px 2px " + color,
      "animation-duration:" + dur + "s," + (parseFloat(dur) * 1.4).toFixed(2) + "s",
      "animation-delay:" + delay + "s," + delay + "s",
    ].join(";");
    wrap.appendChild(spark);
  }

  return { wrap, styleEl };
}

// ─── Draggable seam ────────────────────────────────────────────────────────
function buildSeam() {
  const el = document.createElement("div");
  el.id = "_splitFictionSeam";
  el.style.cssText = [
    "position:fixed",
    "top:0",
    "left:50%",          // overwritten by applySplit() immediately
    "width:7px",
    "height:100vh",
    "margin-left:-3.5px",
    "z-index:99993",
    "pointer-events:auto",
    "cursor:col-resize",
    "background:linear-gradient(180deg,#2ba2a2,#fff,#f472b6)",
    "box-shadow:0 0 18px 4px rgba(255,255,255,.7)",
    "opacity:0",
    "transition:opacity " + SPLIT_MS + "ms ease",
  ].join(";");
  return el;
}

// ─── Main effect ───────────────────────────────────────────────────────────
export default async function splitFiction() {
  // Idempotent guard — seam id acts as the "running" sentinel.
  if (document.getElementById("_splitFictionSeam")) return;
  // Mutual exclusion with exit8.
  if (window.__exit8Active) return;

  const reduced = prefersReducedMotion();
  let splitPct  = 50;

  // ── Activate ──────────────────────────────────────────────────────────
  window.__sfFairyActive = true;
  document.body.classList.add("_sfActive");
  setSplitVars(splitPct);

  // Assign --tile-idx to each Spotify mosaic tile so the hover-dissolve stagger
  // animation works. The real DOM only has one set of tiles — no clone needed.
  let tileIdx = 0;
  document.querySelectorAll("[class*='mosaicTile']").forEach((tile) => {
    tile.style.setProperty("--tile-idx", tileIdx++);
  });

  // ── Build and mount overlays ───────────────────────────────────────────
  const leftLens   = buildLeftLens();
  const rightOvl   = buildRightOverlay();
  const fairyStyle = buildFairyStylesheet();
  const seam       = buildSeam();
  const { wrap: sparkWrap, styleEl: sparkStyle } = buildSparkles();

  document.body.appendChild(leftLens);
  document.body.appendChild(rightOvl);
  document.body.appendChild(seam);
  document.body.appendChild(sparkWrap);

  // ── applySplit ─────────────────────────────────────────────────────────
  // Single writer for the split position. Overlays read via CSS var (no JS
  // per frame); only the seam's `left` needs a direct inline update.
  function applySplit(pct) {
    splitPct = Math.max(MIN_PCT, Math.min(MAX_PCT, pct));
    window.__sfSplitPct = splitPct;
    setSplitVars(splitPct);
    seam.style.left = splitPct + "%";
  }
  applySplit(splitPct); // sync seam.left with the CSS var on first paint

  // ── Drag logic ─────────────────────────────────────────────────────────
  let dragging = false;
  const transition = "opacity " + SPLIT_MS + "ms ease";
  const draggables = [leftLens, rightOvl, seam, sparkWrap];

  function onDragStart(e) {
    e.preventDefault();
    dragging = true;
    draggables.forEach((el) => { el.style.transition = "none"; });
  }

  function onDragMove(e) {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    applySplit((clientX / window.innerWidth) * 100);
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    draggables.forEach((el) => { el.style.transition = transition; });
  }

  seam.addEventListener("mousedown",  onDragStart);
  seam.addEventListener("touchstart", onDragStart, { passive: false });
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("mouseup",   onDragEnd);
  document.addEventListener("touchend",  onDragEnd);

  // ── Cursor per side ────────────────────────────────────────────────────
  // Right of the seam → native cursor (auto); left → custom site cursor.
  const originalCursor = getComputedStyle(document.documentElement)
    .getPropertyValue("--cursor-default").trim();

  function updateCursor(clientX) {
    const splitX = (splitPct / 100) * window.innerWidth;
    document.documentElement.style.setProperty(
      "--cursor-default",
      clientX > splitX ? "auto" : originalCursor
    );
  }

  function onCursorMove(e) { updateCursor(e.clientX); }
  document.addEventListener("mousemove", onCursorMove);

  // Handle the trigger moment: set cursor based on wherever the pointer is now.
  // Falls back to the left-half (originalCursor) when the position is unknown.
  updateCursor(typeof window.__lastMouseX === "number"
    ? window.__lastMouseX
    : 0);

  // ── Esc to dismiss ─────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (e.key === "Escape") cleanup();
  }
  document.addEventListener("keydown", onKeyDown);

  // ── Cleanup ────────────────────────────────────────────────────────────
  // Removes every node, listener, CSS var, and global this effect touched.
  // Called by auto-dismiss, Esc, and external effects (tenet, exit8, etc.).
  function cleanup() {
    // Listeners
    seam.removeEventListener("mousedown",  onDragStart);
    seam.removeEventListener("touchstart", onDragStart);
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("mouseup",   onDragEnd);
    document.removeEventListener("touchend",  onDragEnd);
    document.removeEventListener("mousemove", onCursorMove);
    document.removeEventListener("keydown",   onKeyDown);

    // Injected DOM nodes
    [leftLens, rightOvl, seam, sparkWrap].forEach((el) => {
      try { document.body.removeChild(el); } catch (_) {}
    });
    try { document.head.removeChild(sparkStyle); } catch (_) {}
    try { document.head.removeChild(fairyStyle); } catch (_) {}

    // Remove --tile-idx from mosaic tiles
    document.querySelectorAll("[class*='mosaicTile']").forEach((tile) => {
      tile.style.removeProperty("--tile-idx");
    });

    // CSS variables
    clearSplitVars();

    // Body class + cursor
    document.body.classList.remove("_sfActive");
    document.documentElement.style.setProperty("--cursor-default", originalCursor);

    // Globals
    window.__sfFairyActive = false;
    delete window.__sfSplitPct;
    delete window.__sfDismiss;
  }

  // Expose dismiss for external callers (tenet, exit8, re-trigger guard).
  window.__sfDismiss   = cleanup;
  window.__sfSplitPct  = splitPct;

  // ── Lifecycle ──────────────────────────────────────────────────────────
  const all = [leftLens, rightOvl, seam, sparkWrap];

  if (reduced) {
    // Skip animation; jump straight to the active state.
    all.forEach((el) => { el.style.opacity = "1"; });
    await wait(HOLD_MS);
    cleanup();
    return;
  }

  // Double rAF ensures the browser has painted before the opacity transition
  // fires, preventing the first frame from being skipped.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  all.forEach((el) => { el.style.opacity = "1"; });

  await wait(HOLD_MS);

  all.forEach((el) => { el.style.opacity = "0"; });
  await wait(SPLIT_MS);

  cleanup();
}
