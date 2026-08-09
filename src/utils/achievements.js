import ACHIEVEMENTS, { BY_ID, TOTAL } from "../content/achievements";

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
  return {
    unlocked,
    total: TOTAL,
    pct: TOTAL ? Math.round((unlocked / TOTAL) * 100) : 0,
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
  // -1: don't count completionist itself in "everything else"
  if (unlockedCount >= TOTAL - 1 && !ledger.completionist) {
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

export default unlock;
