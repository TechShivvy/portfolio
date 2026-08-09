# portfolio

Personal portfolio at [techshivvy.github.io/portfolio](https://techshivvy.github.io/portfolio) - React + Vite, deployed to GitHub Pages.

Beyond the usual sections (about, projects, timeline, contact), the site has a set of hidden interactions - a Steam-style achievements system tracks and rewards finding them. Open the terminal and type `help`, or press `?` on desktop, for a starting point.

## Stack

- React 18 + Vite 6
- CSS Modules (no CSS framework)
- `react-router-dom` for routing, `sweetalert2` for the one confirm dialog, `@formspree/react` for the contact form
- No global state library - the app coordinates through `window` CustomEvents and a handful of `window.__*` globals, matching the plain-DOM easter eggs (Exit 8, Split Fiction, TENET) that aren't React components

## Development

```bash
npm install
npm run dev      # http://localhost:5173, or the next free port
```

```bash
npm run build     # production build to build/
npm run preview   # serve that build locally
npm run deploy    # build + publish to gh-pages
```

The app is served under `/portfolio/` in production (see `base` in `vite.config.js`) to match the GitHub Pages project-site path.

## Notable bits

- `src/utils/` holds the standalone easter eggs (`exit8.js`, `splitFiction.js`, `tenet.js`, `pokeball.js`, `scramble.js`) - plain JS modules that manipulate the DOM directly rather than React components, since some of them (Exit 8's corridor loop, Split Fiction's world-split) need to clone or overlay the whole page.
- `src/utils/achievements.js` + `src/content/achievements.js` are the achievement engine and registry - `unlock(id)` is safe to call from any of the above without touching React state.
- `public/raw.html` is a plain-HTML, no-CSS alternate version of the site (`portfolio --no-css` in the terminal, or `Ctrl+K` `r`).
