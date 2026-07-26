import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./_About.module.css";
import tenet from "../utils/tenet";
import startExit8 from "../utils/exit8";
import buildCommands from "../utils/terminalCommands";
import buildVirtualFiles from "../utils/virtualFiles";
import renderText from "../utils/renderText";
import { BOOT_LINES } from "../content/bootLines";
import { CHIPS } from "../content/terminalChips";
import sleep from "../utils/sleep";


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
  const exit8GameRef  = useRef(null); // game instance returned from startExit8()
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
