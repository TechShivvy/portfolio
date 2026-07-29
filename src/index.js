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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
