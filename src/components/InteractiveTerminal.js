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
          { text: val > 0 ? "   (takes effect immediately on the running canvas)" : "", type: "output" },
        ].filter((l) => l.text);
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

    sudo: () => [
      { text: "[sudo] password for shivi:", type: "output" },
      { text: "Sorry, try again.", type: "danger" },
      { text: "sudo: 3 incorrect password attempts", type: "danger" },
    ],

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
        isCommandScroll.current = false;
        cmdScrollPos.current = null;
        setLines([]);
        if (outputRef.current) outputRef.current.scrollTop = 0;
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
              line.text
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
