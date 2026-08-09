import "./App.css";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import Achievements from "./components/Achievements";
// Static import: the hero must be in the main bundle and outside the shared
// Suspense boundary below, or the splash's "app ready" signal (which fires
// once Home has painted) waits on every other lazy section's chunk too.
import Home from "./components/Home";

const About = lazy(() => import("./components/About"));
const BeyondCode = lazy(() => import("./components/BeyondCode"));
const ContactForm = lazy(() => import("./components/Contact"));
const Error404 = lazy(() => import("./components/Error404"));
const Footer = lazy(() => import("./components/Footer"));
const Navbar = lazy(() => import("./components/Navbar"));
const Project = lazy(() => import("./components/Project"));
const ScrollUp = lazy(() => import("./components/ScrollUp"));
const Timeline = lazy(() => import("./components/Timeline"));
const Work = lazy(() => import("./components/Work"));

function App() {
  // If we have a saved scroll position, start "restoring" so a black overlay
  // covers the page from the very first paint - this hides the brief flash of
  // the hero at the top before we jump to the saved position.
  const [restoring, setRestoring] = useState(() => {
    const s = sessionStorage.getItem("scrollpos");
    return !!s && parseInt(s, 10) > 0;
  });

  useEffect(() => {
    // Take over scroll restoration from the browser so ours is authoritative.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Restore the saved position. Sections are lazy-loaded, so the document
    // isn't tall enough right away - retry until we reach the target (or the
    // page simply can't get that tall anymore) instead of relying on
    // DOMContentLoaded, which has already fired by the time this effect runs.
    const saved = sessionStorage.getItem("scrollpos");
    const target = saved ? parseInt(saved, 10) : NaN;
    sessionStorage.removeItem("scrollpos");
    sessionStorage.removeItem("replayReload");

    if (!Number.isNaN(target) && target > 0) {
      let tries = 0;
      const maxTries = 60; // ~6s safety cap
      const restore = () => {
        window.scrollTo({ top: target, left: 0, behavior: "instant" });
        tries += 1;
        const reached = Math.abs(window.scrollY - target) <= 2;
        const canGrow =
          document.documentElement.scrollHeight - window.innerHeight < target;
        if (!reached && canGrow && tries < maxTries) {
          setTimeout(restore, 100);
        } else {
          // Reveal only once we're already at the saved position.
          setRestoring(false);
        }
      };
      requestAnimationFrame(restore);
    } else {
      setRestoring(false);
    }

    const handleBeforeUnload = () => {
      // Don't save scroll position when a replay command triggered the reload
      // - we want to land at the top, not restore the previous position.
      if (sessionStorage.getItem("replayReload") === "1") return;
      sessionStorage.setItem("scrollpos", window.scrollY.toString());
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <KeyboardShortcuts />
      <Achievements />
      {restoring && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--color-bg, #000)",
            zIndex: 100000,
            pointerEvents: "none",
          }}
        />
      )}
      <Routes>
          <Route
            exact
            path="/portfolio"
            element={
              <>
                <Home />
                <Suspense fallback={<div></div>}>
                  {/* Progressbar renders inside Navbar (anchored to its bottom edge). */}
                  <Navbar />
                  <About />
                  <Timeline />
                  <Work />
                  <Project />
                  <BeyondCode />
                  {/* <Construction /> */}
                  <ContactForm />
                  <Footer />
                  <ScrollUp />
                </Suspense>
              </>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<div></div>}>
                <Error404 />
              </Suspense>
            }
          />
        </Routes>
    </Router>
  );
}

export default App;
