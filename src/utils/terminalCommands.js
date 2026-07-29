import TIMELINE from "../content/timeline";
import tenet from "./tenet";
import buildVirtualFiles from "./virtualFiles";

// ─── Command definitions ────────────────────────────────────────────────────
export default function buildCommands(scrollToSection) {
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
