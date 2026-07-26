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

// ─── Virtual filesystem ──────────────────────────────────────────────────────
// Files visible under `ls` and readable via `cat <name>`.
// Each entry: { name, type: "file"|"dir", fn: () => Line[] }
function buildVirtualFiles(scrollToSection) {
  const contactEntry = ABOUT.find((e) => e.input === "Shivcharan.contactInfo");
  const resumeEntry  = ABOUT.find((e) => e.input === "Shivcharan.resume");

  return {
    "skills.txt": () => {
      const entry = ABOUT.find((e) => e.input === "Shivcharan.skills");
      return [{ text: entry ? entry.return : "[]", type: "accent" }];
    },
    "contact.txt": () => {
      if (!contactEntry || !Array.isArray(contactEntry.return)) return [];
      return contactEntry.return.map((link) => {
        const value = link.href
          .replace(/^mailto:/, "")
          .replace(/^https?:\/\/(www\.)?/, "");
        return {
          text: `${(link.text + ":").padEnd(10)}${value}`, type: "link",
          href: link.href, target: link.target, rel: link.rel || "noopener noreferrer",
        };
      });
    },
    "resume.txt": () => {
      if (resumeEntry && Array.isArray(resumeEntry.return) && resumeEntry.return[0]) {
        window.open(resumeEntry.return[0].href, "_blank", "noopener,noreferrer");
      }
      return [{ text: ">> opening resume in new tab...", type: "info" }];
    },
    "interests.txt": () =>
      Object.values(INTERESTS).map((i) => ({
        text: `  ${i.icon}  ${i.label.padEnd(14)} - ${i.blurb}`, type: "output",
      })),
    "games.txt":   () => interestLines("games"),
    "anime.txt":   () => interestLines("anime"),
    "cycling.txt": () => interestLines("cycling"),
    "rubik.txt":   () => interestLines("rubik"),
    "tech.txt":    () => interestLines("tech"),
    "music.txt":   () => interestLines("music"),
  };
}

// ─── Command definitions ────────────────────────────────────────────────────
function buildCommands(scrollToSection) {
  const virtualFiles = buildVirtualFiles(scrollToSection);

  return {
    help: () => [
      { text: "Available commands:", type: "info" },
      { text: "  whoami              - print current user identity", type: "output" },
      { text: "  ls                  - list files (cat <file> to read)", type: "output" },
      { text: "  cat <file>          - read a file (e.g. cat skills.txt)", type: "output" },
      { text: "  git log             - career timeline as git commits", type: "output" },
      { text: "  timeline            - jump to timeline section", type: "output" },
      { text: "  projects            - jump to projects section", type: "output" },
      { text: "  portfolio --no-css  - brutalist HTML version (1997 edition)  [Ctrl+K r]", type: "output" },
      { text: "  matrix [sub]        - matrix rain controls (matrix -h for sub-commands)", type: "output" },
      { text: "  replay [sub]        - replay intro sequences (replay -h for sub-commands)  [Ctrl+K s/m/a]", type: "output" },
      { text: "  clear               - clear terminal", type: "output" },
      { text: "  history             - command history", type: "output" },
      { text: "  sudo                - try it ;)", type: "output" },
      { text: "  exit 8              - the loop. spot 8 anomalies.", type: "output" },
      { text: "  suicide             - closes the tab. for real.  [Ctrl+K q]", type: "output" },
    ],

    ls: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "ls - list files in the virtual filesystem. use cat <file> to read.", type: "info" }];
      const names = Object.keys(virtualFiles);
      return [
        { text: "drwxr-xr-x  projects/", type: "output" },
        { text: "drwxr-xr-x  beyond-code/", type: "output" },
        ...names.map((n) => ({ text: `-rw-r--r--  ${n}`, type: "output" })),
        { text: "-rw-------  .secrets", type: "danger" },
      ];
    },

    whoami: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "whoami - print the current user identity.", type: "info" }];
      return [
        { text: "Shivcharan Thirunavukkarasu", type: "accent" },
        { text: "CSE grad - developer - gamer - cube-scrambler", type: "output" },
        { text: "Currently on a quest to locate the elusive missing semicolon ;)", type: "output" },
      ];
    },

    cat: (args) => {
      if (!args.length || args[0] === "-h" || args[0] === "--help") {
        if (!args.length) return [
          { text: "usage: cat <file>", type: "info" },
          { text: "  available: " + Object.keys(virtualFiles).join(", "), type: "output" },
        ];
        return [{ text: "cat <file> - read a virtual file. try: cat skills.txt or cat contact.txt", type: "info" }];
      }
      if (args[0] === ".secrets" || args[0] === "secrets") {
        return [{ text: "cat: .secrets: Permission denied", type: "danger" }];
      }
      const name = args[0].endsWith(".txt") ? args[0] : args[0] + ".txt";
      if (virtualFiles[name]) return virtualFiles[name]();
      // strip .txt and try bare name too
      const bare = args[0].replace(/\.txt$/, "");
      if (virtualFiles[bare]) return virtualFiles[bare]();
      return [{ text: `cat: ${args[0]}: no such file`, type: "danger" }];
    },

    projects: () => {
      scrollToSection("projects");
      return [{ text: ">> scrolling to projects...", type: "info" }];
    },

    matrix: (args) => {
      if (args.length && (args[0] === "-h" || args[0] === "--help")) {
        return [
          { text: "matrix sub-commands:", type: "info" },
          { text: "  matrix fps N     - set rain speed (0 = native refresh)", type: "output" },
          { text: "  matrix rainbow   - enable rainbow mode", type: "output" },
          { text: "  matrix reset     - restore default color", type: "output" },
        ];
      }
      if (args.length && args[0] === "fps") {
        const val = parseInt(args[1], 10);
        if (isNaN(val) || val < 0 || val > 240) {
          return [{ text: "usage: matrix fps <0-240>  (0 = native refresh rate)", type: "danger" }];
        }
        window.__matrixFps = val;
        return [{ text: `>> matrix fps set to ${val === 0 ? "native refresh rate" : `${val} fps`}`, type: "info" }];
      }
      if (args.length && args[0] === "rainbow") {
        window.__matrixRainbow = true;
        return [{ text: ">> matrix: rainbow mode enabled. you're a person of culture.", type: "info" }];
      }
      if (args.length && args[0] === "reset") {
        window.__matrixRainbow = false;
        return [{ text: ">> matrix: color reset to default.", type: "info" }];
      }
      return [
        { text: "matrix sub-commands:", type: "info" },
        { text: "  matrix fps N     - set rain speed (0 = native refresh)", type: "output" },
        { text: "  matrix rainbow   - enable rainbow mode", type: "output" },
        { text: "  matrix reset     - restore default color", type: "output" },
      ];
    },

    git: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "git log - shows career timeline as git commits. only log is supported.", type: "info" }];
      if (args[0] !== "log") {
        return [{ text: `git: '${args[0] || ""}' is not a git command. Try 'git log'.`, type: "danger" }];
      }
      return [
        { text: "commit 0f1a2b3  (HEAD -> main)", type: "accent" },
        { text: "Date:   Jun 2025", type: "output" },
        { text: "    chore: still shipping. semicolon still missing.", type: "output" },
        { text: "", type: "output" },
        { text: "commit f2a0c81", type: "accent" },
        { text: "Date:   Jan 2025", type: "output" },
        { text: "    feat(career): promoted to MLE2 @ Comcast", type: "output" },
        { text: "", type: "output" },
        { text: "commit 9c3d77e", type: "accent" },
        { text: "Date:   Jan 2024", type: "output" },
        { text: "    feat(career): joined Comcast as MLE1", type: "output" },
        { text: "", type: "output" },
        { text: "commit 4f8e21b  (tag: v4.0.0)", type: "accent" },
        { text: "Date:   May 2023", type: "output" },
        { text: "    feat: graduated. shipped to production.", type: "output" },
        { text: "", type: "output" },
        { text: "commit a1b2c3d", type: "accent" },
        { text: "Date:   Sep 2019", type: "output" },
        { text: "    Initial commit: enrolled in B.E. CSE, SSNCE", type: "output" },
      ];
    },

    portfolio: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "portfolio --no-css - loads the brutalist plain-HTML version of this site.", type: "info" }];
      if (args[0] === "--no-css") {
        setTimeout(() => { window.location.href = "/portfolio/raw.html"; }, 400);
        return [{ text: ">> loading brutalist edition... (circa 1997)", type: "info" }];
      }
      return [{ text: "usage: portfolio --no-css", type: "danger" }];
    },

    timeline: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "timeline - scrolls the page to the Timeline section.", type: "info" }];
      scrollToSection("timeline");
      return [{ text: ">> scrolling to timeline...", type: "info" }];
    },

    projects: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "projects - scrolls the page to the Projects section.", type: "info" }];
      scrollToSection("projects");
      return [{ text: ">> scrolling to projects...", type: "info" }];
    },

    replay: (args) => {
      if (!args.length || args[0] === "-h" || args[0] === "--help") {
        return [
          { text: "replay sub-commands:", type: "info" },
          { text: "  replay splash    - see the loading splash again", type: "output" },
          { text: "  replay matrix    - replay the matrix + name scramble", type: "output" },
          { text: "  replay all       - full reset: splash + matrix scramble", type: "output" },
        ];
      }
      const sub = args[0];
      if (sub === "splash") {
        sessionStorage.removeItem("splashShown");
        sessionStorage.setItem("replayReload", "1");
        setTimeout(() => window.location.reload(), 500);
        return [{ text: ">> replaying splash. reloading - watch for the boom.", type: "info" }];
      }
      if (sub === "matrix") {
        sessionStorage.removeItem("hasRun");
        sessionStorage.setItem("replayReload", "1");
        setTimeout(() => window.location.reload(), 500);
        return [{ text: ">> replaying matrix. reloading - shivcharan incoming.", type: "info" }];
      }
      if (sub === "all") {
        sessionStorage.removeItem("splashShown");
        sessionStorage.removeItem("hasRun");
        sessionStorage.setItem("replayReload", "1");
        setTimeout(() => window.location.reload(), 500);
        return [{ text: ">> full replay. reloading - full intro from scratch.", type: "info" }];
      }
      return [{ text: `replay: unknown sub-command '${sub}'. try replay -h`, type: "danger" }];
    },


    sudo: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "sudo - try it. i dare you.", type: "info" }];
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

    suicide: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "suicide - closes the current tab. no questions asked.", type: "info" }];
      setTimeout(() => window.location.replace("about:blank"), 600);
      return [{ text: ">> bye o/", type: "info" }];
    },

    clear: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "clear - clears the terminal output.", type: "info" }];
      return [];
    },
    history: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "history - shows the last 50 commands entered this session.", type: "info" }];
      return [];
    },

    "--no-css": () => {
      setTimeout(() => { window.location.href = "/portfolio/raw.html"; }, 400);
      return [{ text: ">> loading brutalist edition... (circa 1997)", type: "info" }];
    },
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
    // Always follow the latest line - the newest output sits at the bottom of
    // the fixed-height pane, just like a real terminal.
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
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
          // Effects are applied to #root (and its clone) ONLY - never to
          // document.body - so the fixed floating bar (a body child) stays
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
            anomalyTriggerY: Infinity, scorePredictedThisCorridor: false, verdictLocked: false,
            _lastForwardT: null, // used by step() to normalise speed to real wall-clock time
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
            // brightness(0.04) is invisible on this dark (#000) theme - use a stark desaturated
            // contrast instead that clearly reads as "wrong" even on a black background.
            (t) => { t.style.filter = "saturate(0) contrast(6) brightness(1.8)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "blur(6px) saturate(0)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "invert(0.6) hue-rotate(100deg) saturate(3)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "contrast(20) brightness(0.3)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "hue-rotate(180deg) saturate(5)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.filter = "brightness(8)"; return () => { t.style.filter = ""; }; },
            (t) => { t.style.transform = "scaleX(-1)"; return () => { t.style.transform = ""; }; },
            (t) => { t.style.transform = "scaleY(-1)"; return () => { t.style.transform = ""; }; },
            // fontFamily on #root doesn't change canvas text (drawn with 'monospace' in JS)
            // and most elements inherit the CSS variable explicitly - barely noticeable.
            // Replace with a strong drop-shadow glitch that's always visible.
            (t) => { t.style.filter = "hue-rotate(260deg) saturate(15) brightness(1.1)"; return () => { t.style.filter = ""; }; },
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
            // when cloned - their inline opacity:0 would render the clone blank on mobile.
            c.querySelectorAll("*").forEach((el) => {
              if (el.style && el.style.opacity === "0") {
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
              }
            });
            // Canvas pixels don’t survive cloneNode - run a live matrix animation on the clone
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
            st._lastForwardT = null; // reset forward-speed clock so there's no big jump on resume
            let backRaf;
            const tick = () => {
              const top = corridorEl.getBoundingClientRect().top; // corridor top offset from viewport top
              // Terminate within 3px - sub-pixel BoundingClientRect values can make the
              // old ">= -1" threshold loop forever (stepPx rounds to 0, no progress).
              if (top >= -3) {
                if (top < 0) window.scrollTo({ top: Math.round(window.scrollY + top), left: 0, behavior: "instant" });
                st.scrollingBack = false; st.cancelBackScroll = null; return;
              }
              // Eased deceleration: 35% of remaining distance per frame, min 4 px, max 60 px.
              // Feels much smoother than a fixed step and never micro-loops at fractional px.
              const stepPx = Math.max(4, Math.min(60, Math.round(-top * 0.35)));
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
            st.verdictLocked = false;
            // Anchor the trigger to the corridor's REAL top so it never fires the
            // instant we scroll back (the old grid coord drifted from real layout).
            st.anomalyTriggerY = isClean
              ? Infinity
              : corridorRealTop(corridorIdx) + (0.1 + Math.random() * 0.3) * st.rootHeight;
          };

          // ── Lock the verdict for the corridor we're leaving ───────────────
          // Called when the next homescreen's number is about to become readable
          // (its hero text touches the viewport bottom edge) OR at corridor exit -
          // whichever comes first. After this the anomaly is no longer callable, so a
          // player can't read the pre-set number and then decide. Idempotent.
          // Returns true if this pushed the score to a win.
          const lockCorridorVerdict = () => {
            if (st.verdictLocked) return false;
            st.verdictLocked = true;
            if (st.isCurrentCorridorClean) {
              // No anomaly, player didn't call → CLEAN PASS → score++
              st.score = Math.min(st.score + 1, 9);
              updateScoreUI();
            } else if (st.anomalyFiredThisCorridor) {
              // Anomaly appeared but was never called in time → MISSED
              st.score = 0;
              updateScoreUI();
              setLines((l) => [...l, { text: ">> anomaly missed \u2014 reset.", type: "danger" }]);
            }
            if (st.anomalyActive) {
              if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }
              st.removeEffect?.(); st.anomalyActive = false; st.removeEffect = null;
            }
            return st.score >= 9;
          };

          // ── Anomaly check: score + scrollback ─────────────────────────────
          // A real anomaly is callable until its verdict locks - i.e. until the next
          // corridor's homescreen number is about to enter view (hero touches the
          // bottom edge). The 5s effect is only a visual flash; you can still call it
          // after it fades, as long as the verdict hasn't locked.
          const triggerAnomalyCheck = () => {
            const currentCorridor = currentCorridorIdx();
            const corridorEl = corridorElFor(currentCorridor);

            // Clear the visual-expire timer + wipe any lingering effect
            if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }
            if (st.anomalyActive) {
              st.removeEffect?.();
              st.anomalyActive = false; st.removeEffect = null;
            }

            if (st.anomalyFiredThisCorridor && !st.verdictLocked) {
              // Correct - a real anomaly fired in this corridor and is still callable
              st.score = Math.min(st.score + 1, 9);
              updateScoreUI();
              if (st.score >= 9) { st.winGame?.(); return; }
              setLines((prev) => [...prev, {
                text: `>> anomaly spotted \u2014 exit ${st.score} clear. [${st.score}/8]`,
                type: "accent",
              }]);
            } else {
              // False call (or too late - verdict already locked) - reset immediately
              const hadProgress = st.score > 0;
              if (hadProgress) { st.score = 0; updateScoreUI(); }
              setLines((prev) => [...prev, {
                text: hadProgress
                  ? ">> false alarm \u2014 reset."
                  : ">> nothing here. keep walking.",
                type: hadProgress ? "danger" : "output",
              }]);
            }

            // Fresh anomaly for the same corridor, then scroll back to its top
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
              scorePredictedThisCorridor: false, verdictLocked: false, _lastForwardT: null,
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

              // Show one random WITTY message - no cycling
              escapedHeroEl.style.animation = "none";
              void escapedHeroEl.offsetHeight; // force reflow
              escapedHeroEl.textContent = WITTY[idx];
              escapedHeroEl.style.color = "#2ba2a2";
              escapedHeroEl.style.animation = "_e8winSlide 0.5s ease forwards";

              // User interacted - restore hero, stay on page (no terminal focus)
              const restoreHero = () => {
                if (!active) return;
                active = false;
                clearTimeout(focusTimer); // eslint-disable-line no-use-before-define
                escapedHeroEl.textContent = heroOrigText;
                escapedHeroEl.style.color = "";
                escapedHeroEl.style.animation = "";
                winStyle.remove();
              };

              // No interaction for 4s - restore hero + focus terminal
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

              // 500ms grace - prevents winning gesture from immediately clearing win text
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

          // Block mouse-wheel and touch-drag scroll - only the auto-scroll in step() moves the page
          const preventScroll = (e) => { e.preventDefault(); };
          document.addEventListener("wheel",     preventScroll, { passive: false });
          document.addEventListener("touchmove", preventScroll, { passive: false });
          st.preventScroll = preventScroll;

          // Blur terminal input so the very first Enter goes to the game, not the terminal
          if (inputRef.current) inputRef.current.blur();

          // ── Main scroll loop ────────────────────────────────────────────────────────────
          resetForCorridor(0); // prime corridor 0 anomaly
          const step = (now) => {
            const currentCorridor = currentCorridorIdx();

            // Lock the verdict the instant the NEXT corridor's homescreen number is about
            // to become readable - the moment its hero text touches the viewport bottom
            // edge. After this the anomaly is no longer callable, so the player can't read
            // the pre-set number and then turn back to game it.
            if (!st.verdictLocked && !st.scrollingBack) {
              const _nextClone = st.clones[currentCorridor]; // corridor currentCorridor+1's clone
              const _nextHero = _nextClone && _nextClone.querySelector("#hackerText");
              if (_nextHero && _nextHero.getBoundingClientRect().top <= window.innerHeight) {
                if (lockCorridorVerdict()) { st.winGame?.(); return; }
              }
            }

            // Natural corridor exit - set up the new corridor. The verdict for the corridor
            // we left is normally already locked (above); this is just a safety fallback.
            if (currentCorridor > st.lastCorridor) {
              st.lastCorridor = currentCorridor;
              if (lockCorridorVerdict()) { st.winGame?.(); return; }
              resetForCorridor(currentCorridor);
            }

            // Fire anomaly at the trigger scroll-point (never while scrolling back)
            if (!st.scrollingBack && !st.anomalyFiredThisCorridor && window.scrollY >= st.anomalyTriggerY) {
              st.anomalyFiredThisCorridor = true;
              const targetEl = corridorElFor(currentCorridor);
              st.removeEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)](targetEl);
              st.anomalyActive = true;
              // 5-second VISUAL flash only - the anomaly stays *callable* for the rest of
              // the corridor (via anomalyFiredThisCorridor) even after the effect fades.
              st.expireTimer = setTimeout(() => {
                if (st.anomalyActive) {
                  st.removeEffect?.();
                  st.anomalyActive = false; st.removeEffect = null;
                }
              }, 5000);
            }

            // At 70% of corridor: pre-set the next clone's homescreen number to its FINAL
            // settled value before it scrolls into view - a clean pass shows +1, an
            // uncalled anomaly shows 0 (a miss). The next homescreen isn't visible yet at
            // 70%, so this leaks nothing; if the player calls the anomaly after 70% they
            // turn back (away from that clone) and a re-walk re-predicts. Only mark
            // predicted once the clone actually exists so it retries for tall corridors
            // whose next clone is appended after the 70% mark.
            if (!st.scrollingBack && window.scrollY >= corridorRealTop(currentCorridor) + 0.7 * st.rootHeight) {
              if (!st.scorePredictedThisCorridor) {
                const _nextClone = st.clones[currentCorridor]; // corridor currentCorridor+1's clone
                if (_nextClone) {
                  st.scorePredictedThisCorridor = true;
                  let _pred = st.score;
                  if (st.isCurrentCorridorClean) _pred = Math.min(st.score + 1, 9);
                  else if (st.anomalyFiredThisCorridor) _pred = 0;
                  const _ch = _nextClone.querySelector("#hackerText");
                  if (_ch) { _ch.textContent = `${_pred} \u2193`; _ch.style.color = "#2ba2a2"; }
                }
              }
            }

            // Append new clone when within 600px of the bottom
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 600) {
              createAndAppendClone();
            }

            if (!st.scrollingBack) {
              // Normalise scroll speed to wall-clock time so it's the same at 60 Hz,
              // 90 Hz, and 120 Hz (without this, speed doubles on high-refresh displays).
              const dt = st._lastForwardT == null ? 16.67 : Math.min(now - st._lastForwardT, 50);
              st._lastForwardT = now;
              const px = Math.max(1, Math.round(500 * dt / 1000)); // target 500 px/s
              window.scrollTo({ top: window.scrollY + px, left: 0, behavior: "instant" });
            } else {
              st._lastForwardT = null; // reset while paused so first forward frame isn't a big jump
            }
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
    } else if (e.key === "Tab") {
      // Autocomplete command names, or file names for the current argument.
      e.preventDefault();
      const parts = input.split(/\s+/);
      const editingCommand = parts.length <= 1;
      const token = (parts[parts.length - 1] || "").toLowerCase();
      if (!token) return;
      const pool = editingCommand
        ? Object.keys(buildCommands(scrollToSection)).filter((c) => !c.startsWith("-"))
        : Object.keys(buildVirtualFiles(scrollToSection));
      const matches = pool.filter((c) => c.startsWith(token));
      if (matches.length === 0) return;
      // Longest common prefix across all matches.
      let prefix = matches[0];
      for (const m of matches) {
        while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
      }
      parts[parts.length - 1] = prefix;
      setInput(parts.join(" "));
      if (matches.length > 1) {
        setLines((prev) => [...prev, { text: matches.join("   "), type: "output" }]);
      }
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
  const CHIPS = ["help", "ls", "whoami", "cat skills.txt", "cat contact.txt", "git log", "timeline", "projects", "matrix", "replay", "sudo", "exit 8", "clear"];

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
            {/* Fake terminal cursor - mirrors the typed text so the block sits
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
