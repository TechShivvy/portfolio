import { useEffect, useRef, useState } from "react";
import styles from "./_KeyboardShortcuts.module.css";
import tenet from "../utils/tenet";

// ─── Site-wide keyboard shortcuts ────────────────────────────────────────────
// `?` or `Ctrl+/`  -> toggle this shortcuts panel (works anywhere on the site)
// `Ctrl+K` then... -> prefix chord for actionable commands (2s window)
//   s -> replay splash    m -> replay matrix    a -> replay all    q -> close tab

const PREFIX_TIMEOUT = 2000;

const replay = (opts) => {
  if (opts.splash) sessionStorage.removeItem("splashShown");
  if (opts.matrix) sessionStorage.removeItem("hasRun");
  sessionStorage.setItem("replayReload", "1");
  window.location.reload();
};

const ACTIONS = {
  s: { label: "replay splash", run: () => replay({ splash: true }) },
  m: { label: "replay matrix", run: () => replay({ matrix: true }) },
  a: { label: "replay all", run: () => replay({ splash: true, matrix: true }) },
  r: { label: "raw HTML", run: () => { window.location.href = "/portfolio/raw.html"; } },
  x: { label: "tenet", run: () => tenet() },
  q: { label: "suicide", run: () => window.location.replace("about:blank") },
};

// Rows rendered inside the panel. `section` entries render as headers.
const SHORTCUTS = [
  { section: "site" },
  { keys: ["?", "Ctrl+/"], desc: "show / hide this panel" },
  { section: "actions - Ctrl+K then..." },
  { keys: ["Ctrl+K", "s"], desc: "replay splash" },
  { keys: ["Ctrl+K", "m"], desc: "replay matrix" },
  { keys: ["Ctrl+K", "a"], desc: "replay all (splash + matrix)" },
  { keys: ["Ctrl+K", "r"], desc: "raw HTML portfolio (no CSS)" },
  { keys: ["Ctrl+K", "x"], desc: "tenet (reverse intro + close tab)" },
  { keys: ["Ctrl+K", "q"], desc: "suicide (closes the tab)" },
  { section: "terminal" },
  { keys: ["Enter"], desc: "run command" },
  { keys: ["\u2191", "\u2193"], desc: "command history" },
  { keys: ["Esc"], desc: "close terminal" },
  { section: "exit 8 (when active)" },
  { keys: ["Enter"], desc: "report anomaly" },
  { keys: ["Esc"], desc: "exit the loop" },
];

const isTyping = (el) =>
  el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable);

export default function KeyboardShortcuts() {
  const [showPanel, setShowPanel] = useState(false);
  const [prefixActive, setPrefixActive] = useState(false);
  const prefixRef = useRef(false);
  const timerRef = useRef(null);

  const cancelPrefix = () => {
    prefixRef.current = false;
    setPrefixActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      // ── Prefix chord: consume the next key ──
      if (prefixRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelPrefix();
          return;
        }
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          const action = ACTIONS[e.key.toLowerCase()];
          cancelPrefix();
          if (action) action.run();
          return;
        }
      }

      // ── Enter prefix mode on Ctrl+K ──
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        prefixRef.current = true;
        setPrefixActive(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(cancelPrefix, PREFIX_TIMEOUT);
        return;
      }

      // ── Toggle panel: Ctrl+/ (anywhere) or ? (when not typing) ──
      if (
        (e.ctrlKey && e.key === "/") ||
        (e.key === "?" && !isTyping(e.target))
      ) {
        e.preventDefault();
        setShowPanel((v) => !v);
        return;
      }

      if (e.key === "Escape" && showPanel) {
        setShowPanel(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showPanel]);

  return (
    <>
      {/* Chord indicator, bottom-left */}
      {prefixActive && (
        <div className={styles.chordIndicator} aria-live="polite">
          <span className={styles.chordDot} aria-hidden="true" />
          <kbd className={styles.chordKey}>Ctrl+K</kbd>
          <span>waiting for next key...</span>
        </div>
      )}

      {/* Shortcuts panel */}
      {showPanel && (
        <div
          className={styles.overlay}
          onClick={() => setShowPanel(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <span>keyboard shortcuts</span>
              <button
                className={styles.close}
                onClick={() => setShowPanel(false)}
                aria-label="Close shortcuts"
              >
                x
              </button>
            </div>
            <table className={styles.table}>
              <tbody>
                {SHORTCUTS.map((s, i) =>
                  s.section ? (
                    <tr key={i}>
                      <td colSpan={2} className={styles.section}>
                        {s.section}
                      </td>
                    </tr>
                  ) : (
                    <tr key={i}>
                      <td>
                        {s.keys.map((k, j) => (
                          <kbd key={j}>{k}</kbd>
                        ))}
                      </td>
                      <td>{s.desc}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            <p className={styles.hint}>
              open the terminal and type <kbd>help</kbd> for terminal commands ·
              press <kbd>Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
