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
      { text: "  exit 8       — the loop. 8 anomalies. you know the rules.", type: "output" },
      { text: "  anomaly      — call this when something looks wrong (exit 8 only)", type: "output" },
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
        exitStateRef.current.teardown?.();
        window.scrollTo({ top: 0, behavior: "instant" });
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
          exitStateRef.current.teardown?.();
          window.scrollTo({ top: 0, behavior: "instant" });
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

          // Targets that visual effects apply to (real root + seamless clone).
          const fxTargets = () => [rootEl, exitCloneRef.current].filter(Boolean);
          const applyStyle = (prop, val) => {
            const els = fxTargets();
            els.forEach((el) => { el.style[prop] = val; });
            return () => { els.forEach((el) => { el.style[prop] = ""; }); };
          };

          const EFFECTS = [
            () => applyStyle("filter", "invert(1)"),
            () => applyStyle("filter", "sepia(1) saturate(4) hue-rotate(300deg)"),
            () => applyStyle("filter", "brightness(0.04)"),
            () => applyStyle("filter", "blur(6px) saturate(0)"),
            () => applyStyle("filter", "invert(0.6) hue-rotate(100deg) saturate(3)"),
            () => applyStyle("filter", "contrast(20) brightness(0.3)"),
            () => applyStyle("filter", "hue-rotate(180deg) saturate(5)"),
            () => applyStyle("filter", "brightness(8)"),
            () => applyStyle("transform", "scaleX(-1)"),
            () => applyStyle("transform", "scaleY(-1)"),
            () => applyStyle("transform", "rotate(5deg) scale(1.1)"),
            () => applyStyle("fontFamily", '"Comic Sans MS", cursive'),
            () => {
              const s = document.createElement("style"); s.id = "_exit8shake";
              s.textContent = "@keyframes _exit8shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-14px)}75%{transform:translateX(14px)}}";
              document.head.appendChild(s);
              const remove = applyStyle("animation", "_exit8shake 0.1s ease-in-out infinite");
              return () => { remove(); s.remove(); };
            },
          ];

          const st = exitStateRef.current;
          st.score = 0;

          // ── Neutralise global scroll-behavior:smooth so instant teleport works ──
          document.documentElement.style.scrollBehavior = "auto";
          document.body.style.overflowX = "hidden";

          // ── Fix heights so clone lands AFTER content, not at 100vh ───────
          // body has height:100vh and #root has height:100%. Content overflows
          // those boxes, so a sibling clone lands at y=100vh (middle of page!)
          // Fix: set both to auto so they expand to fit content, and the clone
          // appends at the actual bottom.
          document.body.style.height = "auto";
          rootEl.style.height = "auto";

          // ── Change hero text to current level ───────────────────────────
          const heroEl = document.getElementById("hackerText");
          st.heroEl = heroEl;
          st.heroOrig = heroEl ? heroEl.textContent : null;
          if (heroEl) heroEl.textContent = "0";

          // ── Seamless loop: clone #root in NORMAL FLOW below itself ───────
          window.scrollTo({ top: 0, behavior: "instant" });
          const rootHeight = rootEl.offsetHeight;
          const liveEls = Array.from(rootEl.querySelectorAll("*"));
          liveEls.forEach((el) => {
            const pos = getComputedStyle(el).position;
            if (pos === "fixed" || pos === "sticky") el.setAttribute("data-e8fx", "");
          });
          const clone = rootEl.cloneNode(true);
          clone.id = "_exit8clone";
          clone.setAttribute("aria-hidden", "true");
          clone.style.margin = "0";
          clone.style.pointerEvents = "none";
          clone.querySelectorAll("[data-e8fx]").forEach((el) => el.remove());
          liveEls.forEach((el) => el.removeAttribute("data-e8fx"));
          // Set clone's hero text to match
          const cloneHero = clone.querySelector("[id='hackerText']");
          if (cloneHero) cloneHero.textContent = "0";
          document.body.appendChild(clone);
          exitCloneRef.current = clone;

          // ── Floating bottom bar (input + score) ─────────────────────────
          const bar = document.createElement("div");
          bar.id = "_exit8bar";
          bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#0d0d0d;border-top:2px solid #2ba2a2;padding:8px 16px;display:flex;align-items:center;gap:12px;font-family:var(--font-mono,monospace);font-size:14px;color:#ccc;";
          bar.innerHTML = `
            <span style="color:#2ba2a2;white-space:nowrap;">EXIT 8 &gt;</span>
            <input id="_exit8input" type="text" placeholder="type 'anomaly' when you see one..." autocomplete="off" style="flex:1;background:transparent;border:1px solid #333;border-radius:3px;padding:6px 10px;color:#eee;font-family:inherit;font-size:inherit;outline:none;" />
            <span id="_exit8score" style="color:#2ba2a2;white-space:nowrap;">[0/8]</span>
            <span style="color:#666;font-size:12px;white-space:nowrap;">'clear' = quit</span>
          `;
          document.body.appendChild(bar);
          exitBarRef.current = bar;

          const barInput = bar.querySelector("#_exit8input");
          barInput.focus();
          barInput.addEventListener("keydown", (e) => {
            if (e.key !== "Enter") return;
            const val = barInput.value.trim().toLowerCase();
            barInput.value = "";
            if (val === "clear" || val === "exit 0") { runCommand(val); return; }
            if (val === "anomaly") { runCommand("anomaly"); return; }
          });

          const updateScoreUI = () => {
            const scoreEl = document.getElementById("_exit8score");
            if (scoreEl) scoreEl.textContent = `[${st.score}/8]`;
            // Update hero text on live root and clone to show current level
            if (st.heroEl) st.heroEl.textContent = String(st.score);
            const ch = exitCloneRef.current?.querySelector("[id='hackerText']");
            if (ch) ch.textContent = String(st.score);
          };
          st.updateScoreUI = updateScoreUI;

          // ── Shared teardown (used by clear / exit 0 / win) ──────────────
          const teardown = () => {
            if (exitScrollRef.current) { cancelAnimationFrame(exitScrollRef.current); exitScrollRef.current = null; }
            if (st.anomalyTimer) { clearTimeout(st.anomalyTimer); st.anomalyTimer = null; }
            if (st.expireTimer)  { clearTimeout(st.expireTimer);  st.expireTimer  = null; }
            if (st.anomalyActive && st.removeEffect) { st.removeEffect(); }
            if (exitCloneRef.current) { try { document.body.removeChild(exitCloneRef.current); } catch (_) {} exitCloneRef.current = null; }
            if (exitBarRef.current)   { try { document.body.removeChild(exitBarRef.current);   } catch (_) {} exitBarRef.current = null; }
            // Restore hero text
            if (st.heroEl && st.heroOrig != null) st.heroEl.textContent = st.heroOrig;
            rootEl.style.filter = ""; rootEl.style.transform = ""; rootEl.style.fontFamily = ""; rootEl.style.animation = "";
            rootEl.style.height = "";
            document.body.style.height = "";
            document.documentElement.style.scrollBehavior = "";
            document.body.style.overflowX = "";
            Object.assign(st, { anomalyTimer: null, expireTimer: null, anomalyActive: false, removeEffect: null, score: 0, scheduleAnomaly: null, teardown: null, updateScoreUI: null, winGame: null, heroEl: null, heroOrig: null });
          };
          st.teardown = teardown;

          const winGame = () => {
            teardown();
            setLines((prev) => [
              ...prev,
              { text: ">> exit [8/8] — turned back.", type: "accent" },
              { text: ">> EXIT 8.", type: "accent" },
              { text: ">> you made it out. well played.", type: "info" },
            ]);
          };
          st.winGame = winGame;

          // ── Scroll loop: wrap by rootHeight for an invisible stitch ──────
          const step = () => {
            if (window.scrollY >= rootHeight) {
              window.scrollTo({ top: window.scrollY - rootHeight, behavior: "instant" });
            }
            window.scrollBy(0, 5);
            exitScrollRef.current = requestAnimationFrame(step);
          };
          exitScrollRef.current = requestAnimationFrame(step);

          // ── Anomaly scheduling ──────────────────────────────────────────
          const scheduleAnomaly = () => {
            // 30% chance of a "clean pass" — no anomaly this corridor.
            const noAnomaly = Math.random() < 0.3;
            const waitMs = noAnomaly ? (5000 + Math.random() * 4000) : (3500 + Math.random() * 4000);
            st.anomalyTimer = setTimeout(() => {
              if (noAnomaly) {
                // Survived a clean corridor with no false calls → advance.
                st.score += 1;
                updateScoreUI();
                window.scrollTo({ top: 0, behavior: "instant" });
                if (st.score >= 8) { winGame(); return; }
                setLines((l) => [...l, { text: `>> exit ${st.score} — no anomaly, clean pass. [${st.score}/8]`, type: "accent" }]);
                scheduleAnomaly();
                return;
              }
              const effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
              st.removeEffect = effect();
              st.anomalyActive = true;
              // Auto-expire in 5s → missed anomaly resets progress.
              st.expireTimer = setTimeout(() => {
                if (st.anomalyActive) {
                  st.removeEffect?.();
                  st.anomalyActive = false;
                  st.removeEffect  = null;
                  st.score = 0;
                  updateScoreUI();
                  setLines((l) => [...l, { text: ">> anomaly missed — reset to exit 0.", type: "danger" }]);
                  window.scrollTo({ top: 0, behavior: "instant" });
                  scheduleAnomaly();
                }
              }, 5000);
            }, waitMs);
          };
          st.scheduleAnomaly = scheduleAnomaly;
          scheduleAnomaly();

          captureScrollPos();
          setLines((prev) => [
            ...prev,
            exitEcho,
            { text: ">> corridor initiated. something is wrong in here.", type: "danger" },
            { text: ">> spot anomalies. type 'anomaly' in the bar below.", type: "output" },
            { text: ">> reach exit 8 to escape. false calls reset you.  // 'clear' to quit", type: "output" },
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

      // ── special: anomaly ────────────────────────────────────────────────
      if (cmd === "anomaly") {
        const st   = exitStateRef.current;
        const echo = { text: "> anomaly", type: "cmd" };
        captureScrollPos();
        if (!st.scheduleAnomaly) {
          setLines((prev) => [...prev, echo, { text: "anomaly: no corridor active. run 'exit 8' first.", type: "danger" }]);
          return;
        }
        if (!st.anomalyActive) {
          const hadProgress = st.score > 0;
          // Cancel the pending corridor timer so a queued clean-pass award
          // can't sneak in after a false call, then restart fresh.
          if (st.anomalyTimer) { clearTimeout(st.anomalyTimer); st.anomalyTimer = null; }
          if (hadProgress) st.score = 0;
          st.updateScoreUI?.();
          setLines((prev) => [...prev, echo, {
            text: hadProgress
              ? ">> no anomaly. you turned back for nothing — reset to exit 0."
              : ">> no anomaly here. keep walking.",
            type: hadProgress ? "danger" : "output",
          }]);
          // Turn back = snap to top
          window.scrollTo({ top: 0, behavior: "instant" });
          st.scheduleAnomaly?.();
          return;
        }
        // Correct detection — turn back (snap to top)
        if (st.expireTimer) { clearTimeout(st.expireTimer); st.expireTimer = null; }
        st.removeEffect?.();
        st.anomalyActive = false;
        st.removeEffect  = null;
        st.score += 1;
        st.updateScoreUI?.();
        window.scrollTo({ top: 0, behavior: "instant" });
        if (st.score >= 8) {
          // WIN — full cleanup via shared teardown
          st.winGame?.();
        } else {
          setLines((prev) => [...prev, echo, { text: `>> anomaly [${st.score}/8] — turned back. keep going.`, type: "accent" }]);
          st.scheduleAnomaly?.();
        }
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
  const CHIPS = ["help", "whoami", "skills", "interests", "games", "anime", "cycling", "rubik", "spotify", "ls", "sudo", "clear"];

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
