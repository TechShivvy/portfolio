import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./_About.module.css";
import INTERESTS from "../content/interests";
import ABOUT from "../content/about";

// ─── Boot sequence lines ────────────────────────────────────────────────────
const BOOT_LINES = [
  "Initializing shivi-shell v1.0.0...",
  "Loading user profile...",
  "Mounting filesystem...",
  "$ source ~/.shivi_profile",
  "Ready. Type 'help' for available commands.",
];

// ─── Command definitions ────────────────────────────────────────────────────
function buildCommands(scrollToSection) {
  const contactEntry = ABOUT.find((e) => e.input === "Shivcharan.contactInfo");
  const resumeEntry  = ABOUT.find((e) => e.input === "Shivcharan.resume");

  return {
    help: () => [
      { text: "Available commands:", type: "info" },
      { text: "  whoami       — who is this person?", type: "output" },
      { text: "  skills       — tech stack", type: "output" },
      { text: "  projects     — jump to projects section", type: "output" },
      { text: "  contact      — contact info", type: "output" },
      { text: "  resume       — open résumé PDF", type: "output" },
      { text: "  interests    — list all interest areas", type: "output" },
      { text: "  games        — games I play", type: "output" },
      { text: "  anime        — shows I watch", type: "output" },
      { text: "  cycling      — km and routes", type: "output" },
      { text: "  rubik        — cube PBs", type: "output" },
      { text: "  tech         — current tech rabbit holes", type: "output" },
      { text: "  music        — what's playing", type: "output" },
      { text: "  spotify      — same as music", type: "output" },
      { text: "  matrix       — replay the matrix", type: "output" },
      { text: "  matrix fps N — set matrix rain to N fps (0 = native)", type: "output" },
      { text: "  clear        — clear terminal", type: "output" },
      { text: "  history      — command history", type: "output" },
      { text: "  ls           — list... something", type: "output" },
      { text: "  sudo         — try it ;)", type: "output" },
      { text: "  exit 8       — the loop. spot 8 anomalies. press ENTER or [!] to call one.", type: "output" },
      { text: "  suicide      — closes the tab. for real.", type: "output" },
    ],

    whoami: () => [
      { text: "Shivcharan Thirunavukkarasu", type: "accent" },
      { text: "CSE grad · developer · gamer · cube-scrambler", type: "output" },
      { text: "Currently on a quest to locate the elusive missing semicolon ;)", type: "output" },
    ],

    skills: () => {
      const entry = ABOUT.find((e) => e.input === "Shivcharan.skills");
      return [{ text: entry ? entry.return : "[]", type: "accent" }];
    },

    projects: () => {
      scrollToSection("projects");
      return [{ text: ">> scrolling to projects...", type: "info" }];
    },

    contact: () => {
      if (!contactEntry || !Array.isArray(contactEntry.return)) return [];
      return contactEntry.return.map((link) => ({
        text: link.text,
        type: "link",
        href: link.href,
        target: link.target,
        rel: link.rel || "noopener noreferrer",
      }));
    },

    resume: () => {
      if (resumeEntry && Array.isArray(resumeEntry.return) && resumeEntry.return[0]) {
        window.open(resumeEntry.return[0].href, "_blank", "noopener,noreferrer");
      }
      return [{ text: ">> opening résumé in new tab...", type: "info" }];
    },

    interests: () =>
      Object.values(INTERESTS).map((i) => ({
        text: `  ${i.icon}  ${i.label.padEnd(14)} — ${i.blurb}`,
        type: "output",
      })),

    games:   () => interestLines("games"),
    anime:   () => interestLines("anime"),
    cycling: () => interestLines("cycling"),
    rubik:   () => interestLines("rubik"),
    tech:    () => interestLines("tech"),
    music:   () => interestLines("music"),
    spotify: () => interestLines("music"),

    matrix: (args) => {
      if (args.length && args[0] === "fps") {
        const val = parseInt(args[1], 10);
        if (isNaN(val) || val < 0 || val > 240) {
          return [{ text: "usage: matrix fps <0-240>  (0 = native refresh rate)", type: "danger" }];
        }
        window.__matrixFps = val;
        return [
          { text: `>> matrix fps set to ${val === 0 ? "native refresh rate" : `${val} fps`}`, type: "info" },
        ];
      }
      sessionStorage.removeItem("hasRun");
      window.location.reload();
      return [{ text: ">> reloading matrix...", type: "info" }];
    },

    ls: () => [
      { text: "drwxr-xr-x  about/", type: "output" },
      { text: "drwxr-xr-x  projects/", type: "output" },
      { text: "drwxr-xr-x  beyond-code/", type: "output" },
      { text: "-rw-r--r--  contact.txt", type: "output" },
      { text: "-rw-r--r--  resume.pdf", type: "output" },
      { text: "-rw-r--r--  .secrets  (permission denied)", type: "danger" },
    ],

    sudo: (args) => {
      if (args[0] === "suicide" || args[0] === "exit") {
        setTimeout(() => window.location.replace("about:blank"), 600);
        return [{ text: ">> bye o/", type: "info" }];
      }
      const picks = [
        [
          { text: "[sudo] password for shivi:", type: "output" },
          { text: "Sorry, try again.", type: "danger" },
          { text: "Sorry, try again.", type: "danger" },
          { text: "sudo: 3 incorrect password attempts. nice try bestie.", type: "danger" },
        ],
        [
          { text: "[sudo] lmao no", type: "danger" },
        ],
        [
          { text: "sudo: unable to locate your audacity", type: "danger" },
        ],
        [
          { text: "sudo: permission denied (and also who are you)", type: "danger" },
        ],
        [
          { text: "[sudo] authenticating...", type: "output" },
          { text: "sudo: nah", type: "danger" },
        ],
        [
          { text: "sudo: you are not in the sudoers file", type: "danger" },
          { text: "      this incident will be reported. (it won't)", type: "output" },
        ],
      ];
      return picks[Math.floor(Math.random() * picks.length)];
    },

    suicide: () => {
      setTimeout(() => window.location.replace("about:blank"), 600);
      return [{ text: ">> bye o/", type: "info" }];
    },

    clear: () => [],
    history: () => [],
  };
}

function interestLines(key) {
  const i = INTERESTS[key];
  if (!i) return [{ text: `no data for '${key}'`, type: "danger" }];
  return [
    { text: `${i.icon}  ${i.label}`, type: "accent" },
    { text: `   ${i.blurb}`, type: "output" },
    ...i.favorites.map((f) => ({ text: `   • ${f}`, type: "output" })),
  ];
}

// Renders text with dim italic styling for // comment fragments.
// Lines that start with // become fully styled; inline // is split.
function renderText(text) {
  if (text.startsWith("//") || text.match(/^\s+\/\//)) {
    return <span style={{ fontStyle: "italic", opacity: 0.45 }}>{text}</span>;
  }
  const idx = text.indexOf(" // ");
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontStyle: "italic", opacity: 0.45 }}>{text.slice(idx)}</span>
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function InteractiveTerminal({ isActive, onClose, hasBooted, onBooted }) {
  const [lines, setLines]           = useState([]);
  const [input, setInput]           = useState("");
  const [historyList, setHistoryList] = useState([]);
  const [histIdx, setHistIdx]       = useState(-1);
  const [booting, setBooting]       = useState(false);
  const [ready, setReady]           = useState(false);

  const inputRef  = useRef(null);
  const outputRef = useRef(null);
  const cmdScrollPos = useRef(null); // captures content bottom before each command
  const isCommandScroll = useRef(false); // true when scroll was triggered by a user command (not boot)
  const exitScrollRef = useRef(null); // rAF handle for `exit 8` page scroll loop
  const exitBarRef    = useRef(null); // floating bar DOM element during exit 8
  const exitCloneRef  = useRef(null); // cloned #root appended below for seamless loop
  const exitStateRef  = useRef({ anomalyTimer: null, expireTimer: null, anomalyActive: false, removeEffect: null, score: 0, scheduleAnomaly: null, teardown: null });
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Focus input when active ──────────────────────────────────────────────
  useEffect(() => {
    if (isActive && ready && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isActive, ready]);

  // ── Scroll ONLY within the output div (not the whole page) ───────────────
  useEffect(() => {
    if (!outputRef.current) return;
    if (isCommandScroll.current) {
      // After a command: scroll so the "> cmd" line sits at the top of the pane.
      // Use the captured content-bottom position (not scrollHeight, which can
      // equal clientHeight when content doesn't overflow before the command).
      outputRef.current.scrollTop = cmdScrollPos.current;
      isCommandScroll.current = false;
      cmdScrollPos.current = null;
    } else {
      // Boot sequence: always follow the latest line (scroll to bottom)
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // ── Boot sequence ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    if (hasBooted || prefersReducedMotion) {
      // Instant: skip boot animation
      setLines([{ text: "Ready. Type 'help' for available commands.", type: "info" }]);
      setReady(true);
      return;
    }

    setBooting(true);
    setReady(false);
    setLines([]);

    let cancelled = false;
    (async () => {
      for (let i = 0; i < BOOT_LINES.length; i++) {
        if (cancelled) return;
        await sleep(prefersReducedMotion ? 0 : 220);
        setLines((prev) => [...prev, { text: BOOT_LINES[i], type: i === BOOT_LINES.length - 1 ? "accent" : "boot" }]);
      }
      if (!cancelled) {
        setBooting(false);
        setReady(true);
        onBooted();
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ── Command runner ────────────────────────────────────────────────────────
  const scrollToSection = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Capture the actual rendered bottom of the output pane's content so we know
  // where the new "> cmd" line will start. Using scrollHeight fails when content
  // doesn't yet overflow (scrollHeight === clientHeight), causing an overshoot.
  const captureScrollPos = useCallback(() => {
    if (!outputRef.current) return;
    const children = outputRef.current.children;
    if (children.length > 0) {
      const last = children[children.length - 1];
      cmdScrollPos.current = last.offsetTop + last.offsetHeight;
    } else {
      cmdScrollPos.current = 0;
    }
    isCommandScroll.current = true;
  }, []);

  const runCommand = useCallback(
    (raw) => {
      const parts = raw.trim().toLowerCase().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      if (!cmd) return;

      const newHistory = [cmd, ...historyList].slice(0, 50);
      setHistoryList(newHistory);
      setHistIdx(-1);

      const commands = buildCommands(scrollToSection);

      // ── special: clear ──────────────────────────────────────────────────
      if (cmd === "clear") {
        const wasInGame = !!exitStateRef.current.teardown;
        exitStateRef.current.teardown?.();
        if (wasInGame) window.scrollTo({ top: 0, behavior: "instant" });
        isCommandScroll.current = false;
        cmdScrollPos.current = null;
        setLines([]);
        if (outputRef.current) outputRef.current.scrollTop = 0;
        return;
      }

      // ── special: exit ────────────────────────────────────────────────────
      if (cmd === "exit") {
        const exitEcho = { text: `> ${parts.join(" ")}`, type: "cmd" };
        if (args[0] === "0") {
          const wasInGame = !!exitStateRef.current.teardown;
          exitStateRef.current.teardown?.();
          if (wasInGame) window.scrollTo({ top: 0, behavior: "instant" });
          isCommandScroll.current = false;
          cmdScrollPos.current = null;
          setLines([]);
          if (outputRef.current) outputRef.current.scrollTop = 0;
          return;
        }
        if (args[0] === "8") {
          // ── Exit 8: seamless corridor loop + anomaly detection game ─────
          // Effects are applied to #root (and its clone) ONLY — never to
          // document.body — so the fixed floating bar (a body child) stays
          // immune to transforms/filters and never drifts.
          const rootEl = document.getElementById("root");
          const st = exitStateRef.current;

          // ── Global style overrides ────────────────────────────────────────
          document.documentElement.style.scrollBehavior = "auto";          document.documentElement.style.overflowX = "hidden"; // clip rotated/scaled elements on mobile          document.body.style.overflowX = "hidden";
          document.body.style.height = "auto";
          rootEl.style.height = "auto";

          // Turn progress bar white (keep it visible but neutral during the game)
          const progressEl = document.querySelector('[class*="progress-container"]');
          if (progressEl) {
            st.progressEl = progressEl;
            progressEl.style.background = "#fff"; // solid white strip, no tracking
            const progressBarEl = progressEl.querySelector('[class*="progress-bar"]');
            if (progressBarEl) { st.progressBarEl = progressBarEl; progressBarEl.style.background = "transparent"; }
          }

          // ── Hero text: current level indicator ───────────────────────────
          const heroEl = document.getElementById("hackerText");
          st.heroEl  = heroEl;
          st.heroOrig = heroEl ? heroEl.textContent : null;
          if (heroEl) {
            heroEl.textContent = "0 \u2193";
            heroEl.style.color = "#2ba2a2";
            heroEl.style.pointerEvents = "none"; // prevent scramble mouseover from resetting
            if (heroEl.parentElement) heroEl.parentElement.style.zIndex = "1";
          }

          // ── Game state ────────────────────────────────────────────────────
          Object.assign(st, {
            score: 0, clones: [], cloneMatrixRafs: [], lastCorridor: 0, corridorFoundAnomaly: false,
            scrollingBack: false, cancelBackScroll: null,
            anomalyActive: false, removeEffect: null, expireTimer: null,
            anomalyFiredThisCorridor: false, isCurrentCorridorClean: true,
            anomalyTriggerY: Infinity, scorePredictedThisCorridor: false,
          });

          window.scrollTo({ top: 0, behavior: "instant" });
          const rootHeight = rootEl.offsetHeight;
          st.rootHeight = rootHeight;

          // ── Effects: per-target (applied only to the current corridor clone) ─
          // Coarse-pointer / narrow devices exclude the two "heavy" geometric
          // effects (rotate+scale, shake). On the full-height #root/clone those
          // overflow the element, which on Android grows the scroll area (causing
          // scroll drift on the way back) and thrashes the GPU layer (making the
          // fixed control buttons jitter and disappear). Filters + in-place mirrors
          // don't change geometry, so they stay safe everywhere.
          const _isMobile =
            (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) ||
            window.innerWidth < 768;
          const EFFECTS_SAFE = [
            (t) => { t.style.filter = "invert(1)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "sepia(1) saturate(4) hue-rotate(300deg)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "brightness(0.04)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "blur(6px) saturate(0)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "invert(0.6) hue-rotate(100deg) saturate(3)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "contrast(20) brightness(0.3)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "hue-rotate(180deg) saturate(5)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "brightness(8)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.transform = "scaleX(-1)"; return () => { t.style.transform = ""; }; },
            (t) => { t.style.transform = "scaleY(-1)"; return () => { t.style.transform = ""; }; },
            (t) => { t.style.fontFamily = '"Comic Sans MS",cursive'; return () => { t.style.fontFamily = ""; }; },
          ];
          const EFFECTS_HEAVY = [
            (t) => { t.style.transform = "rotate(5deg) scale(1.1)"; return () => { t.style.transform = ""; }; },
            (t) => {
              const s = document.createElement("style"); s.id = "_exit8shake";
              s.textContent = "@keyframes _e8s{0%,100%{transform:translateX(0)}25%{transform:translateX(-14px)}75%{transform:translateX(14px)}}";
              document.head.appendChild(s);
              t.style.animation = "_e8s 0.1s ease-in-out infinite";
              return () => { t.style.animation = ""; s.remove(); };
            },
          ];
          const EFFECTS = _isMobile ? EFFECTS_SAFE : [...EFFECTS_SAFE, ...EFFECTS_HEAVY];
          // ── Clone factory ─────────────────────────────────────────────────
          const createAndAppendClone = () => {
            const snapEls = Array.from(rootEl.querySelectorAll("*"));
            snapEls.forEach((el) => {
              const pos = getComputedStyle(el).position;
              if (pos === "fixed" || pos === "sticky") el.setAttribute("data-e8fx", "");
            });
            const c = rootEl.cloneNode(true);
            c.removeAttribute("id");
            c.setAttribute("aria-hidden", "true");
            c.style.cssText = "margin:0;pointer-events:none;";
            // Reveal fade-in-on-scroll sections that hadn't entered the viewport
            // when cloned — their inline opacity:0 would render the clone blank on mobile.
            c.querySelectorAll("*").forEach((el) => {
              if (el.style && el.style.opacity === "0") {
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
              }
            });
            // Canvas pixels don’t survive cloneNode — run a live matrix animation on the clone
            const _origCanvas = rootEl.querySelector("canvas");
            const _cloneCanvas = c.querySelector("canvas");
            if (_origCanvas && _cloneCanvas) {
              _cloneCanvas.width  = _origCanvas.width;
              _cloneCanvas.height = _origCanvas.height;
              const _ctx = _cloneCanvas.getContext("2d");
              if (_ctx) {
                const _chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                const _fs = 14;
                const _cols = Math.floor(_cloneCanvas.width / _fs) + 10;
                const _drops = Array.from({ length: _cols }, () =>
                  Math.floor(Math.random() * (_cloneCanvas.height / _fs)));
                let _mRafId;
                const _drawMatrix = () => {
                  _ctx.fillStyle = "rgba(0,0,0,0.05)";
                  _ctx.fillRect(0, 0, _cloneCanvas.width, _cloneCanvas.height);
                  _ctx.fillStyle = "#626e5e";
                  _ctx.font = `${_fs}px monospace`;
                  for (let _i = 0; _i < _drops.length; _i++) {
                    _ctx.fillText(_chars[Math.floor(Math.random() * _chars.length)], _i * _fs, _drops[_i] * _fs);
                    if (_drops[_i] * _fs > _cloneCanvas.height && Math.random() > 0.975) _drops[_i] = 0;
                    _drops[_i]++;
                  }
                  _mRafId = requestAnimationFrame(_drawMatrix);
                };
                _mRafId = requestAnimationFrame(_drawMatrix);
                st.cloneMatrixRafs.push(() => cancelAnimationFrame(_mRafId));
              }
            }
            c.querySelectorAll("[data-e8fx]").forEach((el) => el.remove());
            snapEls.forEach((el) => el.removeAttribute("data-e8fx"));
            const ch = c.querySelector("#hackerText");
            if (ch) {
              ch.textContent = `${st.score} \u2193`;
              ch.style.color = "#2ba2a2";
              if (ch.parentElement) ch.parentElement.style.zIndex = "1";
            }
            document.body.appendChild(c);
            st.clones.push(c);
            return c;
          };
          createAndAppendClone(); // pre-fetch corridor 1
          exitCloneRef.current = st.clones[0];

          // ── Score UI ──────────────────────────────────────────────────────
          const updateScoreUI = () => {
            const scoreEl = document.getElementById("_exit8score");
            if (scoreEl) scoreEl.textContent = `[${st.score}/8]`;
            if (st.heroEl) { st.heroEl.textContent = `${st.score} \u2193`; st.heroEl.style.color = "#2ba2a2"; }
            (st.clones || []).forEach((c) => {
              const ch = c.querySelector("#hackerText");
              if (ch) { ch.textContent = `${st.score} \u2193`; ch.style.color = "#2ba2a2"; }
            });
          };
          st.updateScoreUI = updateScoreUI;

          // ── Scroll-back animation ─────────────────────────────────────────
          // Locks onto the corridor element's LIVE position each frame (via
          // getBoundingClientRect) rather than a precomputed Y from st.rootHeight,
          // which goes stale (clone height variance, reflows, mobile URL-bar
          // resize) and caused drift on the way back to the corridor top.
          const scrollBack = (corridorEl) => {
            st.cancelBackScroll?.();
            st.scrollingBack = true;
            let backRaf;
            const tick = () => {
              const top = corridorEl.getBoundingClientRect().top; // corridor top offset from viewport top
              if (top >= -1) {
                // At (or just past) the corridor top — snap it exactly to viewport top
                window.scrollTo({ top: window.scrollY + top, left: 0, behavior: "instant" });
                st.scrollingBack = false; st.cancelBackScroll = null; return;
              }
              // Corridor top is above the viewport — scroll up toward it (no overshoot)
              const stepPx = Math.min(28, -top);
              window.scrollTo({ top: window.scrollY - stepPx, left: 0, behavior: "instant" });
              backRaf = requestAnimationFrame(tick);
            };
            backRaf = requestAnimationFrame(tick);
            st.cancelBackScroll = () => { cancelAnimationFrame(backRaf); st.scrollingBack = false; };
          };

          // ── Corridor geometry helpers (real positions, drift-proof) ───────
          const corridorElFor = (idx) => (idx === 0 ? rootEl : (st.clones[idx - 1] || rootEl));
          const corridorRealTop = (idx) =>
            corridorElFor(idx).getBoundingClientRect().top + window.scrollY;
          // Current corridor = highest clone whose real top has reached the viewport top.
          const currentCorridorIdx = () => {
            let idx = 0;
            for (let i = 0; i < st.clones.length; i++) {
              if (st.clones[i].getBoundingClientRect().top <= 1) idx = i + 1;
              else break;
            }
            return idx;
          };

          // ── Per-corridor anomaly reset ────────────────────────────────
          const resetForCorridor = (corridorIdx) => {
            const isClean = Math.random() < 0.3;
            st.isCurrentCorridorClean = isClean;
            st.anomalyFiredThisCorridor = false;
            st.scorePredictedThisCorridor = false;
            // Anchor the trigger to the corridor's REAL top so it never fires the
            // instant we scroll back (the old grid coord drifted from real layout).
            st.anomalyTriggerY = isClean
              ? Infinity
              : corridorRealTop(corridorIdx) + (0.1 + Math.random() * 0.3) * st.rootHeight;
          };

          // ── Anomaly check: immediate score + scrollback ───────────────────
          const triggerAnomalyCheck = () => {
            const currentCorridor = currentCorridorIdx();
            const corridorEl = corridorElFor(currentCorridor);

            // Always clear the expire timer
            if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }

            const wasActive = st.anomalyActive;
            if (st.anomalyActive) {
              st.removeEffect?.();
              st.anomalyActive = false; st.removeEffect = null;
            }

            if (wasActive) {
              // Correct — score immediately
              st.score = Math.min(st.score + 1, 9);
              updateScoreUI();
              if (st.score >= 9) { st.winGame?.(); return; }
              setLines((prev) => [...prev, {
                text: `>> anomaly spotted \u2014 exit ${st.score} clear. [${st.score}/8]`,
                type: "accent",
              }]);
            } else {
              // False call — reset immediately
              const hadProgress = st.score > 0;
              if (hadProgress) { st.score = 0; updateScoreUI(); }
              setLines((prev) => [...prev, {
                text: hadProgress
                  ? ">> false alarm \u2014 reset."
                  : ">> nothing here. keep walking.",
                type: hadProgress ? "danger" : "output",
              }]);
            }

            // Fresh anomaly for same corridor, then scroll back to its top
            resetForCorridor(currentCorridor);
            scrollBack(corridorEl);
          };
          st.triggerAnomalyCheck = triggerAnomalyCheck;

          // ── Shared teardown ───────────────────────────────────────────────
          const teardown = () => {
            if (exitScrollRef.current) { cancelAnimationFrame(exitScrollRef.current); exitScrollRef.current = null; }
            st.cancelBackScroll?.();
            if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }
            if (st.anomalyActive && st.removeEffect) { st.removeEffect(); }
            if (st.heroEl) {
              if (st.heroOrig != null) st.heroEl.textContent = st.heroOrig;
              st.heroEl.style.pointerEvents = ""; st.heroEl.style.color = "";
              if (st.heroEl.parentElement) st.heroEl.parentElement.style.zIndex = "";
            }
            (st.cloneMatrixRafs || []).forEach((cancel) => cancel());
            (st.clones || []).forEach((c) => { try { document.body.removeChild(c); } catch (_) {} });
            exitCloneRef.current = null;
            if (st.progressEl) { st.progressEl.style.backgroundColor = ""; }
            if (st.progressBarEl) { st.progressBarEl.style.background = ""; }
            if (st.scrollUpEl) { st.scrollUpEl.style.visibility = ""; st.scrollUpEl.style.pointerEvents = ""; }
            if (st.anomalyBtn) { try { document.body.removeChild(st.anomalyBtn); } catch (_) {} }
            if (st.exitBtn)    { try { document.body.removeChild(st.exitBtn);    } catch (_) {} }
            if (st.keyHandler) { document.removeEventListener("keydown", st.keyHandler); }
            if (st.preventScroll) {
              document.removeEventListener("wheel",     st.preventScroll);
              document.removeEventListener("touchmove", st.preventScroll);
            }
            if (exitBarRef.current) { try { document.body.removeChild(exitBarRef.current); } catch (_) {} exitBarRef.current = null; }
            rootEl.style.filter = ""; rootEl.style.transform = ""; rootEl.style.fontFamily = ""; rootEl.style.animation = "";
            rootEl.style.height = ""; document.body.style.height = "";
            document.documentElement.style.scrollBehavior = "";
            document.documentElement.style.overflowX = "";
            document.body.style.overflowX = "";
            Object.assign(st, {
              anomalyTimer: null, expireTimer: null, anomalyActive: false, removeEffect: null,
              score: 0, scheduleAnomaly: null, teardown: null, updateScoreUI: null,
              winGame: null, triggerAnomalyCheck: null, clones: [], cloneMatrixRafs: [], heroEl: null, heroOrig: null,
              progressEl: null, scrollUpEl: null, anomalyBtn: null, exitBtn: null, keyHandler: null,
              preventScroll: null,
              scrollingBack: false, cancelBackScroll: null, rootHeight: 0, lastCorridor: 0,
              corridorFoundAnomaly: false, progressBarEl: null,
              anomalyFiredThisCorridor: false, isCurrentCorridorClean: true, anomalyTriggerY: Infinity,
              scorePredictedThisCorridor: false,
            });
          };
          st.teardown = teardown;

          // ── Win sequence ──────────────────────────────────────────────────
          const winGame = () => {
            const escapedHeroEl = st.heroEl;
            const heroOrigText  = st.heroOrig ?? "SHIVCHARAN";
            teardown();

            if (escapedHeroEl) {
              const WITTY = ["Damn you made it.", "u escaped bruv.", "u broke da loop.", "EXIT 8 CLEAR.", "congratulations."];
              let idx    = Math.floor(Math.random() * WITTY.length);
              let active = true;

              // Scroll WITTY text into view first (rAF so browser reflows after clone removal)
              requestAnimationFrame(() => {
                escapedHeroEl.scrollIntoView({ behavior: "smooth", block: "center" });
              });

              // Slide-in-from-left keyframe for each message cycle
              const winStyle = document.createElement("style");
              winStyle.id    = "_e8winStyle";
              winStyle.textContent = "@keyframes _e8winSlide{from{opacity:0;transform:translateX(-50px)}to{opacity:1;transform:translateX(0)}}";
              document.head.appendChild(winStyle);

              // Show one random WITTY message — no cycling
              escapedHeroEl.style.animation = "none";
              void escapedHeroEl.offsetHeight; // force reflow
              escapedHeroEl.textContent = WITTY[idx];
              escapedHeroEl.style.color = "#2ba2a2";
              escapedHeroEl.style.animation = "_e8winSlide 0.5s ease forwards";

              // User interacted — restore hero, stay on page (no terminal focus)
              const restoreHero = () => {
                if (!active) return;
                active = false;
                clearTimeout(focusTimer); // eslint-disable-line no-use-before-define
                escapedHeroEl.textContent = heroOrigText;
                escapedHeroEl.style.color = "";
                escapedHeroEl.style.animation = "";
                winStyle.remove();
              };

              // No interaction for 4s — restore hero + focus terminal
              let focusTimer = setTimeout(() => {
                if (!active) return;
                active = false;
                escapedHeroEl.textContent = heroOrigText;
                escapedHeroEl.style.color = "";
                escapedHeroEl.style.animation = "";
                winStyle.remove();
                if (inputRef.current) {
                  inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                  inputRef.current.focus({ preventScroll: true });
                }
              }, 4000);

              // 500ms grace — prevents winning gesture from immediately clearing win text
              setTimeout(() => {
                document.addEventListener("mousemove",   restoreHero, { once: true });
                document.addEventListener("pointerdown", restoreHero, { once: true });
                document.addEventListener("touchmove",   restoreHero, { once: true });
              }, 500);
            }

            setLines((prev) => [...prev,
              { text: ">> you made it out. congrats :)", type: "accent" },
            ]);
          };
          st.winGame = winGame;

          // ── Controls ──────────────────────────────────────────────────────
          // Hide real scroll-up button; overlay anomaly (!) and EXIT buttons.
          const scrollUpEl = document.querySelector('[aria-label="Scroll to top"]');
          if (scrollUpEl) {
            st.scrollUpEl = scrollUpEl;
            scrollUpEl.style.visibility = "hidden";
            scrollUpEl.style.pointerEvents = "none";
          }
          const anomalyBtn = document.createElement("button");
          anomalyBtn.id = "_exit8anomalyBtn";
          anomalyBtn.textContent = "!";
          anomalyBtn.title = "Report anomaly (Enter)";
          anomalyBtn.style.cssText = "position:fixed;bottom:24px;right:24px;width:42px;height:42px;z-index:99998;background:#2ba2a2;border:1px solid #2ba2a2;border-radius:50%;color:#000;font-weight:900;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono,monospace);";
          anomalyBtn.addEventListener("click", triggerAnomalyCheck);
          document.body.appendChild(anomalyBtn);
          st.anomalyBtn = anomalyBtn;

          const exitBtn = document.createElement("button");
          exitBtn.id = "_exit8exitBtn";
          exitBtn.textContent = "EXIT";
          exitBtn.title = "Quit corridor (Esc)";
          exitBtn.style.cssText = "position:fixed;bottom:24px;left:-120px;z-index:99998;background:#a22b2b;border:1px solid #a22b2b;color:#fff;padding:0 18px;height:42px;cursor:pointer;font-family:var(--font-mono,monospace);font-size:13px;transition:left 0.4s cubic-bezier(0.22,0.61,0.36,1);border-radius:4px;";
          exitBtn.addEventListener("click", () => runCommand("exit 0"));
          document.body.appendChild(exitBtn);
          st.exitBtn = exitBtn;
          setTimeout(() => { exitBtn.style.left = "24px"; }, 50);

          const keyHandler = (e) => {
            if (!exitStateRef.current.triggerAnomalyCheck) return;
            // Block all browser-native scroll keys during the game
            if ([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
              e.preventDefault();
            }
            if (e.key === "Enter") {
              e.preventDefault();
              // Release terminal input focus so it doesn't swallow the action
              if (inputRef.current && document.activeElement === inputRef.current) inputRef.current.blur();
              exitStateRef.current.triggerAnomalyCheck?.();
            }
            if (e.key === "Escape") { runCommand("exit 0"); }
          };
          document.addEventListener("keydown", keyHandler);
          st.keyHandler = keyHandler;

          // Block mouse-wheel and touch-drag scroll — only the auto-scroll in step() moves the page
          const preventScroll = (e) => { e.preventDefault(); };
          document.addEventListener("wheel",     preventScroll, { passive: false });
          document.addEventListener("touchmove", preventScroll, { passive: false });
          st.preventScroll = preventScroll;

          // Blur terminal input so the very first Enter goes to the game, not the terminal
          if (inputRef.current) inputRef.current.blur();

          // ── Main scroll loop ────────────────────────────────────────────────────────────
          resetForCorridor(0); // prime corridor 0 anomaly
          const step = () => {
            const currentCorridor = currentCorridorIdx();

            // Natural corridor exit — score the corridor we just LEFT, set up the new one
            if (currentCorridor > st.lastCorridor) {
              st.lastCorridor = currentCorridor;

              if (!st.corridorFoundAnomaly) {
                if (st.isCurrentCorridorClean) {
                  // No anomaly, player didn’t press → CLEAN PASS → score++
                  st.score = Math.min(st.score + 1, 9);
                  updateScoreUI();
                  if (st.score >= 9) { st.winGame?.(); return; }
                } else if (st.anomalyFiredThisCorridor) {
                  // Anomaly appeared but player scrolled past without calling → MISSED
                  st.score = 0;
                  updateScoreUI();
                  setLines((l) => [...l, { text: ">> anomaly missed \u2014 reset.", type: "danger" }]);
                }
              }

              // Clean up any still-active effect before the new corridor
              if (st.anomalyActive) {
                if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }
                st.removeEffect?.(); st.anomalyActive = false; st.removeEffect = null;
              }

              st.corridorFoundAnomaly = false;   // reset for new corridor
              resetForCorridor(currentCorridor);
            }

            // Fire anomaly at the trigger scroll-point (never while scrolling back)
            if (!st.scrollingBack && !st.anomalyFiredThisCorridor && window.scrollY >= st.anomalyTriggerY) {
              st.anomalyFiredThisCorridor = true;
              const targetEl = corridorElFor(currentCorridor);
              st.removeEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)](targetEl);
              st.anomalyActive = true;
              // 5-second display window — effect disappears but no scroll-back here;
              // scoring consequence comes when player exits the corridor without pressing.
              st.expireTimer = setTimeout(() => {
                if (st.anomalyActive) {
                  st.removeEffect?.();
                  st.anomalyActive = false; st.removeEffect = null;
                }
              }, 5000);
            }

            // At 70% of corridor: expire anomaly effect + pre-update next clone’s score display
            if (!st.scrollingBack && window.scrollY >= corridorRealTop(currentCorridor) + 0.7 * st.rootHeight) {
              if (st.anomalyActive) {
                if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }
                st.removeEffect?.();
                st.anomalyActive = false;
                st.removeEffect = null;
              }
              if (!st.scorePredictedThisCorridor) {
                st.scorePredictedThisCorridor = true;
                const _nextClone = st.clones[currentCorridor]; // corridor currentCorridor+1's clone
                if (_nextClone) {
                  let _pred = st.score;
                  if (!st.corridorFoundAnomaly) {
                    if (st.isCurrentCorridorClean) _pred = Math.min(st.score + 1, 9);
                    else if (st.anomalyFiredThisCorridor) _pred = 0;
                  }
                  const _ch = _nextClone.querySelector("#hackerText");
                  if (_ch) { _ch.textContent = `${_pred} \u2193`; _ch.style.color = "#2ba2a2"; }
                }
              }
            }

            // Append new clone when within 600px of the bottom
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 600) {
              createAndAppendClone();
            }

            if (!st.scrollingBack) window.scrollTo({ top: window.scrollY + 8, left: 0, behavior: "instant" });
            exitScrollRef.current = requestAnimationFrame(step);
          };
          exitScrollRef.current = requestAnimationFrame(step);

          captureScrollPos();
          setLines((prev) => [
            ...prev,
            exitEcho,
            { text: ">> corridor initiated. something is wrong in here.", type: "danger" },
            { text: ">> spot anomalies. press ENTER or tap [!] to call them.", type: "output" },
            { text: ">> reach exit 8. ESC or EXIT to quit.  // false calls reset you.", type: "output" },
          ]);
          return;
        }
        captureScrollPos();
        setLines((prev) => [
          ...prev,
          exitEcho,
          { text: "shivi-shell: exit: this ain't bash. try 'clear' or close the terminal.", type: "danger" },
        ]);
        return;
      }

      // ── special: history ────────────────────────────────────────────────
      if (cmd === "history") {
        const histLines = newHistory.length
          ? newHistory.map((h, i) => ({ text: `  ${newHistory.length - i}  ${h}`, type: "output" }))
          : [{ text: "  (no history yet)", type: "output" }];
        // Batch: echo + history lines in one setLines call
        captureScrollPos();
        setLines((prev) => [...prev, { text: `> ${parts.join(" ")}`, type: "cmd" }, ...histLines]);
        return;
      }

      // ── all other commands ───────────────────────────────────────────────
      // Build the full new batch (echo line + result lines) before any setState
      // so the scroll effect fires exactly ONCE (one setLines → one useEffect run).
      const echo = { text: `> ${parts.join(" ")}`, type: "cmd" };

      if (!(cmd in commands)) {
        captureScrollPos();
        setLines((prev) => [
          ...prev,
          echo,
          { text: `shivi-shell: command not found: ${cmd}. Type 'help' for commands.`, type: "danger" },
        ]);
        return;
      }

      const result = commands[cmd](args);
      captureScrollPos();
      setLines((prev) => [...prev, echo, ...result]);
    },
    [historyList, scrollToSection, captureScrollPos]
  );

  // ── Keyboard handling ─────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, historyList.length - 1);
      setHistIdx(next);
      setInput(historyList[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : historyList[next]);
    }
  };

  // ── Chip commands for mobile ──────────────────────────────────────────────
  const CHIPS = ["help", "whoami", "skills", "projects", "contact", "resume", "interests", "games", "anime", "cycling", "rubik", "tech", "spotify", "matrix", "ls", "sudo", "exit 8", "clear"];

  return (
    <div className={styles.interactiveTerminal}>
      {/* Output area */}
      <div ref={outputRef} className={styles.termOutput} aria-live="polite" aria-label="Terminal output">
        {lines.map((line, i) => (
          <p key={i} className={`${styles.lines} ${styles[`line-${line.type}`]}`}>
            {line.type === "link" ? (
              <a href={line.href} target={line.target || "_blank"} rel={line.rel || "noopener noreferrer"}>
                {line.text}
              </a>
            ) : (
              renderText(line.text)
            )}
          </p>
        ))}
        {booting && <span className={styles.bootCursor} aria-hidden="true" />}
      </div>

      {/* Input row */}
      {ready && (
        <div className={styles.termInputRow}>
          <span className={styles.termPrompt} aria-hidden="true">&gt;&nbsp;</span>
          <span className={styles.termInputWrap}>
            <input
              ref={inputRef}
              className={styles.termInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Terminal input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {/* Fake terminal cursor — mirrors the typed text so the block sits
                right after it, and blinks via CSS. */}
            <span className={styles.termInputMirror} aria-hidden="true">
              {input}
              <span className={styles.inputCursor} />
            </span>
          </span>
        </div>
      )}

      {/* Mobile command chips */}
      {ready && (
        <div className={styles.termChips} aria-label="Quick commands">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              className={styles.termChip}
              onClick={() => { runCommand(chip); }}
              aria-label={`Run ${chip}`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
