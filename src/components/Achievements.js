import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./_Achievements.module.css";
import ACHIEVEMENTS from "../content/achievements";
import {
  EVENT_UNLOCK,
  getProgress,
  getUnlocked,
  isUnlocked,
  trackArrival,
} from "../utils/achievements";

const TOAST_MS = 4500;
const RARITY_ORDER = ["legendary", "rare", "common"];
const RARITY_LABEL = { legendary: "Legendary", rare: "Rare", common: "Common" };
const DRAG_THRESHOLD = 6; // px of movement before a pointer-down counts as a drag

let toastKeySeq = 0;

// A single toast owns its own dismiss timer, started when IT mounts (i.e.
// when it actually becomes one of the visible top 3) - not a shared timer
// tied to the whole queue. That's what keeps its drain bar and its removal
// in sync regardless of how many other toasts are stacked around it:
// previously every new toast arriving reset a single shared "remove the
// oldest" timer, so a toast already most of the way through its own CSS
// drain animation could sit fully-drained-but-still-visible for a while, or
// get yanked away out of sync with its bar.
function AchievementToast({ entry, onDismiss }) {
  // onDismiss is a fresh closure from the parent's map() on every render (it
  // captures this toast's key), so it can't be a dependency of the mount
  // effect below without re-triggering that effect on every unrelated parent
  // re-render (e.g. a sibling toast arriving) - which is the exact bug this
  // component exists to avoid. A ref holds the latest closure without being
  // a dependency, so the timer really does start once, at mount, and only then.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const id = setTimeout(() => onDismissRef.current(), TOAST_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${styles.toast} ${styles[entry.rarity] || ""}`}
      onClick={onDismiss}
      role="status"
    >
      <div className={styles.toastLabel}>&#9656; Achievement Unlocked</div>
      <div className={styles.toastName}>{entry.name}</div>
      <div className={styles.toastDesc}>{entry.desc}</div>
      <div className={styles.toastBar} />
    </div>
  );
}

export default function Achievements() {
  const [toasts, setToasts] = useState([]);
  const [progress, setProgress] = useState(() => getProgress());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [dragOffset, setDragOffset] = useState(null); // px, null = not dragging
  const [dragging, setDragging] = useState(false);

  const drawerRef = useRef(null);
  const pocketRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);

  // ─── Arrival tracking + unlock listener ──────────────────────────────────
  useEffect(() => {
    const cleanupArrival = trackArrival();
    setProgress(getProgress());

    const onUnlock = (e) => {
      const entry = e.detail;
      setProgress(getProgress());
      setToasts((prev) => [...prev, { ...entry, key: `t${toastKeySeq++}` }]);
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1900);
    };

    window.addEventListener(EVENT_UNLOCK, onUnlock);
    return () => {
      window.removeEventListener(EVENT_UNLOCK, onUnlock);
      cleanupArrival();
    };
  }, []);

  // Cap how many render at once so a burst of unlocks (e.g. Ctrl+K chords
  // fired back to back) queues cleanly; each visible toast dismisses itself
  // independently (see AchievementToast above).
  const visibleToasts = toasts.slice(0, 3);

  const dismissToast = useCallback((key) => {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }, []);

  // ─── Hide the pocket while Exit 8 or Split Fiction own the viewport ──────
  // Both are hand-rolled DOM/canvas takeovers with no lifecycle event bus of
  // their own - Exit 8 flags window.__exit8Active, Split Fiction toggles the
  // _sfActive body class. A light poll is simpler and safer here than adding
  // new event plumbing to either of those large, delicate files.
  useEffect(() => {
    const check = () => {
      const active =
        !!window.__exit8Active ||
        document.body.classList.contains("_sfActive");
      setHiddenByOverlay((prev) => (prev !== active ? active : prev));
    };
    check();
    const id = setInterval(check, 400);
    return () => clearInterval(id);
  }, []);

  // ─── Open/close the drawer ────────────────────────────────────────────────
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    const onToggle = () => setDrawerOpen((v) => !v);
    window.addEventListener("achievements:toggle", onToggle);
    return () => window.removeEventListener("achievements:toggle", onToggle);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeDrawer();
        pocketRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    drawerRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  // ─── Drag-to-open on the pocket tab ───────────────────────────────────────
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragStateRef.current = {
      startX: e.clientX,
      startTime: Date.now(),
      startedOpen: drawerOpen,
      width: drawerRef.current
        ? drawerRef.current.getBoundingClientRect().width
        : 340,
      moved: false,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const st = dragStateRef.current;
    if (!st) return;
    const delta = e.clientX - st.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) st.moved = true;

    // offset: 0 = fully open, width = fully closed.
    const base = st.startedOpen ? 0 : st.width;
    const offset = Math.min(st.width, Math.max(0, base + delta));
    setDragOffset(offset);
  };

  const handlePointerUp = () => {
    const st = dragStateRef.current;
    if (!st) return;

    if (!st.moved) {
      // Plain tap/click - let the onClick handler do the toggling.
      dragStateRef.current = null;
      setDragging(false);
      setDragOffset(null);
      return;
    }

    const elapsed = Math.max(1, Date.now() - st.startTime);
    const finalOffset = dragOffset == null ? (st.startedOpen ? 0 : st.width) : dragOffset;
    const velocity = (finalOffset - (st.startedOpen ? 0 : st.width)) / elapsed; // px/ms, sign = direction

    let shouldOpen;
    if (Math.abs(velocity) > 0.5) {
      shouldOpen = velocity < 0; // moving toward 0 (open) fast = flick open
    } else {
      shouldOpen = finalOffset < st.width / 2;
    }

    suppressClickRef.current = true;
    setDrawerOpen(shouldOpen);
    setDragging(false);
    setDragOffset(null);
    dragStateRef.current = null;
  };

  const handlePocketClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setDrawerOpen((v) => !v);
  };

  // ─── Drawer content ────────────────────────────────────────────────────────
  const unlockedList = getUnlocked();
  const unlockedById = unlockedList.reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {});

  const grouped = RARITY_ORDER.map((rarity) => ({
    rarity,
    items: ACHIEVEMENTS.filter((a) => a.rarity === rarity),
  }));

  const dateFmt = (iso) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const progressBar = (() => {
    const width = 16;
    const filled = progress.total
      ? Math.round((progress.unlocked / progress.total) * width)
      : 0;
    return "█".repeat(filled) + "░".repeat(width - filled);
  })();

  let drawerStyle;
  if (dragOffset != null) {
    drawerStyle = { transform: `translateX(${dragOffset}px)` };
  }

  return (
    <>
      {/* Toast stack */}
      <div
        className={`${styles.toastStack} ${drawerOpen ? styles.shiftedForDrawer : ""}`}
        aria-live="polite"
      >
        {visibleToasts.map((t) => (
          <AchievementToast
            key={t.key}
            entry={t}
            onDismiss={() => dismissToast(t.key)}
          />
        ))}
      </div>

      {/* Pocket tab */}
      <button
        ref={pocketRef}
        type="button"
        className={`${styles.pocket} ${drawerOpen ? styles.pocketOpen : ""} ${
          hiddenByOverlay ? styles.pocketHidden : ""
        } ${pulsing ? styles.pocketPulse : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handlePocketClick}
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        aria-label={`Achievements: ${progress.unlocked} of ${progress.total} unlocked`}
      >
        <span className={styles.pocketIcon} aria-hidden="true">&#127942;</span>
        <span className={styles.pocketCount}>
          {progress.unlocked}/{progress.total}
        </span>
      </button>

      {/* Drawer */}
      {drawerOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={closeDrawer}
          role="presentation"
        />
      )}
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""} ${
          dragging ? styles.dragging : ""
        }`}
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Achievements"
        tabIndex={-1}
        inert={drawerOpen ? undefined : ""}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <span>achievements</span>
            <button
              className={styles.drawerClose}
              onClick={closeDrawer}
              aria-label="Close achievements"
            >
              x
            </button>
          </div>
          <div className={styles.progressLine}>
            [{progressBar}] <b>{progress.unlocked}</b>/{progress.total} &middot;{" "}
            {progress.pct}%
          </div>
        </div>
        <div className={styles.drawerBody}>
          {grouped.map(
            ({ rarity, items }) =>
              items.length > 0 && (
                <div className={styles.rarityGroup} key={rarity}>
                  <div className={`${styles.rarityHeading} ${styles[rarity]}`}>
                    {RARITY_LABEL[rarity]} ({items.length})
                  </div>
                  {items.map((a) => {
                    const unlocked = isUnlocked(a.id);
                    const entry = unlockedById[a.id];
                    return (
                      <div
                        key={a.id}
                        className={`${styles.row} ${
                          unlocked ? `${styles.unlocked} ${styles[rarity]}` : styles.locked
                        }`}
                      >
                        <span className={styles.rowIcon} aria-hidden="true">
                          {unlocked ? "✓" : "●"}
                        </span>
                        <div className={styles.rowMain}>
                          <div className={styles.rowName}>{a.name}</div>
                          <div className={styles.rowDesc}>
                            {unlocked ? a.desc : a.secret ? "???" : a.hint}
                          </div>
                        </div>
                        {unlocked && entry?.at && (
                          <div className={styles.rowDate}>{dateFmt(entry.at)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>
    </>
  );
}
