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

const HOLD_MS  = 60000; // 1 minute (exits cleanly via Esc or EXIT button)
const SPLIT_MS = 900;
const MIN_PCT  = 10;
const MAX_PCT  = 90;

const RETICLE_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" fill="%2300ffcc"/><line x1="12" y1="2" x2="12" y2="8" stroke="%2300ffcc" stroke-width="1.5"/><line x1="12" y1="16" x2="12" y2="22" stroke="%2300ffcc" stroke-width="1.5"/><line x1="2" y1="12" x2="8" y2="12" stroke="%2300ffcc" stroke-width="1.5"/><line x1="16" y1="12" x2="22" y2="12" stroke="%2300ffcc" stroke-width="1.5"/></svg>') 12 12, crosshair`;

const INTERACTIVE_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="9" fill="none" stroke="%23ff0077" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="14" cy="14" r="2.5" fill="%23ff0077"/><line x1="14" y1="1" x2="14" y2="5" stroke="%23ff0077" stroke-width="1.5"/><line x1="14" y1="23" x2="14" y2="27" stroke="%23ff0077" stroke-width="1.5"/><line x1="1" y1="14" x2="5" y2="14" stroke="%23ff0077" stroke-width="1.5"/><line x1="23" y1="14" x2="27" y2="14" stroke="%23ff0077" stroke-width="1.5"/></svg>') 14 14, pointer`;

// Fairy-side mirror of the two cursors above — same shape, opposite palette
// (violet/lilac instead of cyan/magenta). Empty space gets a small sparkle
// wand; real interactive elements get a bigger "bloom" so hover state reads
// the same way it does on the tech side. Kept ≤32x32 — Firefox/Chromium cap
// cursor images at 128x128 and silently ignore anything larger, and desktop
// support is broadly reliable only up to ~32x32.
//
// To swap in a hand-authored .cur instead of these inline SVGs, replace the
// two constants below with (and drop the file in public/ — a bare
// '/fairy-cursor.cur' 404s once the site is served from a gh-pages subpath):
//   const FAIRY_CURSOR = `url('${import.meta.env.BASE_URL}fairy-cursor.cur') 6 6, auto`;
const FAIRY_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><line x1="20" y1="20" x2="9.5" y2="9.5" stroke="%23e8d5f5" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="6" r="5.5" fill="none" stroke="%23c482ff" stroke-width="0.75" opacity="0.35"/><path d="M6 1 L7.3 4.7 L11 6 L7.3 7.3 L6 11 L4.7 7.3 L1 6 L4.7 4.7 Z" fill="%23c482ff"/><circle cx="6" cy="6" r="1.3" fill="%23fffbe8"/></svg>') 6 6, auto`;

const FAIRY_INTERACTIVE_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="9" fill="none" stroke="%23c482ff" stroke-width="1.5" stroke-dasharray="3 2"/><path d="M14 6 L16 12 L22 14 L16 16 L14 22 L12 16 L6 14 L12 12 Z" fill="%23c482ff"/><circle cx="14" cy="14" r="2" fill="%23fffbe8"/></svg>') 14 14, pointer`;

// Shared fairy palette — pink/violet/mint/gold/cyan/blush, reused by the
// ambient sparkles (buildSparkles), the seam butterflies (buildLaserStage),
// and the dust trail (buildFairyTrail) so all three read as one consistent
// fairy theme instead of three separately-tuned color sets.
const FAIRY_COLORS = ["#f9a8d4", "#d8b4fe", "#86efac", "#fde68a", "#a5f3fc", "#fbcfe8"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ─── Shared interactivity test ─────────────────────────────────────────────
// Only semantic / truly-clickable elements — broad class wildcards like
// [class*="card"] match non-interactive wrapper divs and cause false positives.
const INTERACTIVE_SELECTOR = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'label',
  '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
  '[role="tab"]', '[role="menuitem"]', '[role="option"]', '[role="switch"]',
  '[onclick]', '[tabindex]:not([tabindex="-1"])',
].join(', ');

// Walks up at most 4 levels (handles text spans inside buttons, etc.). Uses an
// EXACT cursor === "pointer" match, never a substring check: this site's
// custom cursor chain (see INTERACTIVE_CURSOR below) is a full
// `url(...) 14 14, pointer` value applied via --cursor-default, which every
// element inherits. A `.includes("pointer")` check against that computed
// value is therefore true for EVERY element on the page whenever the pointer
// sits over any one interactive element — it degrades into a global on/off
// flag instead of a per-element test. Single source of truth for both the
// laser stage and the reticle/pointer cursor swap below.
function findInteractiveTarget(el) {
  if (!el || el === document.body || el === document.documentElement) return null;
  let node = el;
  for (let i = 0; i < 4; i++) {
    if (!node || node === document.body) break;
    if (node.matches?.(INTERACTIVE_SELECTOR)) return node;
    if (window.getComputedStyle(node).cursor === "pointer") return node;
    node = node.parentElement;
  }
  return null;
}

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

function lineSegmentIntersection(linePointX, linePointY, lineDirX, lineDirY, segmentStart, segmentEnd) {
  const segmentDirX = segmentEnd.x - segmentStart.x;
  const segmentDirY = segmentEnd.y - segmentStart.y;
  const determinant = lineDirX * segmentDirY - lineDirY * segmentDirX;
  if (Math.abs(determinant) < 1e-8) return null;

  const t =
    ((segmentStart.x - linePointX) * segmentDirY -
      (segmentStart.y - linePointY) * segmentDirX) /
    determinant;
  const u =
    ((segmentStart.x - linePointX) * lineDirY -
      (segmentStart.y - linePointY) * lineDirX) /
    determinant;

  if (u < 0 || u > 1) return null;

  return {
    x: linePointX + t * lineDirX,
    y: linePointY + t * lineDirY,
  };
}

function orderPointsClockwise(points) {
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  centroid.x /= points.length;
  centroid.y /= points.length;

  points.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
}

function signedDistance(px, py, cx, cy, nx, ny) {
  const vectorX = px - cx;
  const vectorY = py - cy;
  return vectorX * nx + vectorY * ny;
}

function buildSplitPolygons(width, height, angleRad) {
  const centerX = width / 2;
  const centerY = height / 2;
  const lineDirX = Math.cos(angleRad);
  const lineDirY = Math.sin(angleRad);
  const normalX = lineDirY;
  const normalY = -lineDirX;

  const viewportCorners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  const viewportEdges = [
    [{ x: 0, y: 0 }, { x: width, y: 0 }],
    [{ x: width, y: 0 }, { x: width, y: height }],
    [{ x: width, y: height }, { x: 0, y: height }],
    [{ x: 0, y: height }, { x: 0, y: 0 }],
  ];

  const rawIntersections = [];
  for (const edge of viewportEdges) {
    const hit = lineSegmentIntersection(
      centerX,
      centerY,
      lineDirX,
      lineDirY,
      edge[0],
      edge[1]
    );
    if (hit) rawIntersections.push(hit);
  }

  const intersections = rawIntersections.filter((point, idx, arr) => {
    return !arr.slice(0, idx).some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 0.5);
  });

  let leftSidePoints = [];
  let rightSidePoints = [];

  for (const corner of viewportCorners) {
    const distance = signedDistance(corner.x, corner.y, centerX, centerY, normalX, normalY);
    if (distance < 0) {
      leftSidePoints.push(corner);
    } else {
      rightSidePoints.push(corner);
    }
  }

  leftSidePoints.push(...intersections);
  rightSidePoints.push(...intersections);

  orderPointsClockwise(leftSidePoints);
  orderPointsClockwise(rightSidePoints);

  const toClipPath = (points) =>
    points.map((point) => `${point.x.toFixed(2)}px ${point.y.toFixed(2)}px`).join(", ");

  return {
    leftClip: `polygon(${toClipPath(leftSidePoints)})`,
    rightClip: `polygon(${toClipPath(rightSidePoints)})`,
    centerX,
    centerY,
    lineDirX,
    lineDirY,
    normalX,
    normalY,
  };
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
    "will-change:backdrop-filter",
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

  const SECTION_TARGETS = [
    "[class*='about-section']",
    "[class*='project-section']",
    "[class*='timelineSection']",
    "[class*='contact-section']",
    // BeyondCode uses styles.section (CSS-module hash is _section_<hash>);
    // target by the stable id attribute instead.
    "#beyond-code",
    // Footer is a native <footer> element with no CSS-module class on the root.
    "footer",
  ];
  const SECTIONS = SECTION_TARGETS.map((s) => "body._sfActive " + s).join(",\n");

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
  /* override the Spotify green glow → amber/gold to match the border */
  box-shadow: 0 0 12px 1px rgba(240, 168, 48, 0.4),
              inset 0 0 30px rgba(240, 168, 48, 0.04) !important;
}
body._sfActive [class*='mosaicCardPinned'] {
  box-shadow: 0 0 20px 3px rgba(240, 168, 48, 0.6),
              inset 0 0 30px rgba(240, 168, 48, 0.06) !important;
}
body._sfActive [class*='spotifyFront'] {
  transition: opacity 0.3s ease !important;
  transition-delay: 0.8s !important;
  /* remove the green scanline bg so it doesn't bleed through as a tint */
  background-image: none !important;
}
body._sfActive [class*='mosaicCard']:hover [class*='spotifyFront'] {
  opacity: 0 !important;
  transition-delay: 0s !important;
}
body._sfActive [class*='spotifyPrompt'] {
  color: #f0a830 !important;
}
body._sfActive [class*='spotifyHint'] {
  color: rgba(240, 168, 48, 0.7) !important;
}

/* 5. Contact inputs / textareas */
body._sfActive input,
body._sfActive textarea,
body._sfActive select {
  border: 1px solid rgba(196, 130, 255, 0.5) !important;
  border-radius: 6px !important;
}
/* Restore validation borders — pseudo-class adds specificity so these beat the
   base rule above even though both carry !important. */
body._sfActive input:invalid,
body._sfActive textarea:invalid {
  border: 2px solid rgba(239, 68, 68, 0.85) !important;
}
body._sfActive input:valid,
body._sfActive textarea:valid {
  border: 2px solid rgba(74, 222, 128, 0.85) !important;
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
/* SF exit button: exempt from generic button overrides — preserve its teal
   circular look so it stays visually aligned with the scroll-up button. */
body._sfActive #_sfExitBtn {
  border: 1px solid #00e5ff !important;
  border-radius: 50% !important;
  background: rgba(13, 13, 13, 0.8) !important;
  box-shadow: none !important;
}
body._sfActive #_sfExitBtn:hover {
  background: rgba(13, 13, 13, 0.8) !important;
  border-color: #00e5ff !important;
  box-shadow: 0 0 10px 2px rgba(0, 229, 255, 0.6) !important;
}
body._sfActive button[aria-label='Scroll to top'] {
  z-index: 99998 !important;
}
/* Responsive sizing — mirrors the scroll-up button's @media (max-width:768px) rule
   so both buttons stay on the same horizontal line at all zoom levels. */
@media (max-width: 768px) {
  body._sfActive #_sfExitBtn {
    width: 38px !important;
    height: 38px !important;
    bottom: 16px !important;
    left: 16px !important;
  }
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

/* 12. Scroll progress bar — during SF the original #progress-bar fill is hidden
    in JS and the battery+vine SVG is injected directly into #progress-container.
    Make the container tall enough for the SVG and let its overflow be visible so
    flowers and leaves can poke above/below the 8px strip. The container stays at
    its natural z-index (9999) so it sits behind the seam and lenses, receiving
    the same backdrop-filter treatment as the rest of the page content.
    Background gradient fills the strip opaquely so page content doesn't bleed
    through the transparent gaps in the SVG (battery cell spacing, vine curves).
    Left = #000 (body bg — inverts to white through left lens, matching the page).
    Right = #0d0015 (fairy body bg — seamless with sections). */
body._sfActive #progress-container {
  height: 8px !important;
  overflow: visible !important;
  background: linear-gradient(
    to right,
    #000 var(--split-abs),
    #0d0015 var(--split-abs)
  ) !important;
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

  const colors = FAIRY_COLORS;
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

// ─── Progress indicator: unified battery + vine with seam-aware side swapping ─
// Single full-width SVG, 8px tall, pinned to the bottom edge of the navbar.
// One clipPath rect grows 0→1000 (viewBox) as the page scrolls, revealing
// both halves as one continuous bar: battery and vine swap sides by seam.

function buildProgressBar(initPct) {
  // Inject the battery+vine SVG directly into the existing #progress-container
  // rather than creating a parallel fixed div. The React Progressbar component
  // already computed and set the correct top/z-index for that element, so this
  // gives us perfect positioning for free — responsive and always flush with the
  // navbar bottom regardless of navbar height changes.
  const wrap = document.getElementById("progress-container");
  const origBar = document.getElementById("progress-bar");
  // Hide the original React fill bar; we own the visuals during SF.
  if (origBar) origBar.style.display = "none";

  // viewBox width tracks the container's actual px width so 1 SVG unit == 1 CSS
  // px at every viewport size — otherwise a fixed viewBox with
  // preserveAspectRatio="none" stretches every cell/leaf/petal horizontally by
  // (viewportWidth / viewBoxWidth), which is why the bar looked elongated.
  let VB_W = wrap?.getBoundingClientRect?.().width || window.innerWidth || 1000;
  VB_W = Math.max(1, VB_W);

  // Public API (initPct, updateSplitProgress svb, clip width) still speaks in
  // 0–1000 "scroll units" so call sites elsewhere don't need to change; convert
  // to px internally at the boundary.
  const seamVb = initPct * 10; // seam in 0–1000 scroll units

  const NS  = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width",  "100%");
  svg.setAttribute("height", "100%");
  // viewBox 8 units tall; battery and vine both centered at y=4.
  svg.setAttribute("viewBox", `0 0 ${VB_W} 8`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.cssText = "display:block;overflow:visible;width:100%;height:100%";

  const defs = document.createElementNS(NS, "defs");

  // Battery cell pattern: 13-unit tile (11px cell + 2px gap), centered at y=4.
  const pat = document.createElementNS(NS, "pattern");
  pat.id = "_sfBatPat";
  pat.setAttribute("patternUnits", "userSpaceOnUse");
  pat.setAttribute("width", "13"); pat.setAttribute("height", "8");
  const pr = document.createElementNS(NS, "rect");
  pr.setAttribute("x", "1");  pr.setAttribute("y", "2");
  pr.setAttribute("width", "11"); pr.setAttribute("height", "4");
  pr.setAttribute("rx", "1.2"); pr.setAttribute("fill", "#00e5ff");
  pat.appendChild(pr);
  defs.appendChild(pat);

  // Single scroll-progress clip rect — drives both halves together.
  const cp = document.createElementNS(NS, "clipPath");
  cp.id = "_sfProgCP";
  const clipR = document.createElementNS(NS, "rect");
  clipR.setAttribute("x", "0"); clipR.setAttribute("y", "-3");
  clipR.setAttribute("width", "0"); clipR.setAttribute("height", "14");
  cp.appendChild(clipR);
  defs.appendChild(cp);

  svg.appendChild(defs);

  // Battery rect (0 → seam), centered at y=4 (y=2, h=4). Real x/width are set
  // by updateSplitProgress() below; these are just placeholders pre-layout.
  const batRect = document.createElementNS(NS, "rect");
  batRect.id = "_sfBatRect";
  batRect.setAttribute("x", "0"); batRect.setAttribute("y", "2");
  batRect.setAttribute("width", "0");
  batRect.setAttribute("height", "4");
  batRect.setAttribute("fill", "url(#_sfBatPat)");
  batRect.setAttribute("clip-path", "url(#_sfProgCP)");
  batRect.style.filter = "drop-shadow(0 0 1.5px rgba(0,229,255,0.5))";
  svg.appendChild(batRect);

  // Vine path (seam → 1000+): tipsy cubic-bezier wave around y=4.
  const vineP = document.createElementNS(NS, "path");
  vineP.id = "_sfVinePath";
  vineP.setAttribute("fill", "none");
  vineP.setAttribute("stroke", "#a855f7");
  vineP.setAttribute("stroke-width", "1.5");
  vineP.setAttribute("stroke-linecap", "round");
  vineP.setAttribute("clip-path", "url(#_sfProgCP)");
  vineP.style.filter = "drop-shadow(0 0 2.5px rgba(168,85,247,0.85))";
  svg.appendChild(vineP);

  // Flower group, also clipped by scroll progress.
  const flowerG = document.createElementNS(NS, "g");
  flowerG.id = "_sfFlowerG";
  flowerG.setAttribute("clip-path", "url(#_sfProgCP)");
  flowerG.style.filter = "drop-shadow(0 0 2px rgba(249,168,212,0.7))";
  svg.appendChild(flowerG);

  // Mark so cleanup knows this SVG was injected by SF.
  svg.id = "_sfProgressSvg";
  wrap.appendChild(svg);

  // Generate a wavy path between two x positions (always left → right).
  function makePath(xStart, xEnd) {
    const period = 90, amp = 2.5, cy = 4;
    let d = "M " + xStart.toFixed(1) + "," + cy;
    let phase = 0;
    for (let x = xStart; x < xEnd; x += period, phase++) {
      const nx = Math.min(x + period, xEnd);
      const yOff = (phase % 2 === 0 ? -amp : amp).toFixed(2);
      const cp1x = (x + (nx - x) * 0.35).toFixed(1);
      const cp2x = (x + (nx - x) * 0.65).toFixed(1);
      d += " C " + cp1x + "," + (parseFloat(yOff) + cy).toFixed(1) +
           " "  + cp2x + "," + (parseFloat(yOff) + cy).toFixed(1) +
           " "  + nx.toFixed(1) + "," + cy;
    }
    return d;
  }

  // Approximate the vine's y at any SVG-space x (for flower placement).
  function vineYAt(x, xStart) {
    const period = 90, amp = 2.5, cy = 4;
    const dx = x - xStart;
    const phase = Math.floor(dx / period);
    const t = (dx % period) / period;
    return cy + (phase % 2 === 0 ? -amp : amp) * Math.sin(t * Math.PI);
  }

  const FLOWER_COLS = ["#f9a8d4", "#d8b4fe", "#fbcfe8", "#c4b5fd"];
  // Element pools grow on demand and are reused across relayouts (resize, drag,
  // spin) — no per-frame allocation once warm. Spacing below is now real px, so
  // wide viewports need more leaves/flowers than the old fixed MAX_* caps
  // allowed; a generous ceiling still guards against a pathological width.
  const POOL_CEILING = 400;
  const leafEls = [], petalEls = [], dotEls = [];
  function makeLeaf() {
    const el = document.createElementNS(NS, "ellipse");
    el.setAttribute("rx", "2.6"); el.setAttribute("ry", "1.0");
    el.setAttribute("fill", "#86efac"); el.setAttribute("opacity", "0.9");
    el.setAttribute("display", "none");
    flowerG.appendChild(el); return el;
  }
  function makePetal() {
    const el = document.createElementNS(NS, "circle");
    el.setAttribute("r", "1.6"); el.setAttribute("display", "none");
    flowerG.appendChild(el); return el;
  }
  function makeDot() {
    const el = document.createElementNS(NS, "circle");
    el.setAttribute("r", "1.1"); el.setAttribute("fill", "#fde68a");
    el.setAttribute("display", "none");
    flowerG.appendChild(el); return el;
  }
  function leafAt(i) {
    if (i >= POOL_CEILING) return null;
    while (leafEls.length <= i) leafEls.push(makeLeaf());
    return leafEls[i];
  }
  function petalAt(i) {
    if (i >= POOL_CEILING * 5) return null;
    while (petalEls.length <= i) petalEls.push(makePetal());
    return petalEls[i];
  }
  function dotAt(i) {
    if (i >= POOL_CEILING) return null;
    while (dotEls.length <= i) dotEls.push(makeDot());
    return dotEls[i];
  }

  // Leaves alternate above/below every 28px; flowers every 72px.
  function buildFlowers(xStart, xEnd) {
    let li = 0;
    for (let x = xStart + 18; x < xEnd - 10; x += 28, li++) {
      const leaf = leafAt(li);
      if (!leaf) break;
      const vy   = vineYAt(x, xStart);
      const side = (Math.floor((x - xStart) / 28) % 2 === 0) ? -1 : 1;
      const lx = x, ly = vy + side * 2.5;
      leaf.setAttribute("cx", lx.toFixed(2));
      leaf.setAttribute("cy", ly.toFixed(2));
      leaf.setAttribute("transform",
        "rotate(" + (side * 38) + "," + lx.toFixed(2) + "," + ly.toFixed(2) + ")");
      leaf.removeAttribute("display");
    }
    for (; li < leafEls.length; li++) leafEls[li].setAttribute("display", "none");

    let fi = 0;
    for (let x = xStart + 50; x < xEnd - 8; x += 72, fi++) {
      const dot = dotAt(fi);
      if (!dot) break;
      const vy    = vineYAt(x, xStart);
      const color = FLOWER_COLS[fi % FLOWER_COLS.length];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
        const petal = petalAt(fi * 5 + p);
        if (!petal) continue;
        petal.setAttribute("cx", (x + Math.cos(a) * 2.6).toFixed(2));
        petal.setAttribute("cy", (vy + Math.sin(a) * 2.6).toFixed(2));
        petal.setAttribute("fill", color);
        petal.removeAttribute("display");
      }
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", vy.toFixed(2));
      dot.removeAttribute("display");
    }
    for (; fi < dotEls.length; fi++) {
      for (let p = 0; p < 5; p++) {
        const petal = petalEls[fi * 5 + p];
        if (petal) petal.setAttribute("display", "none");
      }
      dotEls[fi].setAttribute("display", "none");
    }
  }

  // 0–1000 scroll unit -> px (viewBox is VB_W wide, not 1000).
  const toX = (u) => (u / 1000) * VB_W;

  // Cached so resize can re-run layout at the new width without a scroll/drag event.
  let lastSvb = seamVb, lastTechOnLeft = true;

  // Single update: keep battery and vine on the correct side of the seam.
  function updateSplitProgress(svb, techOnLeft = true) {
    lastSvb = svb; lastTechOnLeft = techOnLeft;
    const split = toX(Math.max(0, Math.min(1000, svb)));
    const full = VB_W;
    const techStart = techOnLeft ? 0 : split;
    const techEnd = techOnLeft ? split : full;
    const fairyStart = techOnLeft ? split : 0;
    const fairyEnd = techOnLeft ? full : split;

    batRect.setAttribute("x", String(Math.min(techStart, techEnd)));
    batRect.setAttribute("width", String(Math.abs(techEnd - techStart)));
    vineP.setAttribute("d", makePath(fairyStart, fairyEnd));
    buildFlowers(fairyStart, fairyEnd);
  }
  updateSplitProgress(seamVb, true); // initial render (classic split starts tech-left)

  // Re-measure the container width and re-lay everything out — called on resize.
  function measureVbW() {
    const w = wrap?.getBoundingClientRect?.().width || window.innerWidth || 1000;
    VB_W = Math.max(1, w);
    svg.setAttribute("viewBox", `0 0 ${VB_W} 8`);
  }
  function resizeProgressBar() {
    measureVbW();
    updateSplitProgress(lastSvb, lastTechOnLeft);
  }

  return { wrap, origBar, clipR, updateSplitProgress, resizeProgressBar, getVbW: () => VB_W };
}

// Drives the unified clip rect — returns a cancel fn for cleanup.
// getVbW returns the SVG's current viewBox width (px) so the clip stays correct
// across resizes, since the viewBox is no longer a fixed 0–1000.
function startProgressTick(clipR, getVbW) {
  let raf = null;
  function tick() {
    raf = requestAnimationFrame(tick);
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const range =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = range > 0 ? Math.max(0, Math.min((scrollTop / range) * 100, 100)) : 0;
    clipR.setAttribute("width", ((pct / 100) * getVbW()).toFixed(1));
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

// ─── Draggable seam ────────────────────────────────────────────────────────
function buildSeam(isSpinMode) {
  const el = document.createElement("div");
  el.id = "_splitFictionSeam";
  if (isSpinMode) {
    el.style.cssText = [
      "position:fixed",
      "top:50%",
      "left:50%",
      "width:220vmax",
      "height:10px",
      "transform:translate(-50%,-50%) rotate(90deg)",
      "z-index:99993",
      "pointer-events:none",
      "background:linear-gradient(90deg,#2ba2a2,#fff,#f472b6)",
      "box-shadow:0 0 18px 4px rgba(255,255,255,.7)",
      "opacity:0",
      "transition:opacity " + SPLIT_MS + "ms ease",
    ].join(";");
  } else {
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
  }
  return el;
}

// ─── Laser pew-pew audio ────────────────────────────────────────────────────
// One shared, lazily-created context (never one-per-shot — at a 90ms fire
// rate that would leak a context every 90ms). Closed and nulled by destroy().
let _laserCtx = null;
let _lastPewAt = 0;

function playPew() {
  if (prefersReducedMotion()) return;
  if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) return;
  const now = performance.now();
  if (now - _lastPewAt < 60) return; // rate limit — never faster than the fire interval
  _lastPewAt = now;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_laserCtx) _laserCtx = new AudioCtx();
    if (_laserCtx.state === "suspended") _laserCtx.resume();

    const t = _laserCtx.currentTime;
    const osc = _laserCtx.createOscillator();
    const gain = _laserCtx.createGain();
    osc.type = "sawtooth";
    // Downward pitch sweep = the classic "pew". Slight random start freq so a
    // held burst doesn't sound like one looped sample.
    osc.frequency.setValueAtTime(820 + Math.random() * 160, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.09);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain);
    gain.connect(_laserCtx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  } catch (_) {}
}

// Bounded ray (bolt travel, t in [0, maxDist]) vs. bounded segment (seam,
// u in [0, 1]) intersection. Unlike lineSegmentIntersection above — which
// treats its first argument as an unbounded line — both inputs here are
// bounded, since a bolt must stop at the seam and the seam segment is finite.
function raySegmentIntersection(originX, originY, dirX, dirY, maxDist, segA, segB) {
  const segX = segB.x - segA.x;
  const segY = segB.y - segA.y;
  const det = dirX * segY - dirY * segX;
  if (Math.abs(det) < 1e-8) return null; // parallel (e.g. classic mode's vertical seam)
  const dx = segA.x - originX;
  const dy = segA.y - originY;
  const t = (dx * segY - segX * dy) / det;
  const u = (dx * dirY - dirX * dy) / det;
  if (t < 0 || t > maxDist || u < 0 || u > 1) return null;
  return { x: originX + t * dirX, y: originY + t * dirY, t };
}

// ─── Laser Cursor Playground Stage (Sci-Fi / Left side) ────────────────────
// Empty space: hold-to-fire aimed bolts, straight up, repeating while held.
// Interactive elements: a radial "boom" burst + impact ring + guaranteed
// highlight — every time, deterministically, on pointerdown (not click), so
// neither a slight drag nor a keyboard-synthesized activation loses it.
//
// isLeftSciFi(x,y)   — is this point on the tech side.
// getSeamSegment()   — {a,b} endpoints of the current seam, for bolt-vs-seam
//                       clipping and the butterfly handoff. Burst bolts fly
//                       in every direction so they can cross it in classic
//                       mode too, not just spin mode; the straight-up aimed
//                       bolts are parallel to the classic vertical seam and
//                       never cross it there, by design.
// reduced            — prefers-reduced-motion: mutes audio/butterflies and
//                       fires single bolts instead of a repeating interval.
function buildLaserStage(isLeftSciFi, getSeamSegment, reduced) {
  const stageStyle = document.createElement("style");
  stageStyle.id = "_sfLaserStyle";
  stageStyle.textContent = `
    #_sfLaserStage, #_sfButterflyStage {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
    }
    #_sfButterflyStage { z-index: 99992; }
    ._sfLaser {
      position: fixed;
      width: 5px;
      height: 34px;
      border-radius: 3px;
      pointer-events: none;
      transform-origin: center;
      will-change: transform, opacity;
      z-index: 99999;
      /* Warm dark rim, not #000 — a black halo is what made the old bolt
         look cut out of the bright inverted lens field. */
      filter: drop-shadow(0 0 1px rgba(60, 20, 0, 0.85));
    }
    /* Three-color plasma family pushed to the far ends of the warm range —
       pure red, magenta, and pure yellow — so they're distinguishable at a
       glance even mid-flight and glowing. The prior orange/gold pair sat
       only ~25° apart on the wheel and still read as one color; this trio
       is spread ~55°+ apart everywhere. All three are still on the warm
       side, opposite the tech-side cyan (#00e5ff). Every variant fades to
       transparent on BOTH ends — no hard edge anywhere. */
    ._sfLaser.scarlet {
      background: linear-gradient(to bottom,
        rgba(255, 217, 204, 0) 0%, #ffd9cc 14%, #ff2200 46%,
        rgba(140, 20, 0, 0.55) 78%, rgba(140, 20, 0, 0) 100%);
      box-shadow: 0 0 6px 1px rgba(255, 110, 70, 0.9), 0 0 14px 3px rgba(255, 34, 0, 0.55);
    }
    ._sfLaser.magenta {
      background: linear-gradient(to bottom,
        rgba(255, 224, 240, 0) 0%, #ffe0f0 14%, #ff0077 46%,
        rgba(153, 0, 68, 0.55) 78%, rgba(153, 0, 68, 0) 100%);
      box-shadow: 0 0 6px 1px rgba(255, 90, 170, 0.9), 0 0 14px 3px rgba(255, 0, 119, 0.55);
    }
    ._sfLaser.gold {
      background: linear-gradient(to bottom,
        rgba(255, 252, 204, 0) 0%, #fffccc 14%, #ffee00 46%,
        rgba(140, 128, 0, 0.55) 78%, rgba(140, 128, 0, 0) 100%);
      box-shadow: 0 0 6px 1px rgba(255, 238, 90, 0.9), 0 0 14px 3px rgba(255, 238, 0, 0.55);
    }
    ._sfFlash {
      position: fixed;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle, #fff6e0 0%, rgba(255, 150, 40, 0.85) 35%, rgba(255, 80, 0, 0) 70%);
      box-shadow: 0 0 12px 3px rgba(255, 150, 40, 0.8);
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: _sfFlashPop 0.25s ease-out forwards;
      z-index: 99999;
    }
    @keyframes _sfFlashPop {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
    }
    ._sfImpact {
      position: fixed;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 122, 26, 0.9);
      box-shadow: 0 0 10px 2px rgba(255, 122, 26, 0.5);
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: _sfImpactPop 0.32s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
      z-index: 99999;
    }
    @keyframes _sfImpactPop {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.35); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.9); }
    }
    ._sfButterfly {
      position: fixed;
      width: 15px;
      height: 13px;
      pointer-events: none;
      z-index: 99992;
      will-change: transform, opacity;
    }
    ._sfButterfly svg {
      display: block;
      width: 100%;
      height: 100%;
      animation: _sfWingFlap 0.26s ease-in-out infinite;
    }
    @keyframes _sfWingFlap {
      0%, 100% { transform: scaleX(1); }
      50%      { transform: scaleX(0.4); }
    }
  `;
  document.head.appendChild(stageStyle);

  const stage = document.createElement("div");
  stage.id = "_sfLaserStage";
  document.body.appendChild(stage);

  const butterflyStage = document.createElement("div");
  butterflyStage.id = "_sfButterflyStage";
  document.body.appendChild(butterflyStage);

  // ── Managed timers (so destroy() can't leak setTimeout callbacks) ────────
  const pendingTimers = new Set();
  function later(fn, ms) {
    const id = setTimeout(() => { pendingTimers.delete(id); fn(); }, ms);
    pendingTimers.add(id);
    return id;
  }

  // ── Bolt pool — avoids a createElement + remove() per shot at 90ms ───────
  const POOL_SIZE = 24;
  const boltPool = [];
  function getBoltEl() {
    for (let i = 0; i < boltPool.length; i++) {
      if (!boltPool[i]._busy) return boltPool[i];
    }
    const el = document.createElement("div");
    el.style.display = "none";
    stage.appendChild(el);
    boltPool.push(el);
    return el;
  }

  const boltColors = ["scarlet", "magenta", "gold"];

  // Guarantees a hover/theme rule elsewhere on the page can never mask this
  // highlight — inline !important beats any author-stylesheet !important
  // regardless of selector specificity, which a `.className` toggle can't.
  // (The fairy stylesheet's own `[class*='button']:hover` rule has higher
  // specificity than a single class and was silently winning that fight,
  // which is why the highlight only ever showed up on the terminal input —
  // the one interactive element with no "button"-named class to collide with.)
  function flashHit(targetEl) {
    if (!targetEl) return;
    const prevValue = targetEl.style.getPropertyValue("box-shadow");
    const prevPriority = targetEl.style.getPropertyPriority("box-shadow");
    targetEl.style.setProperty("box-shadow", "0 0 14px 3px rgba(255, 122, 26, 0.6)", "important");
    later(() => {
      if (prevValue) targetEl.style.setProperty("box-shadow", prevValue, prevPriority);
      else targetEl.style.removeProperty("box-shadow");
    }, 260);
  }

  const fairyColors = FAIRY_COLORS;
  function spawnButterfly(x, y) {
    if (reduced) return;
    const color = fairyColors[Math.floor(Math.random() * fairyColors.length)];
    const el = document.createElement("div");
    el.className = "_sfButterfly";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.innerHTML = `<svg viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="10" rx="7" ry="8" fill="${color}" opacity="0.85"/><ellipse cx="17" cy="10" rx="7" ry="8" fill="${color}" opacity="0.85"/><line x1="12" y1="4" x2="12" y2="16" stroke="rgba(0,0,0,0.3)" stroke-width="1"/></svg>`;
    butterflyStage.appendChild(el);

    // Longer, farther drift so the extended lifetime doesn't read as hovering
    // in place.
    const dx = 60 + Math.random() * 80;
    const dy = -(80 + Math.random() * 100);
    const midX = dx * 0.5 + (Math.random() * 20 - 10);
    const midY = dy * 0.6;
    const anim = el.animate(
      [
        { transform: "translate(-50%,-50%) translate(0px,0px) rotate(0deg)", opacity: 0 },
        { transform: `translate(-50%,-50%) translate(${midX}px,${midY}px) rotate(${(Math.random() * 30 - 15).toFixed(1)}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${(Math.random() * 40 - 20).toFixed(1)}deg)`, opacity: 0 },
      ],
      { duration: 2600, easing: "ease-in-out" }
    );
    anim.onfinish = () => el.remove();
  }

  // ── Firing session state (reset per pointerdown / per burst) ─────────────
  // Guarantees at least one butterfly per session once the seam is crossed,
  // then ramps up further with more crossings — "don't spawn one per bolt,
  // but never too few".
  let sessionCrossings = 0;
  let sessionButterflies = 0;
  let lastButterflyAt = 0;

  function resetSession() {
    sessionCrossings = 0;
    sessionButterflies = 0;
  }

  function onSeamCross(px, py) {
    sessionCrossings++;
    const wantCount = Math.max(1, Math.round(sessionCrossings * 0.6));
    const now = performance.now();
    if (sessionButterflies < wantCount && now - lastButterflyAt > 150) {
      lastButterflyAt = now;
      sessionButterflies++;
      spawnButterfly(px, py);
    }
  }

  function spawnLaser(x, y, angleDeg, distance) {
    const flash = document.createElement("div");
    flash.className = "_sfFlash";
    flash.style.left = x + "px";
    flash.style.top = y + "px";
    stage.appendChild(flash);
    later(() => flash.remove(), 250);
    playPew();

    let dist = distance || (300 + Math.random() * 250);
    const duration = 500 + Math.random() * 200;

    // Clip the bolt at the seam and hand off to a butterfly, instead of
    // letting it fly through into the fairy half.
    const theta = (angleDeg * Math.PI) / 180;
    const dirX = Math.sin(theta);
    const dirY = -Math.cos(theta);
    const seam = getSeamSegment?.();
    let crossPoint = null;
    if (seam) {
      const hit = raySegmentIntersection(x, y, dirX, dirY, dist, seam.a, seam.b);
      if (hit) {
        dist = Math.max(6, hit.t);
        crossPoint = hit;
      }
    }

    const laser = getBoltEl();
    laser._busy = true;
    laser.className = "_sfLaser " + boltColors[Math.floor(Math.random() * boltColors.length)];
    laser.style.display = "";
    laser.style.left = x + "px";
    laser.style.top = y + "px";
    laser.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
    if (laser._anim) laser._anim.cancel();

    const anim = laser.animate(
      [
        { transform: `translate(-50%,-50%) rotate(${angleDeg}deg) translateY(0px) scaleY(0.7)`, opacity: 0 },
        { transform: `translate(-50%,-50%) rotate(${angleDeg}deg) translateY(-${(dist * 0.18).toFixed(1)}px) scaleY(1.25)`, opacity: 1, offset: 0.12 },
        { transform: `translate(-50%,-50%) rotate(${angleDeg}deg) translateY(-${dist}px) scaleY(1)`, opacity: 0 },
      ],
      { duration, easing: "cubic-bezier(0.15, 0.6, 0.4, 1)" }
    );
    laser._anim = anim;
    anim.onfinish = () => { laser._busy = false; laser.style.display = "none"; };

    if (crossPoint) onSeamCross(crossPoint.x, crossPoint.y);
  }

  function spawnAimedLaser(x, y) {
    // Shoot straight up (angleDeg = 0).
    spawnLaser(x, y, 0, 450);
  }

  // The "boom" — a radial burst of bolts in every direction. Since these
  // (unlike the aimed hold-fire bolts) aren't confined to straight-up, one
  // fired near the seam can genuinely cross it and hand off to a butterfly,
  // even in classic (non-spin) mode.
  function spawnBurst(x, y, count) {
    resetSession();
    const n = count || 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      const angleDeg = Math.random() * 360;
      const dist = 220 + Math.random() * 300;
      later(() => spawnLaser(x, y, angleDeg, dist), i * 12);
    }
  }

  function spawnImpact(x, y, targetEl) {
    const ring = document.createElement("div");
    ring.className = "_sfImpact";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    stage.appendChild(ring);
    later(() => ring.remove(), 340);
    flashHit(targetEl);
  }

  let fireInterval = null;
  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;

  function stopFiring() {
    if (fireInterval) {
      clearInterval(fireInterval);
      fireInterval = null;
    }
  }

  function startFiring(x, y) {
    if (!isLeftSciFi(x, y)) return;
    stopFiring();
    lastX = x; lastY = y;
    resetSession();
    spawnAimedLaser(x, y);
    if (reduced) return; // single bolt only — no repeating interval
    fireInterval = setInterval(() => {
      if (isLeftSciFi(lastX, lastY)) {
        spawnAimedLaser(lastX, lastY);
      } else {
        stopFiring();
      }
    }, 90);
  }

  // Uniform in the sense that asked for: EVERY interactive element gets the
  // exact same treatment, deterministically, on every attempt — impact ring +
  // guaranteed highlight (via flashHit's inline !important, immune to any
  // per-section hover rule) + the boom burst. Empty space instead gets
  // hold-to-fire aimed bolts. Both paths key off the same shared
  // findInteractiveTarget() test and both fire on pointerdown (not click),
  // so neither a slight drag nor a keyboard-synthesized activation loses the
  // effect the way the old click-only burst did.
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (!isLeftSciFi(e.clientX, e.clientY)) return;
    if (e.target.closest("#_sfExitBtn") || e.target.closest("#_splitFictionSeam")) return;
    // Keyboard-synthesized activation reports clientX/Y === 0 — fall back to
    // the last known real pointer position instead of firing from the corner.
    const x = e.clientX || lastX;
    const y = e.clientY || lastY;
    lastX = x; lastY = y;
    const hitEl = findInteractiveTarget(e.target);
    if (hitEl) {
      spawnImpact(x, y, hitEl);
      spawnBurst(x, y);
    } else {
      startFiring(x, y);
    }
  };

  const handlePointerMove = (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
  };

  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("pointermove", handlePointerMove);

  window.addEventListener("pointerup", stopFiring, true);
  window.addEventListener("pointercancel", stopFiring, true);
  // Bubble-phase, on the root element only — fires when the pointer actually
  // leaves the viewport. The previous capture-phase listener on `window` was
  // (mis)triggered by mouseleave on every DOM element boundary crossed while
  // dragging, which is why holding the beam felt like it randomly cut out.
  document.documentElement.addEventListener("mouseleave", stopFiring);
  window.addEventListener("blur", stopFiring);

  const destroy = () => {
    stopFiring();
    document.removeEventListener("pointerdown", handlePointerDown);
    document.removeEventListener("pointermove", handlePointerMove);

    window.removeEventListener("pointerup", stopFiring, true);
    window.removeEventListener("pointercancel", stopFiring, true);
    document.documentElement.removeEventListener("mouseleave", stopFiring);
    window.removeEventListener("blur", stopFiring);

    pendingTimers.forEach((id) => clearTimeout(id));
    pendingTimers.clear();

    if (_laserCtx) {
      try { _laserCtx.close(); } catch (_) {}
      _laserCtx = null;
    }

    try { stage.remove(); } catch (_) {}
    try { butterflyStage.remove(); } catch (_) {}
    try { stageStyle.remove(); } catch (_) {}
  };

  return { destroy };
}

// ─── Fairy Dust Trail (Fairy / Right side) ─────────────────────────────────
// Mirrors buildLaserStage's structure and teardown contract. Empty space and
// interactive elements get the same pointer-follow dust trail (no separate
// "aim" mode — fairy dust doesn't target); pointerdown sprays a radial bloom.
//
// isRightFairy(x,y) — is this point on the fairy side.
// getSeamSegment()  — {a,b} endpoints of the current seam, reused from the
//                      laser stage's own geometry helper for the reverse
//                      handoff: a dust particle whose drift crosses the seam
//                      spawns a tech spark on the far side — the inverse of
//                      onSeamCross's bolt-becomes-butterfly handoff.
// reduced           — prefers-reduced-motion: disables the trail and bloom
//                      entirely (mirrors playPew's pointer:coarse guard —
//                      touch has no hover cursor, so the trail never attaches).
function buildFairyTrail(isRightFairy, getSeamSegment, reduced) {
  const stageStyle = document.createElement("style");
  stageStyle.id = "_sfFairyTrailStyle";
  stageStyle.textContent = `
    #_sfFairyTrailStage, #_sfTechSparkStage {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99994;
    }
    /* Classic mode: rectangle clip tracks --split-abs with zero JS per frame,
       same "single CSS-var writer" philosophy as the rest of this file. Spin
       mode overrides this inline with the rotating polygon (see
       applySpinFromPoint / onSpinPointerMove) — same pattern as sparkWrap. */
    #_sfFairyTrailStage { clip-path: inset(0 0 0 var(--split-abs)); }
    /* Tech spark stage is deliberately NOT clipped — same reason
       _sfButterflyStage isn't: it renders the reverse-handoff spark on the
       tech side, past the seam from where the trail stage is clipped. */
    ._sfDust, ._sfDustStar {
      position: absolute;
      pointer-events: none;
      will-change: transform, opacity;
    }
    ._sfDust { border-radius: 50%; }
    ._sfBloomRing {
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid rgba(196, 130, 255, 0.9);
      box-shadow: 0 0 10px 2px rgba(196, 130, 255, 0.5);
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: _sfBloomPop 0.32s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
    }
    @keyframes _sfBloomPop {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.35); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.9); }
    }
    ._sfTechSpark {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #00e5ff;
      box-shadow: 0 0 6px 2px rgba(0, 229, 255, 0.8);
      pointer-events: none;
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(stageStyle);

  const stage = document.createElement("div");
  stage.id = "_sfFairyTrailStage";
  document.body.appendChild(stage);

  const sparkStage = document.createElement("div");
  sparkStage.id = "_sfTechSparkStage";
  document.body.appendChild(sparkStage);

  // ── Managed timers (mirrors buildLaserStage's later()) ───────────────────
  const pendingTimers = new Set();
  function later(fn, ms) {
    const id = setTimeout(() => { pendingTimers.delete(id); fn(); }, ms);
    pendingTimers.add(id);
    return id;
  }

  // ── Pools — dust motes, star sparkles, tech sparks (mirrors boltPool's
  // _busy-flag reuse pattern; SVG markup for stars is written once at
  // pool-fill time instead of re-set on every reuse) ────────────────────────
  function makePool(container, fill) {
    const pool = [];
    return function get() {
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i]._busy) return pool[i];
      }
      const el = fill();
      el.style.display = "none";
      container.appendChild(el);
      pool.push(el);
      return el;
    };
  }
  const getDustEl = makePool(stage, () => {
    const el = document.createElement("div");
    el.className = "_sfDust";
    return el;
  });
  const getStarEl = makePool(stage, () => {
    const el = document.createElement("div");
    el.className = "_sfDustStar";
    el.innerHTML = `<svg viewBox="0 0 12 12" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><path d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z" fill="currentColor"/></svg>`;
    return el;
  });
  const getTechSparkEl = makePool(sparkStage, () => {
    const el = document.createElement("div");
    el.className = "_sfTechSpark";
    return el;
  });

  // ── Reverse seam handoff — own budget, independent of the laser stage's
  // sessionCrossings/resetSession; sharing that counter would double-count
  // against the bolt-to-butterfly budget in the other closure. ─────────────
  let fairyCrossings = 0;
  let techSparks = 0;
  let lastSparkAt = 0;
  function spawnTechSpark(x, y) {
    const el = getTechSparkEl();
    el._busy = true;
    el.style.display = "";
    el.style.left = x + "px";
    el.style.top = y + "px";
    if (el._anim) el._anim.cancel();
    const jx = Math.random() * 16 - 8;
    const jy = Math.random() * 16 - 8;
    const anim = el.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${jx}px), calc(-50% + ${jy}px)) scale(0.3)`,
          opacity: 0,
        },
      ],
      { duration: 750 + Math.random() * 200, easing: "ease-out" }
    );
    el._anim = anim;
    anim.onfinish = () => { el._busy = false; el.style.display = "none"; };
  }

  function onFairySeamCross(px, py) {
    fairyCrossings++;
    const wantCount = Math.max(1, Math.round(fairyCrossings * 0.6));
    const now = performance.now();
    if (techSparks < wantCount && now - lastSparkAt > 150) {
      lastSparkAt = now;
      techSparks++;
      spawnTechSpark(px, py);
    }
  }

  // ── Particle core — 70% dust motes, 30% star sparkles, baked drift arc.
  // (dx, dy, duration) let the same emitter serve both the falling trail
  // (small sideways drift, downward gravity) and the radial bloom burst
  // (large drift in every direction) without duplicating the animation code.
  function emitParticle(x, y, dx, dy, duration) {
    const isStar = Math.random() < 0.3;
    const color = FAIRY_COLORS[Math.floor(Math.random() * FAIRY_COLORS.length)];
    const el = isStar ? getStarEl() : getDustEl();
    el._busy = true;
    el.style.display = "";
    el.style.left = x + "px";
    el.style.top = y + "px";

    if (isStar) {
      const size = 8 + Math.random() * 6;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.color = color;
      el.style.background = "";
      el.style.boxShadow = "";
    } else {
      const size = 2 + Math.random() * 4;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.background = color;
      el.style.boxShadow = `0 0 ${(size * 2.5).toFixed(0)}px 1px ${color}`;
    }

    const rot = Math.random() < 0.5 ? -180 : 180;
    if (el._anim) el._anim.cancel();
    const anim = el.animate(
      [
        { transform: "translate(-50%,-50%) scale(0.4) rotate(0deg)", opacity: 0 },
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1, offset: 0.18 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.15) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "ease-out" }
    );
    el._anim = anim;
    anim.onfinish = () => { el._busy = false; el.style.display = "none"; };

    // Reverse seam handoff: does this particle's drift cross the seam?
    const seam = getSeamSegment?.();
    if (seam) {
      const dist = Math.hypot(dx, dy);
      if (dist > 0.001) {
        const hit = raySegmentIntersection(x, y, dx / dist, dy / dist, dist, seam.a, seam.b);
        if (hit) onFairySeamCross(hit.x, hit.y);
      }
    }
  }

  function spawnParticle(x, y) {
    const dx = Math.random() * 60 - 30;
    const dy = 30 + Math.random() * 60; // downward = gravity
    emitParticle(x, y, dx, dy, 700 + Math.random() * 500);
  }

  function spawnBloom(x, y) {
    const ring = document.createElement("div");
    ring.className = "_sfBloomRing";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    stage.appendChild(ring);
    later(() => ring.remove(), 340);

    const n = 10 + Math.floor(Math.random() * 9);
    for (let i = 0; i < n; i++) {
      later(() => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 100;
        emitParticle(x, y, Math.cos(angle) * dist, Math.sin(angle) * dist, 500 + Math.random() * 300);
      }, i * 12);
    }
  }

  // ── Input — pointermove tracks position and distance-gates the trail spawn
  // (density tracks pointer speed instead of a fixed timer); pointerdown
  // sprays a bloom. Skipped entirely under reduced-motion / coarse pointer —
  // touch has no hover cursor, so there's nothing to attach a trail to.
  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const active = !reduced && !coarsePointer;

  let lastX = 0;
  let lastY = 0;
  let lastEmitX = null;
  let lastEmitY = null;
  const SPAWN_DIST = 7;

  function handlePointerMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!isRightFairy(lastX, lastY)) {
      lastEmitX = null;
      lastEmitY = null;
      return;
    }
    if (lastEmitX === null || Math.hypot(lastX - lastEmitX, lastY - lastEmitY) >= SPAWN_DIST) {
      lastEmitX = lastX;
      lastEmitY = lastY;
      spawnParticle(lastX, lastY);
    }
  }

  function handlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (!isRightFairy(e.clientX, e.clientY)) return;
    if (e.target.closest("#_sfExitBtn") || e.target.closest("#_splitFictionSeam")) return;
    // Keyboard-synthesized activation reports clientX/Y === 0 — same fallback
    // as handlePointerDown in buildLaserStage.
    spawnBloom(e.clientX || lastX, e.clientY || lastY);
  }

  if (active) {
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerdown", handlePointerDown);
  }

  const destroy = () => {
    if (active) {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
    }
    pendingTimers.forEach((id) => clearTimeout(id));
    pendingTimers.clear();
    try { stage.remove(); } catch (_) {}
    try { sparkStage.remove(); } catch (_) {}
    try { stageStyle.remove(); } catch (_) {}
  };

  return { stage, destroy };
}

// ─── Main effect ───────────────────────────────────────────────────────────
export default async function splitFiction(options = {}) {
  // Idempotent guard — seam id acts as the "running" sentinel.
  if (document.getElementById("_splitFictionSeam")) return;
  // Mutual exclusion with exit8.
  if (window.__exit8Active) return;

  const reduced = prefersReducedMotion();
  const isSpinMode = options?.mode === "spin";
  let splitPct  = 50;
  let splitAngle = Math.PI / 2;
  let spinGeometry = null;

  // Capture cursor before any SF changes so cleanup can fully restore it.
  // Both vars: index.css's `* a, button { cursor: var(--cursor-pointer) }`
  // has higher specificity than the `* { cursor: var(--cursor-default) }`
  // fallback, so real <a>/<button> elements never honor --cursor-default —
  // updateCursor() below has to write to both or the reticle can never show
  // over a real link/button on the tech side.
  const originalCursor = getComputedStyle(document.documentElement)
    .getPropertyValue("--cursor-default").trim();
  const originalCursorPointer = getComputedStyle(document.documentElement)
    .getPropertyValue("--cursor-pointer").trim();

  // ── Activate ──────────────────────────────────────────────────────────
  // Set CSS vars BEFORE adding _sfActive — the fairy supplement stylesheet
  // reads var(--split-abs) immediately on activation. If vars aren't set yet,
  // the gradient hard-stop defaults to 0px and the whole page flips fairy.
  setSplitVars(splitPct);
  window.__sfFairyActive = true;
  document.body.classList.add("_sfActive");
  if (isSpinMode) document.body.classList.add("_sfSpinMode");

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
  const seam       = buildSeam(isSpinMode);
  const { wrap: sparkWrap, styleEl: sparkStyle } = buildSparkles();
  const { wrap: progWrap, origBar: progOrigBar, clipR: progClipR, updateSplitProgress, resizeProgressBar, getVbW } = buildProgressBar(splitPct);
  const stopProgressTick = startProgressTick(progClipR, getVbW);
  let _progResizeRaf = null;
  function scheduleProgResize() {
    if (_progResizeRaf !== null) return;
    _progResizeRaf = requestAnimationFrame(() => {
      _progResizeRaf = null;
      resizeProgressBar();
    });
  }
  // Cached once; #progress-container is position:fixed so Y is stable until resize.
  let _cachedProgBarY = null;

  document.body.appendChild(leftLens);
  document.body.appendChild(rightOvl);
  document.body.appendChild(seam);
  document.body.appendChild(sparkWrap);

  if (isSpinMode) {
    leftLens.style.width = "100vw";
    rightOvl.style.left = "0";
    rightOvl.style.right = "0";
    sparkWrap.style.left = "0";
    sparkWrap.style.right = "0";
  }
  // progWrap is #progress-container (already in DOM) — no appendChild needed.

  // ── Exit button (bottom-left, slides in like exit8's EXIT btn) ─────────
  const exitBtn = document.createElement("button");
  exitBtn.id = "_sfExitBtn";
  exitBtn.title = "Exit Split Fiction (Esc)";
  exitBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="1" x2="13" y2="13" stroke="#00e5ff" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="1" x2="1" y2="13" stroke="#00e5ff" stroke-width="2" stroke-linecap="round"/></svg>`;
  exitBtn.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "left:-80px",
    "width:42px",
    "height:42px",
    "z-index:99998",
    "background:rgba(13,13,13,0.8)",
    "border:1px solid #00e5ff",
    "border-radius:50%",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:0",
    "cursor:var(--cursor-pointer,pointer)",
    "transition:left 0.45s cubic-bezier(0.22,0.61,0.36,1),box-shadow 0.25s ease",
    "box-shadow:none",
  ].join(";");
  exitBtn.addEventListener("mouseenter", () => {
    exitBtn.style.boxShadow = "0 0 10px 2px rgba(0,229,255,0.6)";
  });
  exitBtn.addEventListener("mouseleave", () => {
    exitBtn.style.boxShadow = "none";
  });
  exitBtn.addEventListener("click", () => cleanup());
  document.body.appendChild(exitBtn);
  // Slide in after paint (same pattern as exit8).
  requestAnimationFrame(() => requestAnimationFrame(() => {
    exitBtn.style.left = "24px";
  }));

  // ── Laser Stage ────────────────────────────────────────────────────────
  function isRightSide(x, y) {
    if (!isSpinMode) {
      const splitX = (splitPct / 100) * window.innerWidth;
      return x > splitX;
    }
    if (!spinGeometry) return x > window.innerWidth / 2;
    return (
      signedDistance(
        x,
        y,
        spinGeometry.centerX,
        spinGeometry.centerY,
        spinGeometry.normalX,
        spinGeometry.normalY
      ) >= 0
    );
  }

  function isLeftSide(x, y) {
    return !isRightSide(x, y);
  }

  // Endpoints of the current seam, for the laser stage's bolt-vs-seam clip.
  // Classic mode: the seam is always vertical, and aimed bolts always fire
  // straight up — parallel lines never intersect, so this naturally becomes
  // a no-op there without needing a mode check. Spin mode: the seam can sit
  // at any angle, so a vertical bolt can genuinely cross it.
  function getSeamSegment() {
    const BIG = Math.hypot(window.innerWidth, window.innerHeight) * 1.5;
    if (isSpinMode && spinGeometry) {
      return {
        a: {
          x: spinGeometry.centerX - spinGeometry.lineDirX * BIG,
          y: spinGeometry.centerY - spinGeometry.lineDirY * BIG,
        },
        b: {
          x: spinGeometry.centerX + spinGeometry.lineDirX * BIG,
          y: spinGeometry.centerY + spinGeometry.lineDirY * BIG,
        },
      };
    }
    const splitX = (splitPct / 100) * window.innerWidth;
    return { a: { x: splitX, y: -BIG }, b: { x: splitX, y: window.innerHeight + BIG } };
  }

  const laserStage = buildLaserStage((x, y) => isLeftSide(x, y), getSeamSegment, reduced);
  const fairyTrail = buildFairyTrail((x, y) => isRightSide(x, y), getSeamSegment, reduced);

  // ── applySplit ─────────────────────────────────────────────────────────
  // Single writer for the split position. Overlays read via CSS var (no JS
  // per frame); only the seam's `left` needs a direct inline update.
  function applySplit(pct) {
    splitPct = Math.max(MIN_PCT, Math.min(MAX_PCT, pct));
    window.__sfSplitPct = splitPct;
    window.__sfSplitAngle = Math.PI / 2;
    setSplitVars(splitPct);
    seam.style.left = splitPct + "%";
    if (!isSpinMode) updateSplitProgress(splitPct * 10, true);
  }

  function computeSpinProgressState() {
    if (!isSpinMode || !spinGeometry) {
      return { splitVb: splitPct * 10, techOnLeft: true };
    }
    if (_cachedProgBarY === null) {
      const barRect = progWrap?.getBoundingClientRect?.();
      _cachedProgBarY = barRect ? barRect.top + barRect.height / 2 : 0;
    }
    const y = _cachedProgBarY;

    const leftFairy = isRightSide(0, y);
    const rightFairy = isRightSide(window.innerWidth, y);

    if (leftFairy === rightFairy) {
      // Entire navbar row is on one side: full vine for fairy, full battery for tech.
      return leftFairy
        ? { splitVb: 1000, techOnLeft: false }
        : { splitVb: 1000, techOnLeft: true };
    }

    if (Math.abs(spinGeometry.lineDirY) < 1e-6) {
      return leftFairy
        ? { splitVb: 1000, techOnLeft: false }
        : { splitVb: 1000, techOnLeft: true };
    }

    const t = (y - spinGeometry.centerY) / spinGeometry.lineDirY;
    const crossX = spinGeometry.centerX + t * spinGeometry.lineDirX;
    return {
      splitVb: Math.max(0, Math.min(1000, (crossX / window.innerWidth) * 1000)),
      techOnLeft: !leftFairy,
    };
  }

  function applyProgBg(splitVb, techOnLeft) {
    if (!progWrap) return;
    const pct = splitVb / 10;
    const [c1, c2] = techOnLeft ? ["#000", "#0d0015"] : ["#0d0015", "#000"];
    progWrap.style.background = `linear-gradient(to right, ${c1} ${pct}%, ${c2} ${pct}%)`;
  }

  function applySpinFromPoint(clientX, clientY) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001) return;

    splitAngle = Math.atan2(deltaY, deltaX);
    spinGeometry = buildSplitPolygons(window.innerWidth, window.innerHeight, splitAngle);
    leftLens.style.clipPath = spinGeometry.leftClip;
    rightOvl.style.clipPath = spinGeometry.rightClip;
    sparkWrap.style.clipPath = spinGeometry.rightClip;
    fairyTrail.stage.style.clipPath = spinGeometry.rightClip;
    seam.style.transform = `translate(-50%,-50%) rotate(${splitAngle}rad)`;
    const progressState = computeSpinProgressState();
    updateSplitProgress(progressState.splitVb, progressState.techOnLeft);
    applyProgBg(progressState.splitVb, progressState.techOnLeft);
    window.__sfSplitAngle = splitAngle;
    window.__sfSplitPct = 50;
  }
  applySplit(splitPct); // sync seam.left with the CSS var on first paint
  if (isSpinMode) {
    applySpinFromPoint(window.innerWidth / 2, 0);
  }

  window.__sfIsRightAt = (x, y) => isRightSide(x, y);

  // ── Resize handler — keeps --split-abs in sync when viewport changes ─────
  // zoom in/out changes window.innerWidth, so we must recompute the px value.
  function onResize() {
    _cachedProgBarY = null;
    scheduleProgResize();
    if (isSpinMode) {
      applySpinFromPoint(window.innerWidth / 2 + Math.cos(splitAngle), window.innerHeight / 2 + Math.sin(splitAngle));
      return;
    }
    setSplitVars(splitPct);
  }
  window.addEventListener("resize", onResize);

  // ── Drag logic ─────────────────────────────────────────────────────────
  let dragging = false;
  const transition = "opacity " + SPLIT_MS + "ms ease";
  const draggables = [leftLens, rightOvl, seam, sparkWrap];

  function onDragStart(e) {
    if (isSpinMode) return;
    e.preventDefault();
    dragging = true;
    draggables.forEach((el) => { el.style.transition = "none"; });
  }

  function onDragMove(e) {
    if (isSpinMode || !dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    applySplit((clientX / window.innerWidth) * 100);
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    draggables.forEach((el) => { el.style.transition = transition; });
  }

  if (!isSpinMode) {
    seam.addEventListener("mousedown",  onDragStart);
    seam.addEventListener("touchstart", onDragStart, { passive: false });
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("mouseup",   onDragEnd);
    document.addEventListener("touchend",  onDragEnd);
  }

  let _spinRafPending = false;
  function onSpinPointerMove(e) {
    const point = e.touches ? e.touches[0] : e;
    if (!point) return;
    const cx = point.clientX;
    const cy = point.clientY;
    // Geometry updated synchronously so cursor detection is current on the same event.
    const dx = cx - window.innerWidth / 2;
    const dy = cy - window.innerHeight / 2;
    if (Math.abs(dx) >= 0.001 || Math.abs(dy) >= 0.001) {
      splitAngle = Math.atan2(dy, dx);
      spinGeometry = buildSplitPolygons(window.innerWidth, window.innerHeight, splitAngle);
      window.__sfSplitAngle = splitAngle;
    }
    if (_spinRafPending) return;
    _spinRafPending = true;
    requestAnimationFrame(() => {
      _spinRafPending = false;
      if (cleanedUp) return;
      leftLens.style.clipPath = spinGeometry.leftClip;
      rightOvl.style.clipPath = spinGeometry.rightClip;
      sparkWrap.style.clipPath = spinGeometry.rightClip;
      fairyTrail.stage.style.clipPath = spinGeometry.rightClip;
      seam.style.transform = `translate(-50%,-50%) rotate(${splitAngle}rad)`;
      const progressState = computeSpinProgressState();
      updateSplitProgress(progressState.splitVb, progressState.techOnLeft);
      applyProgBg(progressState.splitVb, progressState.techOnLeft);
    });
  }

  if (isSpinMode) {
    document.addEventListener("mousemove", onSpinPointerMove);
    document.addEventListener("touchstart", onSpinPointerMove, { passive: true });
    document.addEventListener("touchmove", onSpinPointerMove, { passive: true });
  }

  function updateCursor(e) {
    const clientX = typeof e === "number" ? e : e?.clientX ?? 0;
    const clientY = typeof e === "number" ? window.innerHeight / 2 : e?.clientY ?? window.innerHeight / 2;
    if (isRightSide(clientX, clientY)) {
      // Mirrors the tech branch below — e.target is reliable here too (same
      // pointer-events:none overlays), and the same c81128d lesson applies:
      // real <a>/<button> ignore --cursor-default (index.css's `* a, button`
      // rule outranks the universal `*` rule), so both vars must be set or
      // fairy-side links keep showing the site-wide middle-finger cursor.
      const hoveredEl = typeof e === "object" ? e?.target : null;
      const isExempt = hoveredEl ? !!hoveredEl.closest?.("#_sfExitBtn") : false;
      const isOverInteractive = !isExempt && hoveredEl ? !!findInteractiveTarget(hoveredEl) : false;
      const cursorValue = isOverInteractive ? FAIRY_INTERACTIVE_CURSOR : FAIRY_CURSOR;
      document.documentElement.style.setProperty("--cursor-default", cursorValue);
      document.documentElement.style.setProperty(
        "--cursor-pointer",
        isExempt ? originalCursorPointer : cursorValue
      );
    } else {
      // e.target is reliable here: pointer-events:none overlays (leftLens, laserStage)
      // are bypassed by the browser when dispatching mouse events, so e.target always
      // points at the real underlying element — no elementFromPoint needed.
      const hoveredEl = typeof e === "object" ? e?.target : null;
      // #_sfExitBtn is itself a real <button> with its own inline
      // `cursor:var(--cursor-pointer,...)` and its own teal hover glow — it's
      // explicitly exempt from laser interaction elsewhere in this file
      // (handlePointerDown), so it must keep the ordinary pointer here too,
      // not the laser-target reticle.
      const isExempt = hoveredEl ? !!hoveredEl.closest?.("#_sfExitBtn") : false;
      const isOverInteractive = !isExempt && hoveredEl ? !!findInteractiveTarget(hoveredEl) : false;
      const cursorValue = isOverInteractive ? INTERACTIVE_CURSOR : RETICLE_CURSOR;
      document.documentElement.style.setProperty("--cursor-default", cursorValue);
      // Real <a>/<button> elements (e.g. the project card GitHub/Preview
      // links) match index.css's `* a, button` rule, which outranks the
      // universal `*` rule that --cursor-default feeds — so they ignore
      // --cursor-default entirely and need --cursor-pointer set too, or
      // they keep showing the site-wide middle-finger cursor even in SF mode.
      document.documentElement.style.setProperty(
        "--cursor-pointer",
        isExempt ? originalCursorPointer : cursorValue
      );
    }
  }

  function onCursorMove(e) { updateCursor(e); }
  document.addEventListener("mousemove", onCursorMove);
  document.addEventListener("mouseover", onCursorMove);

  // Handle the trigger moment: set cursor based on wherever the pointer is now.
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
  let cleanedUp = false;
  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

    try { laserStage?.destroy(); } catch (_) {}
    try { fairyTrail?.destroy(); } catch (_) {}

    // CSS first — body class + vars drive section gradient hard-stops; removing
    // them here (before DOM removal) ensures the split line vanishes in the same
    // paint as everything else, whether cleanup is instant or after a fade.
    document.body.classList.remove("_sfActive");
    document.body.classList.remove("_sfSpinMode");
    clearSplitVars();
    try { document.head.removeChild(fairyStyle); } catch (_) {}
    try { document.head.removeChild(sparkStyle); } catch (_) {}

    // Listeners
    seam.removeEventListener("mousedown",  onDragStart);
    seam.removeEventListener("touchstart", onDragStart);
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("mouseup",   onDragEnd);
    document.removeEventListener("touchend",  onDragEnd);
    document.removeEventListener("mousemove", onSpinPointerMove);
    document.removeEventListener("touchstart", onSpinPointerMove);
    document.removeEventListener("touchmove", onSpinPointerMove);
    document.removeEventListener("mousemove", onCursorMove);
    document.removeEventListener("mouseover", onCursorMove);
    document.removeEventListener("keydown",   onKeyDown);
    window.removeEventListener("resize", onResize);

    // Injected DOM nodes
    [leftLens, rightOvl, seam, sparkWrap, exitBtn].forEach((el) => {
      try { el.remove(); } catch (_) {}
    });
    // Restore #progress-container: remove SVG, restore original bar.
    const sfSvg = document.getElementById("_sfProgressSvg");
    if (sfSvg) sfSvg.remove();
    if (progWrap) progWrap.style.removeProperty("background");
    if (progOrigBar) progOrigBar.style.display = "";
    stopProgressTick();
    if (_progResizeRaf !== null) cancelAnimationFrame(_progResizeRaf);

    // Snap mosaic tiles to their resting state instantly.
    const allTiles = document.querySelectorAll("[class*='mosaicTile']");
    allTiles.forEach((tile) => {
      tile.style.setProperty("transition", "none");
      tile.style.removeProperty("transform");
      tile.style.removeProperty("opacity");
      tile.style.removeProperty("--tile-idx");
    });
    requestAnimationFrame(() => {
      allTiles.forEach((tile) => tile.style.removeProperty("transition"));
    });

    document.documentElement.style.setProperty("--cursor-default", originalCursor);
    document.documentElement.style.setProperty("--cursor-pointer", originalCursorPointer);
    window.__sfFairyActive = false;
    delete window.__sfSplitPct;
    delete window.__sfSplitAngle;
    delete window.__sfIsRightAt;
    delete window.__sfDismiss;
  }

  // Expose dismiss for external callers (tenet, exit8, re-trigger guard).
  window.__sfDismiss   = cleanup;
  window.__sfSplitPct  = splitPct;
  window.__sfSplitAngle = splitAngle;

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

  // Guard: if cleanup was already called (Esc / exit8 / exit btn), skip — the
  // pre-strip below would otherwise corrupt a new SF session started in the gap.
  if (!cleanedUp) {
    document.body.classList.remove("_sfActive");
    document.body.classList.remove("_sfSpinMode");
    clearSplitVars();
    all.forEach((el) => { el.style.opacity = "0"; });
    await wait(SPLIT_MS);
  }

  cleanup();
}
