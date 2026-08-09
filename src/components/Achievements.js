import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./_Achievements.module.css";
import ACHIEVEMENTS from "../content/achievements";
import {
  EVENT_UNLOCK,
  getProgress,
  getUnlocked,
  isUnlocked,
  playUnlockBlip,
  trackArrival,
} from "../utils/achievements";

const TOAST_MS = 4500;
const RARITY_ORDER = ["legendary", "rare", "common"];
const RARITY_LABEL = { legendary: "Legendary", rare: "Rare", common: "Common" };
const DRAG_THRESHOLD = 6; // px of movement before a pointer-down counts as a drag
const INTRO_FALLBACK_MS = 6000; // in case Home never mounts (e.g. the 404 page)
const BEACON_INTERVAL_MS = 10000;
const LS_DRAWER_SEEN = "sc.ach.drawerSeen";

let toastKeySeq = 0;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A single toast owns its own dismiss timer, started when IT mounts (i.e.
// when it actually becomes one of the visible top 3) - not a shared timer
// tied to the whole queue. That's what keeps its drain bar and its removal
// in sync regardless of how many other toasts are stacked around it:
// previously every new toast arriving reset a single shared "remove the
// oldest" timer, so a toast already most of the way through its own CSS
// drain animation could sit fully-drained-but-still-visible for a while, or
// get yanked away out of sync with its bar.
function AchievementToast({ entry, sfClassName, onDismiss }) {
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
    playUnlockBlip();
    const id = setTimeout(() => onDismissRef.current(), TOAST_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${styles.toast} ${styles[entry.rarity] || ""} ${sfClassName}`}
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
  const [introRevealed, setIntroRevealed] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [beaconing, setBeaconing] = useState(false);
  const [sfSide, setSfSide] = useState(null); // null | "tech" | "fairy"
  const [dragOffset, setDragOffset] = useState(null); // px, null = not dragging
  const [dragging, setDragging] = useState(false);

  const drawerRef = useRef(null);
  const pocketRef = useRef(null);
  const toastStackRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);
  const drawerEverOpenedRef = useRef(false);

  // ─── Reveal only once the hero intro has actually finished ───────────────
  // Delays trackArrival() (and so the first toast + the pocket's count) until
  // the scramble has settled and matrix is flowing, matching the intro's own
  // pacing instead of popping up mid-splash. Falls back on a timer in case
  // Home never mounts (the 404 route) or the event is otherwise missed.
  useEffect(() => {
    let cleanupArrival;
    let fallbackId;

    const reveal = () => {
      if (cleanupArrival) return; // already revealed
      cleanupArrival = trackArrival();
      setProgress(getProgress());
      setIntroRevealed(true);
      clearTimeout(fallbackId);
    };

    if (window.__heroIntroDone) {
      reveal();
    } else {
      window.addEventListener("hero:intro-done", reveal, { once: true });
      fallbackId = setTimeout(reveal, INTRO_FALLBACK_MS);
    }

    const onUnlock = (e) => {
      const entry = e.detail;
      setProgress(getProgress());
      setToasts((prev) => [...prev, { ...entry, key: `t${toastKeySeq++}` }]);
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1900);
    };

    window.addEventListener(EVENT_UNLOCK, onUnlock);
    return () => {
      window.removeEventListener("hero:intro-done", reveal);
      window.removeEventListener(EVENT_UNLOCK, onUnlock);
      clearTimeout(fallbackId);
      cleanupArrival?.();
    };
  }, []);

  // Cap how many render at once so a burst of unlocks (e.g. Ctrl+K chords
  // fired back to back) queues cleanly; each visible toast dismisses itself
  // independently (see AchievementToast above).
  const visibleToasts = toasts.slice(0, 3);

  const dismissToast = useCallback((key) => {
    setToasts((prev) => prev.filter((t) => t.key !== key));
  }, []);

  // ─── Hide the pocket while Exit 8 or Split Fiction own the viewport, and
  // re-theme in-flight toasts to whichever side of the Split Fiction seam
  // they currently sit on ───────────────────────────────────────────────────
  // Both eggs are hand-rolled DOM/canvas takeovers with no lifecycle event bus
  // of their own - Exit 8 flags window.__exit8Active, Split Fiction toggles
  // the _sfActive body class and exposes window.__sfIsRightAt(x, y). A light
  // poll is simpler and safer here than adding new event plumbing to either
  // of those large, delicate files, and it's the only way to track spin
  // mode's rotating seam, which has no discrete "side changed" event at all.
  useEffect(() => {
    const check = () => {
      const sfActive = document.body.classList.contains("_sfActive");
      const active = !!window.__exit8Active || sfActive;
      setHiddenByOverlay((prev) => (prev !== active ? active : prev));

      if (sfActive && typeof window.__sfIsRightAt === "function") {
        const rect = toastStackRef.current?.getBoundingClientRect();
        const x = rect ? (rect.left + rect.right) / 2 : window.innerWidth - 20;
        const y = rect ? (rect.top + rect.bottom) / 2 : 30;
        const side = window.__sfIsRightAt(x, y) ? "fairy" : "tech";
        setSfSide((prev) => (prev !== side ? side : prev));
      } else {
        setSfSide((prev) => (prev !== null ? null : prev));
      }
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
    drawerEverOpenedRef.current = true;
    try {
      localStorage.setItem(LS_DRAWER_SEEN, "1");
    } catch {
      // ignore - worst case the beacon nudges a little longer than intended
    }

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

  // ─── Periodic discovery nudge ─────────────────────────────────────────────
  // A 3-beat pulse every ~10s so a first-time visitor notices the tab is
  // interactive, without nagging forever - stops for good the first time the
  // drawer is actually opened (persisted, so it doesn't return on a later
  // visit either). drawerOpen/hiddenByOverlay are read via refs rather than
  // effect dependencies so the interval itself is created exactly once, on a
  // genuine unbroken ~10s cadence, instead of restarting (and re-phasing)
  // every time either of those flags flips.
  const drawerOpenRef = useRef(drawerOpen);
  const hiddenByOverlayRef = useRef(hiddenByOverlay);
  useEffect(() => {
    drawerOpenRef.current = drawerOpen;
    hiddenByOverlayRef.current = hiddenByOverlay;
  });

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_DRAWER_SEEN) === "1") drawerEverOpenedRef.current = true;
    } catch {
      // ignore
    }
    if (!introRevealed) return;

    const id = setInterval(() => {
      if (drawerEverOpenedRef.current || drawerOpenRef.current || hiddenByOverlayRef.current) return;
      if (prefersReducedMotion()) return;
      setBeaconing(true);
      setTimeout(() => setBeaconing(false), 1900);
    }, BEACON_INTERVAL_MS);
    return () => clearInterval(id);
  }, [introRevealed]);

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

  const sfClassName =
    sfSide === "tech" ? styles.sfTech : sfSide === "fairy" ? styles.sfFairy : "";
  const pocketHidden = hiddenByOverlay || !introRevealed;

  return (
    <>
      {/* Toast stack */}
      <div
        ref={toastStackRef}
        className={`${styles.toastStack} ${drawerOpen ? styles.shiftedForDrawer : ""}`}
        aria-live="polite"
      >
        {visibleToasts.map((t) => (
          <AchievementToast
            key={t.key}
            entry={t}
            sfClassName={sfClassName}
            onDismiss={() => dismissToast(t.key)}
          />
        ))}
      </div>

      {/* Pocket tab */}
      <button
        ref={pocketRef}
        type="button"
        className={`${styles.pocket} ${drawerOpen ? styles.pocketOpen : ""} ${
          pocketHidden ? styles.pocketHidden : ""
        } ${pulsing ? styles.pocketPulse : ""} ${beaconing ? styles.pocketBeacon : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handlePocketClick}
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        aria-label={`Achievements: ${progress.unlocked} of ${progress.total} unlocked`}
      >
        <svg
          className={styles.pocketIcon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="#ffd700"
        >
          <path d="M6 3h12v2h2.5a1 1 0 0 1 1 1v1.5A4.5 4.5 0 0 1 17 11.9c-.6 1.9-2.1 3.3-4 3.8V18h2.5a1 1 0 0 1 1 1v1H7.5v-1a1 1 0 0 1 1-1H11v-2.3c-1.9-.5-3.4-1.9-4-3.8A4.5 4.5 0 0 1 2.5 7.5V6a1 1 0 0 1 1-1H6V3Zm0 4H4v.5A2.5 2.5 0 0 0 6.2 9.9 8.8 8.8 0 0 1 6 8V7Zm12 0v1c0 .6-.1 1.3-.2 1.9A2.5 2.5 0 0 0 20 7.5V7h-2Z" />
        </svg>
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
