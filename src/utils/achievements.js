import ACHIEVEMENTS, { BY_ID, TOTAL, TOTAL_TOUCH } from "../content/achievements";

// True for touch/no-keyboard devices (phones, tablets) - hybrid touchscreen
// laptops still report pointer:fine (mouse/trackpad present) so they're
// correctly treated as desktop here. Used to hide desktopOnly achievements
// (konami code, the keyboard shortcuts panel) that have no touch equivalent.
export function isTouchDevice() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

// ─── Achievements engine ─────────────────────────────────────────────────────
// Every unlock is written to localStorage and is permanent - it survives
// closing the tab, closing the browser, and reopening days later. It's only
// lost if the visitor clears site data or uses a fresh private window.
//
// sessionStorage is used for exactly one thing: detecting that a *new*
// browser session has started, which `back-again` needs. It is never the
// system of record - see LS_VISITS / SS_SESSION below.
//
// All storage access is wrapped in try/catch: Safari private mode throws on
// write, and an uncaught exception inside e.g. splitFiction's animation loop
// would break the easter egg calling unlock(), not just the achievement.

const LS_LEDGER = "sc.achievements";     // { [id]: { at: <ISO timestamp> } }
const LS_COUNTERS = "sc.ach.counters";   // { [id]: n }
const LS_SEEN_PREFIX = "sc.ach.seen.";   // sc.ach.seen.<id> -> string[] of distinct values seen
const LS_VISITS = "sc.ach.visits";       // number of distinct browser sessions
const SS_SESSION = "sc.ach.session";     // presence marker for this session only

export const EVENT_UNLOCK = "achievement:unlock";

const inFlight = new Set(); // guards against double-unlock races in one frame

function readJSON(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(store, key, value) {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota, etc) - fail silently
  }
}

function getLedger() {
  return readJSON(window.localStorage, LS_LEDGER, {});
}

function getCounters() {
  return readJSON(window.localStorage, LS_COUNTERS, {});
}

export function isUnlocked(id) {
  return !!getLedger()[id];
}

export function getUnlocked() {
  const ledger = getLedger();
  return ACHIEVEMENTS.filter((a) => ledger[a.id]).map((a) => ({
    ...a,
    at: ledger[a.id].at,
  }));
}

export function getProgress() {
  const unlocked = Object.keys(getLedger()).length;
  const total = isTouchDevice() ? TOTAL_TOUCH : TOTAL;
  return {
    unlocked,
    total,
    pct: total ? Math.round((unlocked / total) * 100) : 0,
  };
}

/**
 * Unlock an achievement by id. Synchronous, safe to call right before
 * location.replace() (tenet / suicide) - localStorage.setItem commits before
 * navigation runs, no beforeunload or sendBeacon needed. No-op if the id is
 * unknown, already unlocked, or already mid-unlock this tick.
 */
export function unlock(id) {
  if (!BY_ID[id] || inFlight.has(id)) return;

  const ledger = getLedger();
  if (ledger[id]) return;

  inFlight.add(id);
  ledger[id] = { at: new Date().toISOString() };
  writeJSON(window.localStorage, LS_LEDGER, ledger);
  inFlight.delete(id);

  window.dispatchEvent(
    new CustomEvent(EVENT_UNLOCK, { detail: { ...BY_ID[id], id, at: ledger[id].at } })
  );

  maybeUnlockCompletionist();
}

/**
 * Increment a persisted counter and unlock `id` once it reaches `target`.
 * Progress accumulates across sessions - e.g. 20 laser bolts today plus 30
 * tomorrow still unlocks trigger-happy, it's never silently reset.
 */
export function bump(id, target, by = 1) {
  if (isUnlocked(id)) return;

  const counters = getCounters();
  const next = (counters[id] || 0) + by;
  counters[id] = next;
  writeJSON(window.localStorage, LS_COUNTERS, counters);

  if (next >= target) unlock(id);
}

/**
 * Like bump(), but counts *distinct* values instead of raw calls - e.g.
 * archaeologist needs 3 different files read, not the same file read 3 times.
 * The seen-set persists across sessions, same as everything else here.
 */
export function bumpDistinct(id, target, value) {
  if (isUnlocked(id)) return;

  const key = LS_SEEN_PREFIX + id;
  const seen = readJSON(window.localStorage, key, []);
  if (!seen.includes(value)) {
    seen.push(value);
    writeJSON(window.localStorage, key, seen);
  }
  if (seen.length >= target) unlock(id);
}

function maybeUnlockCompletionist() {
  const ledger = getLedger();
  const unlockedCount = Object.keys(ledger).length;
  const total = isTouchDevice() ? TOTAL_TOUCH : TOTAL;
  // -1: don't count completionist itself in "everything else"
  if (unlockedCount >= total - 1 && !ledger.completionist) {
    // Queue so it always lands as its own, later toast rather than racing
    // the achievement that just triggered it.
    setTimeout(() => unlock("completionist"), 50);
  }
}

/**
 * Call once, near app start. Handles the passive/arrival achievements:
 * first-contact, night-owl, back-again. Cheap and idempotent.
 */
export function trackArrival() {
  unlock("first-contact");

  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) unlock("night-owl");

  let isNewSession = true;
  try {
    isNewSession = !window.sessionStorage.getItem(SS_SESSION);
    window.sessionStorage.setItem(SS_SESSION, "1");
  } catch {
    isNewSession = false; // can't tell - don't award on uncertainty
  }

  if (isNewSession) {
    const visits = readJSON(window.localStorage, LS_VISITS, 0);
    const nextVisits = (typeof visits === "number" ? visits : 0) + 1;
    writeJSON(window.localStorage, LS_VISITS, nextVisits);
    if (nextVisits >= 2) unlock("back-again");
  }

  const timer = setTimeout(() => unlock("stuck-around"), 2 * 60 * 1000);
  return () => clearTimeout(timer);
}

// Small tech blip played when an achievement toast actually becomes visible
// (see AchievementToast in Achievements.js - not at unlock time, so it
// doesn't fire for something the visitor can't yet see if 4+ land at once).
// Two quick rising notes, ~150ms total.
//
// One AudioContext is created lazily and reused for every blip, rather than
// a fresh one per call - browsers cap the number of live contexts per
// document (~6 in Chrome), so a fresh-context-per-blip approach goes silent
// after a handful of unlocks in one session.
//
// A new AudioContext starts "suspended" until a real user gesture resumes
// it - which the four passive arrival achievements (first-contact, night-owl,
// back-again, stuck-around) and any hover-triggered unlock can beat to the
// punch, since neither page load nor hover/scroll counts as user activation.
// Rather than silently dropping those, the request is remembered and replayed
// on the visitor's first pointerdown/keydown/touchstart, whenever that turns
// out to be - deliberately no expiry window. The splash alone holds the page
// for 2.4s+ before anything is even clickable, so a short timeout would lapse
// before a real visitor gets a chance to interact, which is exactly the
// "first contact never actually beeps" bug this replaces.
//
// KNOWN LIMITATION, not fixable from here: every major browser refuses to
// let ANY site play audio before the page has received a real click, key
// press, or touch - there is no API to lift this early. So first-contact
// (and any other achievement that unlocks before the visitor's first
// interaction) will always show its toast silently and only catch up with a
// beep once that first interaction happens, however long that takes. This is
// the best behavior achievable within that constraint: exactly one beep, on
// the actual first gesture, fired synchronously inside that gesture's own
// event handler (not deferred to a resume().then() callback, which some
// browsers no longer attribute to the gesture by the time it runs).
let sharedCtx = null;
let pendingBlip = false;
let gestureListenersInstalled = false;
let blipRafScheduled = false;

function fireBlip(ctx) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (_) {
    // ignore - a silent unlock is fine, a broken one isn't
  }
}

function installGestureListeners() {
  if (gestureListenersInstalled) return;
  gestureListenersInstalled = true;

  const onGesture = () => {
    gestureListenersInstalled = false;
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("keydown", onGesture, true);
    window.removeEventListener("touchstart", onGesture, true);

    if (!sharedCtx) return;
    // Fire the owed blip in this SAME synchronous tick as the trusted
    // gesture, rather than waiting on the resume() Promise first. Browsers
    // unlock a Web Audio context the moment a node's start() is called from
    // within a real gesture's call stack; deferring start() to a
    // resume().then() callback pushes it into a later microtask that isn't
    // reliably still attributed to the gesture. resume() itself is fired and
    // forgotten - not awaited - since it isn't needed before start() for the
    // unlock to register.
    sharedCtx.resume().catch(() => {});
    if (pendingBlip) fireBlip(sharedCtx);
    pendingBlip = false;
  };

  window.addEventListener("pointerdown", onGesture, { capture: true, once: true, passive: true });
  window.addEventListener("keydown", onGesture, { capture: true, once: true });
  window.addEventListener("touchstart", onGesture, { capture: true, once: true, passive: true });
}

function requestBlip() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedCtx) sharedCtx = new AudioCtx();

    if (sharedCtx.state === "suspended") {
      pendingBlip = true;
      installGestureListeners();
      return;
    }

    fireBlip(sharedCtx);
  } catch (_) {
    // ignore - a silent unlock is fine, a broken one isn't
  }
}

// If several achievements unlock together (e.g. first-contact + back-again
// on a second visit), each toast mounts in the same commit and would each
// call this - collapse them into a single beep by batching requests into the
// next animation frame instead of firing one per call. Achievements queued
// deliberately later (completionist, +50ms - see maybeUnlockCompletionist)
// land in a later frame and still get their own beep.
export function playUnlockBlip() {
  if (blipRafScheduled) return;
  blipRafScheduled = true;
  requestAnimationFrame(() => {
    blipRafScheduled = false;
    requestBlip();
  });
}

export default unlock;
