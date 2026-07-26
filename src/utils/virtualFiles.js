import INTERESTS from "../content/interests";
import ABOUT from "../content/about";

// ─── Interest line helper ───────────────────────────────────────────────────
function interestLines(key) {
  const i = INTERESTS[key];
  if (!i) return [{ text: `no data for '${key}'`, type: "danger" }];
  return [
    { text: `${i.icon}  ${i.label}`, type: "accent" },
    { text: `   ${i.blurb}`, type: "output" },
    ...i.favorites.map((f) => ({ text: `   • ${f}`, type: "output" })),
  ];
}

// ─── Virtual filesystem ──────────────────────────────────────────────────────
// Files visible under `ls` and readable via `cat <name>`.
// Each entry: { name, type: "file"|"dir", fn: () => Line[] }
export default function buildVirtualFiles(scrollToSection) {
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
