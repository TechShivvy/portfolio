import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Inject cursor paths as CSS variables so they correctly use Vite's base path
// in all environments (dev: '/', production gh-pages: '/portfolio/').
const base = import.meta.env.BASE_URL;
document.documentElement.style.setProperty(
  '--cursor-default',
  `url('${base}watch-dogs-cursor.cur'), auto`
);
document.documentElement.style.setProperty(
  '--cursor-pointer',
  `url('${base}middle-finger.cur'), pointer`
);

// Tracked so SF can read the cursor's position at activation time.
document.addEventListener("mousemove", (e) => { window.__lastMouseX = e.clientX; }, { passive: true });

// Real readiness signal for the splash in index.html, replacing the old
// "does #root have any child" poll (which was satisfied by an empty Suspense
// fallback long before the hero actually existed). Two gates: the custom
// font has actually downloaded, and the hero (Home) has mounted and painted.
// This module runs after index.css is imported above, so document.fonts
// always sees the real @font-face rule here - unlike the inline classic
// script in index.html, which in dev runs before Vite injects the CSS.
window.__appProgressValue = 0;
function reportProgress(v) {
  if (v <= window.__appProgressValue) return;
  window.__appProgressValue = v;
  window.dispatchEvent(new CustomEvent("app:progress", { detail: v }));
}

let fontReady = false;
let heroReady = false;
function maybeAppReady() {
  if (!(fontReady && heroReady) || window.__appReady) return;
  window.__appReady = true;
  window.dispatchEvent(new Event("app:ready"));
}

if (document.fonts && document.fonts.load) {
  document.fonts
    .load('1em "Hacked"')
    .then(() => document.fonts.ready)
    .then(() => {
      fontReady = true;
      reportProgress(0.45);
      maybeAppReady();
    })
    .catch(() => {
      fontReady = true;
      reportProgress(0.45);
      maybeAppReady();
    });
} else {
  fontReady = true;
}

window.addEventListener(
  "hero:painted",
  () => {
    heroReady = true;
    reportProgress(0.9);
    maybeAppReady();
  },
  { once: true }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
