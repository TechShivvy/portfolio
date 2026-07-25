// Single source of truth shared between the Beyond Code section and
// the interactive terminal commands.

export const INTERESTS = {
  games: {
    label: "Games",
    icon: "(ง'̀-'́)ง",
    blurb: "currently in: Los Santos. again. obviously.",
    favorites: [
      "GTA V  ← current mission: 100%",
      "GTA Vice City",
      "GTA San Andreas",
      "Watch Dogs  // inspired the cursor and font on this site ;)",
      "G-Force  // childhood speedrun unlocked",
      "Split Fiction",
      "It Takes Two  // cooperative chaos therapy",
      "A Way Out",
    ],
  },
  anime: {
    label: "Anime",
    icon: "(ﾟДﾟ)",
    blurb: "rewatching Demon Slayer for reasons i cannot explain",
    favorites: [
      "Demon Slayer",
      "Dandadan",
      "Bungo Stray Dogs",
      "Haikyuu  // made me care about volleyball. VOLLEYBALL.",
      "Death Note",
    ],
  },
  cycling: {
    label: "Cycling",
    icon: "ᕕ( ᐛ )ᕗ",
    blurb: "2,513 km logged and counting  // send help",
    favorites: [
      "60 km",
      "100 km  // the century",
      "58 km",
      "80 km",
    ],
  },
  rubik: {
    label: "Rubik's Cube",
    icon: "(°ロ°)",
    blurb: "3x3 PB: 26.05s  // still chasing sub-20",
    favorites: [
      "3x3  — 26.05s PB",
      "2x2",
      "4x4  // parity errors are personal attacks",
      "Pyraminx  // triangles, somehow more cursed",
      "Ghost cube  // pure masochism, no regrets",
    ],
  },
  tech: {
    label: "Tech",
    icon: "( ͡° ͜ʖ ͡°)",
    blurb: "down various rabbit holes, no signs of surfacing",
    favorites: [
      "mrwhosetheboss",
      "anthonywritescode  // niche dev stuff thats genuinely good",
      "logging & observability",
      "terminal tooling  // if it doesnt have a CLI i dont trust it",
      "// always watching: channels you've never heard of",
    ],
  },
  music: {
    label: "Music",
    icon: "(ノ◕ヮ◕)ノ",
    blurb: "Travis Scott on repeat but honestly? anything goes",
    favorites: [
      "Travis Scott",
      "rap / hip-hop",
      "// but real talk ill listen to anything. rec me sumn.",
      "check the Spotify card above ↑  // if it loads lol",
    ],
  },
};

Object.freeze(INTERESTS);

export default INTERESTS;
