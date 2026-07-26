import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./_About.module.css";
import INTERESTS from "../content/interests";
import ABOUT from "../content/about";
import TIMELINE from "../content/timeline";
import tenet from "../utils/tenet";
import startExit8 from "../utils/exit8";

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
      { text: "  spotify --now-playing - what i'm grooving to right now", type: "output" },
      { text: "  timeline            - jump to timeline section", type: "output" },
      { text: "  projects            - jump to projects section", type: "output" },
      { text: "  portfolio --no-css  - brutalist HTML version (1997 edition)  [Ctrl+K r]", type: "output" },
      { text: "  matrix [sub]        - matrix rain controls (matrix -h for sub-commands)", type: "output" },
      { text: "  replay [sub]        - replay intro sequences (replay -h for sub-commands)  [Ctrl+K s/m/a]", type: "output" },
      { text: "  clear               - clear terminal", type: "output" },
      { text: "  history             - command history", type: "output" },
      { text: "  sudo                - try it ;)", type: "output" },
      { text: "  exit 8              - the loop. spot 8 anomalies.", type: "output" },
      { text: "  tenet               - play the whole intro in reverse, then power off.  [Ctrl+K x]", type: "output" },
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
      const lines = [];
      TIMELINE.forEach((entry, idx) => {
        const tagStr = entry.tag ? `  (${entry.tag})` : "";
        lines.push({ text: `commit ${entry.hash}${tagStr}`, type: "accent" });
        lines.push({ text: `Date:   ${entry.date}`, type: "output" });
        lines.push({ text: `    ${entry.message}`, type: "output" });
        if (idx < TIMELINE.length - 1) lines.push({ text: "", type: "output" });
      });
      return lines;
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

    tenet: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "tenet - plays the whole intro in reverse, then closes the tab. what's happened, happened. no coming back.", type: "info" }];
      setTimeout(() => tenet(), 500);
      return [
        { text: ">> inverting the turnstile...", type: "danger" },
        { text: "what's happened, happened. hold on to something.", type: "output" },
      ];
    },

    "67": () => {
      if (document.body.classList.contains("sixseven")) {
        document.body.classList.remove("sixseven");
        return [{ text: ">> 67 off.", type: "info" }];
      }
      document.body.classList.add("sixseven");
      setTimeout(() => document.body.classList.remove("sixseven"), 4200);
      return [
        { text: ">> 67.", type: "danger" },
        { text: "ride or die.", type: "output" },
      ];
    },

    spotify: (args) => {
      if (args[0] === "-h" || args[0] === "--help")
        return [{ text: "spotify --now-playing - what i'm grooving to right now", type: "info" }];
      return [
        { text: ">> loading now playing...", type: "info" },
        { text: "look at the card to your side or scroll below → hover / click to reveal what i'm grooving to", type: "output" },
      ];
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
  const exit8GameRef  = useRef(null); // game instance returned from startExit8()
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
        const wasInGame = !!exit8GameRef.current;
        exit8GameRef.current?.teardown();
        exit8GameRef.current = null;
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
          const wasInGame = !!exit8GameRef.current;
          exit8GameRef.current?.teardown();
          exit8GameRef.current = null;
          if (wasInGame) window.scrollTo({ top: 0, behavior: "instant" });
          isCommandScroll.current = false;
          cmdScrollPos.current = null;
          setLines([]);
          if (outputRef.current) outputRef.current.scrollTop = 0;
          return;
        }
        if (args[0] === "8") {
          // Exit 8: seamless corridor loop + anomaly detection game
          captureScrollPos();
          const gameInstance = startExit8({
            setLines,
            inputRef,
            rootEl: document.getElementById("root"),
            onQuit: () => {},
          });
          exit8GameRef.current = gameInstance;
          setLines((prev) => [
            ...prev,
            exitEcho,
            { text: ">> corridor initiated. something is wrong in here.", type: "danger" },
            { text: ">> spot anomalies. press ENTER or tap [!] to call them.", type: "output" },
            { text: ">> reach exit 8. ESC or EXIT to quit.  // false calls reset you.", type: "output" },
          ]);
          return;
        }
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

  // ── External trigger: let global keybindings run a real terminal command ──
  // Dispatch `new CustomEvent("terminal:run", { detail: "exit 8" })` from
  // anywhere to invoke the actual command path (same as typing + Enter).
  useEffect(() => {
    const onRun = (e) => runCommand(e.detail);
    window.addEventListener("terminal:run", onRun);
    return () => window.removeEventListener("terminal:run", onRun);
  }, [runCommand]);

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
  const CHIPS = ["help", "ls", "whoami", "cat skills.txt", "cat contact.txt", "git log", "spotify --now-playing", "timeline", "projects", "matrix", "replay", "sudo", "exit 8", "tenet", "clear"];

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
