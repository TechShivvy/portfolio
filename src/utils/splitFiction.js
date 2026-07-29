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

// ─── Progress indicator: unified battery (left) + vine+flowers (right) ──────
// Single full-width SVG, 8px tall, pinned to the bottom edge of the navbar.
// One clipPath rect grows 0→1000 (viewBox) as the page scrolls, revealing
// both halves as one continuous bar: battery cells (0→seam) then wavy vine
// (seam→1000). Seam drag calls updateVine() which rebuilds path + flowers.

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

  const seamVb = initPct * 10; // seam in 0–1000 viewBox units

  const NS  = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width",  "100%");
  svg.setAttribute("height", "100%");
  // viewBox 8 units tall; battery and vine both centered at y=4.
  svg.setAttribute("viewBox", "0 0 1000 8");
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

  // Battery rect (0 → seam), centered at y=4 (y=2, h=4).
  const batRect = document.createElementNS(NS, "rect");
  batRect.id = "_sfBatRect";
  batRect.setAttribute("x", "0"); batRect.setAttribute("y", "2");
  batRect.setAttribute("width", String(seamVb));
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

  // Generate wavy path from sx to beyond 1000 so it always reaches the edge.
  // Period=90 VB units, amplitude=±2.5 around y=4. Adjacent bezier arcs share
  // end-points at y=4 so the wave is smooth and continuous.
  function makePath(sx) {
    const period = 90, amp = 2.5, cy = 4;
    let d = "M " + sx.toFixed(1) + "," + cy;
    let phase = 0;
    for (let x = sx; x < 1010; x += period, phase++) {
      const nx   = Math.min(x + period, 1010);
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
  function vineYAt(x, sx) {
    const period = 90, amp = 2.5, cy = 4;
    const phase  = Math.floor((x - sx) / period);
    const t      = ((x - sx) % period) / period;
    return cy + (phase % 2 === 0 ? -amp : amp) * Math.sin(t * Math.PI);
  }

  // Leaves + 5-petal circle flowers along the vine.
  // Leaves alternate above/below the vine every 28 VB units (green ovals, tilted).
  // Flowers have 5 round petals in a ring + yellow center, every 72 VB units.
  const FLOWER_COLS = ["#f9a8d4", "#d8b4fe", "#fbcfe8", "#c4b5fd"];
  function buildFlowers(sx) {
    while (flowerG.firstChild) flowerG.removeChild(flowerG.firstChild);
    // Leaves
    for (let x = sx + 18; x < 990; x += 28) {
      const vy   = vineYAt(x, sx);
      const side = (Math.floor((x - sx) / 28) % 2 === 0) ? -1 : 1;
      const lx   = x, ly = vy + side * 2.5;
      const leaf = document.createElementNS(NS, "ellipse");
      leaf.setAttribute("cx", lx.toFixed(2));
      leaf.setAttribute("cy", ly.toFixed(2));
      leaf.setAttribute("rx", "2.6");
      leaf.setAttribute("ry", "1.0");
      leaf.setAttribute("fill", "#86efac");
      leaf.setAttribute("opacity", "0.9");
      leaf.setAttribute("transform",
        "rotate(" + (side * 38).toFixed(0) + "," + lx.toFixed(2) + "," + ly.toFixed(2) + ")");
      flowerG.appendChild(leaf);
    }
    // Flowers
    let fi = 0;
    for (let x = sx + 50; x < 990; x += 72, fi++) {
      const vy    = vineYAt(x, sx);
      const color = FLOWER_COLS[fi % FLOWER_COLS.length];
      for (let p = 0; p < 5; p++) {
        const a     = (p / 5) * Math.PI * 2 - Math.PI / 2;
        const petal = document.createElementNS(NS, "circle");
        petal.setAttribute("cx", (x + Math.cos(a) * 2.6).toFixed(2));
        petal.setAttribute("cy", (vy + Math.sin(a) * 2.6).toFixed(2));
        petal.setAttribute("r", "1.6");
        petal.setAttribute("fill", color);
        flowerG.appendChild(petal);
      }
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", vy.toFixed(2));
      dot.setAttribute("r", "1.1");
      dot.setAttribute("fill", "#fde68a");
      flowerG.appendChild(dot);
    }
  }

  // Single update function: syncs battery width, vine path, and flowers.
  function updateVine(svb) {
    batRect.setAttribute("width", String(svb));
    vineP.setAttribute("d", makePath(svb));
    buildFlowers(svb);
  }
  updateVine(seamVb); // initial render

  return { wrap, origBar, clipR, updateVine };
}

// Drives the unified clip rect — returns a cancel fn for cleanup.
function startProgressTick(clipR) {
  let raf = null;
  function tick() {
    raf = requestAnimationFrame(tick);
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const range =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = range > 0 ? Math.max(0, Math.min((scrollTop / range) * 100, 100)) : 0;
    // viewBox is 0-1000, so scroll 0-100% maps to clipRect width 0-1000.
    clipR.setAttribute("width", (pct * 10).toFixed(1));
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

// ─── Laser Cursor Playground Stage (Sci-Fi / Left side) ────────────────────
function buildLaserStage(isLeftSciFi) {
  const stageStyle = document.createElement("style");
  stageStyle.id = "_sfLaserStyle";
  stageStyle.textContent = `
    #_sfLaserStage {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
    }
    ._sfLaser {
      position: fixed;
      width: 7px;
      height: 28px;
      border-radius: 4px;
      pointer-events: none;
      transform-origin: center;
      will-change: transform, opacity;
      z-index: 99999;
      filter: drop-shadow(0 0 2px #000) drop-shadow(0 0 4px #000);
    }
    ._sfLaser.red   {
      background: linear-gradient(to bottom, #ffffff 0%, #ff0055 30%, #b3003b 100%);
      box-shadow: 0 0 10px 2px #ff0055, inset 0 0 4px #ffffff, 0 0 0 1px #000000;
    }
    ._sfLaser.green {
      background: linear-gradient(to bottom, #ffffff 0%, #00ff66 30%, #009933 100%);
      box-shadow: 0 0 10px 2px #00ff66, inset 0 0 4px #ffffff, 0 0 0 1px #000000;
    }
    ._sfLaser.blue  {
      background: linear-gradient(to bottom, #ffffff 0%, #00d9ff 30%, #0066cc 100%);
      box-shadow: 0 0 10px 2px #00d9ff, inset 0 0 4px #ffffff, 0 0 0 1px #000000;
    }
    ._sfFlash {
      position: fixed;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0.9) 30%, rgba(0,0,0,0) 70%);
      box-shadow: 0 0 12px 3px #ffffff, 0 0 0 1px #000;
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: _sfFlashPop 0.25s ease-out forwards;
      z-index: 99999;
    }
    @keyframes _sfFlashPop {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.3); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
    }
  `;
  document.head.appendChild(stageStyle);

  const stage = document.createElement("div");
  stage.id = "_sfLaserStage";
  document.body.appendChild(stage);

  const colors = ["red", "green", "blue"];
  const INTERACTIVE_SELECTOR = [
    'a[href]', 'button', 'input', 'select', 'textarea', 'label',
    '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
    '[role="tab"]', '[role="menuitem"]', '[role="option"]', '[role="switch"]',
    '[onclick]', '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  function isInteractive(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    const closestMatch = el.closest(INTERACTIVE_SELECTOR);
    if (closestMatch) return closestMatch;
    const style = window.getComputedStyle(el);
    if (style.cursor === "pointer" || style.cursor.includes("pointer")) return el;
    return null;
  }

  function spawnLaser(x, y, angleDeg, distance) {
    const flash = document.createElement("div");
    flash.className = "_sfFlash";
    flash.style.left = x + "px";
    flash.style.top = y + "px";
    stage.appendChild(flash);
    setTimeout(() => flash.remove(), 250);

    const laser = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    laser.className = "_sfLaser " + color;
    laser.style.left = x + "px";
    laser.style.top = y + "px";
    laser.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
    stage.appendChild(laser);

    const dist = distance || (300 + Math.random() * 250);
    const duration = 500 + Math.random() * 200;

    const anim = laser.animate(
      [
        { transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translateY(0px)`, opacity: 1 },
        { transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translateY(-${dist}px)`, opacity: 0 },
      ],
      { duration, easing: "cubic-bezier(0.15, 0.6, 0.4, 1)" }
    );

    anim.onfinish = () => laser.remove();
  }

  function spawnAimedLaser(x, y) {
    // Shoot straight up (angleDeg = 0)
    spawnLaser(x, y, 0, 450);
  }

  function spawnRandomBurst(x, y, count) {
    const n = count || 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      const angleDeg = Math.random() * 360;
      const distance = 220 + Math.random() * 300;
      setTimeout(() => spawnLaser(x, y, angleDeg, distance), i * 12);
    }
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
    spawnAimedLaser(x, y);
    fireInterval = setInterval(() => {
      if (isLeftSciFi(lastX, lastY)) {
        spawnAimedLaser(lastX, lastY);
      } else {
        stopFiring();
      }
    }, 90);
  }

  const handleMouseDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (!isLeftSciFi(e.clientX, e.clientY)) return;
    if (e.target.closest("#_sfExitBtn") || e.target.closest("#_splitFictionSeam")) return;
    if (isInteractive(e.target)) return;
    startFiring(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const handleClick = (e) => {
    if (!isLeftSciFi(e.clientX, e.clientY)) return;
    if (e.target.closest("#_sfExitBtn") || e.target.closest("#_splitFictionSeam")) return;
    const el = isInteractive(e.target);
    if (el) spawnRandomBurst(e.clientX, e.clientY);
  };

  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("click", handleClick);

  window.addEventListener("mouseup", stopFiring, true);
  window.addEventListener("pointerup", stopFiring, true);
  window.addEventListener("touchend", stopFiring, true);
  window.addEventListener("touchcancel", stopFiring, true);
  window.addEventListener("mouseleave", stopFiring, true);
  window.addEventListener("blur", stopFiring);

  const destroy = () => {
    stopFiring();
    document.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("click", handleClick);

    window.removeEventListener("mouseup", stopFiring, true);
    window.removeEventListener("pointerup", stopFiring, true);
    window.removeEventListener("touchend", stopFiring, true);
    window.removeEventListener("touchcancel", stopFiring, true);
    window.removeEventListener("mouseleave", stopFiring, true);
    window.removeEventListener("blur", stopFiring);

    try { stage.remove(); } catch (_) {}
    try { stageStyle.remove(); } catch (_) {}
  };

  return { destroy };
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
  const originalCursor = getComputedStyle(document.documentElement)
    .getPropertyValue("--cursor-default").trim();

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
  const { wrap: progWrap, origBar: progOrigBar, clipR: progClipR, updateVine: updateProgVine } = buildProgressBar(splitPct);
  const stopProgressTick = startProgressTick(progClipR);

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

  const laserStage = buildLaserStage((x, y) => isLeftSide(x, y));

  // ── applySplit ─────────────────────────────────────────────────────────
  // Single writer for the split position. Overlays read via CSS var (no JS
  // per frame); only the seam's `left` needs a direct inline update.
  function applySplit(pct) {
    splitPct = Math.max(MIN_PCT, Math.min(MAX_PCT, pct));
    window.__sfSplitPct = splitPct;
    window.__sfSplitAngle = Math.PI / 2;
    setSplitVars(splitPct);
    seam.style.left = splitPct + "%";
    // Keep battery/vine split in sync with the draggable seam.
    updateProgVine(splitPct * 10);
  }

  function computeSpinProgressSplitVb() {
    if (!isSpinMode || !spinGeometry) return splitPct * 10;
    const barRect = progWrap?.getBoundingClientRect?.();
    const y = barRect ? barRect.top + barRect.height / 2 : 0;

    const leftFairy = isRightSide(0, y);
    const rightFairy = isRightSide(window.innerWidth, y);

    if (leftFairy === rightFairy) {
      return leftFairy ? 0 : 1000;
    }

    if (Math.abs(spinGeometry.lineDirY) < 1e-6) {
      return leftFairy ? 0 : 1000;
    }

    const t = (y - spinGeometry.centerY) / spinGeometry.lineDirY;
    const crossX = spinGeometry.centerX + t * spinGeometry.lineDirX;
    return Math.max(0, Math.min(1000, (crossX / window.innerWidth) * 1000));
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
    seam.style.transform = `translate(-50%,-50%) rotate(${splitAngle}rad)`;
    updateProgVine(computeSpinProgressSplitVb());
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
      seam.style.transform = `translate(-50%,-50%) rotate(${splitAngle}rad)`;
      updateProgVine(computeSpinProgressSplitVb());
    });
  }

  if (isSpinMode) {
    document.addEventListener("mousemove", onSpinPointerMove);
    document.addEventListener("touchstart", onSpinPointerMove, { passive: true });
    document.addEventListener("touchmove", onSpinPointerMove, { passive: true });
  }

  // Only semantic / truly-clickable elements — broad class wildcards like
  // [class*="card"] match non-interactive wrapper divs and cause false positives.
  const INTERACTIVE_SEL = [
    'a[href]', 'button', 'input', 'select', 'textarea', 'label',
    '[role="button"]', '[role="link"]', '[role="checkbox"]', '[role="radio"]',
    '[role="tab"]', '[role="menuitem"]', '[role="option"]', '[role="switch"]',
    '[onclick]', '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  function isInteractiveElement(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    // Walk up at most 4 levels: handles text spans inside buttons, etc.
    let node = el;
    for (let i = 0; i < 4; i++) {
      if (!node || node === document.body) break;
      if (node.matches?.(INTERACTIVE_SEL)) return true;
      const cur = window.getComputedStyle(node).cursor;
      if (cur === "pointer") return true;
      node = node.parentElement;
    }
    return false;
  }

  function updateCursor(e) {
    const clientX = typeof e === "number" ? e : e?.clientX ?? 0;
    const clientY = typeof e === "number" ? window.innerHeight / 2 : e?.clientY ?? window.innerHeight / 2;
    if (isRightSide(clientX, clientY)) {
      document.documentElement.style.setProperty("--cursor-default", "auto");
    } else {
      // e.target is reliable here: pointer-events:none overlays (leftLens, laserStage)
      // are bypassed by the browser when dispatching mouse events, so e.target always
      // points at the real underlying element — no elementFromPoint needed.
      const hoveredEl = typeof e === "object" ? e?.target : null;
      const isOverInteractive = hoveredEl ? isInteractiveElement(hoveredEl) : false;
      document.documentElement.style.setProperty(
        "--cursor-default",
        isOverInteractive ? INTERACTIVE_CURSOR : RETICLE_CURSOR
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
    if (progOrigBar) progOrigBar.style.display = "";
    stopProgressTick();

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
