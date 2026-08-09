/**
 * Achievement registry - single source of truth.
 *
 * Every entry MUST be reliably trackable. If we can't prove the visitor did
 * the thing, it doesn't belong here. Notably absent: any "you opened devtools"
 * achievement - devtools detection is unreliable (outerWidth heuristics break
 * with docked panels and zoom, console getter traps fire on any inspection),
 * and even a perfect detector can't tell reading the source banner apart from
 * inspecting a button. That one is earned via SECRET_CODE below instead.
 *
 * Fields:
 *   id      - stable key, persisted to localStorage. Never rename.
 *   name    - shown in the toast and the drawer.
 *   desc    - shown once unlocked.
 *   hint    - shown while locked. Vague enough to intrigue, specific enough to guide.
 *   rarity  - "common" | "rare" | "legendary". Drives colour and drawer grouping.
 *   secret  - hide the hint (renders "???"). The name still shows. Reserve for a few.
 *   desktopOnly - true if there's no touch/no-keyboard equivalent trigger.
 *               Hidden from the drawer and excluded from the progress total
 *               on touch devices (see isTouchDevice() in utils/achievements.js).
 *               Reserve for triggers with genuinely no alternate input path -
 *               most terminal-command achievements are NOT desktopOnly since
 *               the terminal works fine via the on-screen keyboard + mobile
 *               chip buttons (src/content/terminalChips.js).
 */

// Spoken by the HTML source banner and the console greeting (see src/index.js).
// Typing `unlock <SECRET_CODE>` in the terminal is the only way to earn
// source-diver - that makes it provable rather than guessed at via devtools
// heuristics. Keep the banner and the terminal command in sync with this.
export const SECRET_CODE = "semicolon";

const ACHIEVEMENTS = [
  // ─── passive / arrival ─────────────────────────────────────────────────────
  // These fire before the visitor knows the system exists. That's the point:
  // they're how the visitor discovers there IS a system.
  {
    id: "first-contact",
    name: "first contact",
    desc: "showed up. that's a start.",
    hint: "you already have this one.",
    rarity: "common",
  },
  {
    id: "night-owl",
    name: "night owl",
    desc: "visited between midnight and 6am. go to sleep.",
    hint: "some hours are quieter than others.",
    rarity: "rare",
  },
  {
    id: "back-again",
    name: "back again",
    desc: "came back a second time. flattering.",
    hint: "leave. then don't stay gone.",
    rarity: "common",
  },
  {
    id: "stuck-around",
    name: "stuck around",
    desc: "spent two whole minutes here.",
    hint: "patience is technically a skill.",
    rarity: "common",
  },

  // ─── discovery ─────────────────────────────────────────────────────────────
  {
    id: "rtfm",
    name: "rtfm",
    desc: "found the keyboard shortcuts panel.",
    hint: "one key opens every door. it's punctuation.",
    rarity: "common",
    desktopOnly: true, // opened via `?`/Ctrl+/ only, no tap entry point exists
  },
  {
    id: "shell-access",
    name: "shell access",
    desc: "opened the interactive terminal.",
    hint: "that fake terminal isn't entirely fake.",
    rarity: "common",
  },
  {
    id: "source-diver",
    name: "source diver",
    desc: "read the source and came back with the word.",
    hint: "i left something written where only snoopers look.",
    rarity: "rare",
  },

  // ─── terminal ──────────────────────────────────────────────────────────────
  {
    id: "helped",
    name: "helped",
    desc: "asked for help. wise.",
    hint: "the shell will tell you what it can do, if asked.",
    rarity: "common",
  },
  {
    id: "snooper",
    name: "snooper",
    desc: "listed the files.",
    hint: "see what's lying around.",
    rarity: "common",
  },
  {
    id: "permission-denied",
    name: "permission denied",
    desc: "tried to read .secrets. nice try.",
    hint: "one file in that listing won't open.",
    rarity: "rare",
  },
  {
    id: "nice-try",
    name: "nice try",
    desc: "attempted sudo. you are not in the sudoers file.",
    hint: "try doing something with elevated confidence.",
    rarity: "common",
  },
  {
    id: "archaeologist",
    name: "archaeologist",
    desc: "read three different files.",
    hint: "keep digging through what's lying around.",
    rarity: "rare",
  },

  // ─── easter eggs ───────────────────────────────────────────────────────────
  {
    id: "person-of-culture",
    name: "person of culture",
    desc: "entered the konami code.",
    hint: "up up down down. you know the rest.",
    rarity: "rare",
    desktopOnly: true, // arrow-key sequence, no touch equivalent exists
  },
  {
    id: "time-traveller",
    name: "time traveller",
    desc: "ran the intro backwards.",
    hint: "some things play better in reverse.",
    rarity: "rare",
  },
  {
    id: "y2k-compliant",
    name: "y2k compliant",
    desc: "visited the brutalist edition. circa 1997.",
    hint: "there's a version of this site with no css at all.",
    rarity: "rare",
  },
  {
    id: "six-seven",
    name: "six seven",
    desc: "you know what you did.",
    hint: "a number. an infuriating one.",
    rarity: "common",
  },
  {
    id: "identity-crisis",
    name: "identity crisis",
    desc: "made the name forget itself.",
    hint: "hover over something that took effort to spell.",
    rarity: "common",
  },
  {
    id: "rainbow-road",
    name: "rainbow road",
    desc: "turned the matrix rain into a pride flag.",
    hint: "the code rain has a hidden colour scheme.",
    rarity: "common",
  },
  {
    id: "now-playing",
    name: "now playing",
    desc: "pinned the spotify card open.",
    hint: "the dissolving tile card can be made to stay.",
    rarity: "common",
  },
  {
    id: "git-blame",
    name: "git blame",
    desc: "expanded a commit in the timeline.",
    hint: "some commits have more to say than their subject line.",
    rarity: "common",
  },
  {
    id: "who-made-this",
    name: "who made this",
    desc: "unmasked the footer.",
    hint: "somebody made this site. their name is shy.",
    rarity: "common",
  },
  {
    id: "self-destruct",
    name: "self destruct",
    desc: "closed the tab on purpose. rude.",
    hint: "there is an exit. it is very literal.",
    rarity: "common",
  },

  // ─── exit 8 ────────────────────────────────────────────────────────────────
  {
    id: "anomaly-spotter",
    name: "anomaly spotter",
    desc: "caught your first anomaly.",
    hint: "something in the corridor will look wrong. say so.",
    rarity: "common",
  },
  {
    id: "broke-the-loop",
    name: "broke the loop",
    desc: "escaped exit 8. all eight of them.",
    hint: "the corridor has an end. eventually.",
    rarity: "legendary",
  },
  {
    id: "speedrunner",
    name: "speedrunner",
    desc: "escaped exit 8 on fast mode. show off.",
    hint: "???",
    rarity: "legendary",
    secret: true,
  },
  {
    id: "raavana-mavandaa",
    name: "raavana mavandaa",
    desc: "escaped exit 8 to a mass hero send-off. ravana's son indeed.",
    hint: "???",
    rarity: "legendary",
    secret: true,
  },

  // ─── split fiction ─────────────────────────────────────────────────────────
  {
    id: "world-splitter",
    name: "world splitter",
    desc: "tore the site into two worlds.",
    hint: "this page can hold two realities at once.",
    rarity: "rare",
  },
  {
    id: "spin-doctor",
    name: "spin doctor",
    desc: "found the rotating seam.",
    hint: "the divide doesn't have to stay vertical.",
    rarity: "rare",
  },
  {
    id: "trigger-happy",
    name: "trigger happy",
    desc: "fired fifty laser bolts. therapeutic.",
    hint: "the tech side rewards holding still and holding down.",
    rarity: "rare",
  },
  {
    id: "metamorphosis",
    name: "metamorphosis",
    desc: "turned a laser into a butterfly.",
    hint: "???",
    rarity: "rare",
    secret: true,
  },

  // ─── pokéball ──────────────────────────────────────────────────────────────
  {
    id: "gotta-catch-em",
    name: "gotta catch 'em",
    desc: "caught me. 50/50 odds and you took them.",
    hint: "throw something red and white.",
    rarity: "rare",
  },
  {
    id: "uncontainable",
    name: "uncontainable",
    desc: "i broke free. better luck next time.",
    hint: "throw something red and white. then lose.",
    rarity: "rare",
  },

  // ─── meta ──────────────────────────────────────────────────────────────────
  {
    id: "completionist",
    name: "completionist",
    desc: "found everything. genuinely, thank you.",
    hint: "???",
    rarity: "legendary",
    secret: true,
  },
];

Object.freeze(ACHIEVEMENTS);

export const TOTAL = ACHIEVEMENTS.length;
// Total reachable on a touch/no-keyboard device - excludes desktopOnly entries
// so the progress bar, percentage, and completionist check never demand
// something a mobile visitor has no way to trigger.
export const TOTAL_TOUCH = ACHIEVEMENTS.filter((a) => !a.desktopOnly).length;

export const BY_ID = ACHIEVEMENTS.reduce((acc, a) => {
  acc[a.id] = a;
  return acc;
}, {});

export default ACHIEVEMENTS;
