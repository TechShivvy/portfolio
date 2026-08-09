import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./_Home.module.css";
import task1 from "../utils/scramble";
import { COLOR_ACCENT, COLOR_ACCENT_DANGER } from "../utils/tokens";
import MatrixAnimation from "./Matrix.js";
import useKonami from "../utils/konami";
import { unlock } from "../utils/achievements";

const Home = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const [showArrow, setShowArrow] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [rainbowToast, setRainbowToast] = useState(null);
  const [introStarted, setIntroStarted] = useState(false);
  const arrowHiddenRef = useRef(false);

  const handleKonami = useCallback(() => {
    unlock("person-of-culture");
    const next = !window.__matrixRainbow;
    window.__matrixRainbow = next;
    if (next) unlock("rainbow-road");
    setRainbowToast(next ? ">> rainbow matrix: ON" : ">> rainbow matrix: OFF");
    setTimeout(() => setRainbowToast(null), 2200);
  }, []);

  useKonami(handleKonami);

  // Tell the splash the hero is actually in the DOM and painted, so it can
  // stop covering the page. Double-rAF: one frame to commit, one to paint.
  useLayoutEffect(() => {
    let raf1;
    let raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        window.dispatchEvent(new Event("hero:painted"));
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTask1() {
      if (cancelled) return;
      setIntroStarted(true);
      await task1();
      if (!cancelled) {
        setStartAnimation(true);
        // Scramble has settled and the matrix is about to start flowing -
        // the achievements system waits for this before showing anything,
        // so the first toast doesn't pop up mid-intro. See Achievements.js.
        window.__heroIntroDone = true;
        window.dispatchEvent(new Event("hero:intro-done"));
      }
    }

    // Start the hero intro (scramble → set name → matrix) only once the
    // loading splash has lifted, so it isn't played hidden behind it.
    if (window.__splashDone) {
      loadTask1();
    } else {
      window.addEventListener("splash:done", loadTask1, { once: true });
    }

    const handleScroll = () => {
      setShowArrow(window.scrollY <= 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      cancelled = true;
      window.removeEventListener("splash:done", loadTask1);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Step 1: mount the arrow element 3.5 s after intro
  useEffect(() => {
    if (!startAnimation || arrowHiddenRef.current) return;
    const timer = setTimeout(() => {
      if (arrowHiddenRef.current) return;
      setShowHint(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  // Step 2: once mounted, double-RAF so browser paints opacity:0 first,
  // then the CSS transition fires to opacity:1 cleanly
  useEffect(() => {
    if (!showHint || arrowHiddenRef.current) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!arrowHiddenRef.current) setHintVisible(true);
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, [showHint]);

  // Step 3: sync fade in/out with scroll - only depends on showArrow so it
  // doesn't fire on mount (which would race with the double-RAF above)
  useEffect(() => {
    if (arrowHiddenRef.current) return;
    if (showHint) setHintVisible(showArrow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArrow]);

  // Tenet sequence: the down-arrow hint is the last thing in, so it's the
  // first thing out. Fade it away and keep it hidden for the rest of the run.
  useEffect(() => {
    const hideArrow = () => {
      arrowHiddenRef.current = true;
      setHintVisible(false);
    };
    window.addEventListener("hero:hide-arrow", hideArrow);
    return () => window.removeEventListener("hero:hide-arrow", hideArrow);
  }, []);

  const YES_OPTS = ["yuh!", "yus", "ye!", "yup!", "mhm!"];
  const NO_OPTS  = ["nah", "nawr", "nO", "nahhh", "nope"];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const handleH1Click = async () => {
    const hasRun = sessionStorage.getItem("hasRun");

    if (hasRun && hasRun === "true") {
      const { default: Swal } = await import("sweetalert2");
      Swal.fire({
        title: "wanna see the animation again? ^.^",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: pick(YES_OPTS),
        cancelButtonText: pick(NO_OPTS),
        confirmButtonColor: COLOR_ACCENT,
        cancelButtonColor: COLOR_ACCENT_DANGER,
        customClass: {
          popup: "shivi-swal-popup",
          title: "shivi-swal-title",
          confirmButton: "shivi-swal-confirm",
          cancelButton: "shivi-swal-cancel",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          sessionStorage.removeItem("hasRun");
          window.location.reload();
        }
      });
    }
  };

  return (
    <div className={styles["home-section"]} id="home">
      <MatrixAnimation startAnimation={startAnimation} />
      <div
        className={styles["centered-content"]}
        style={{
          opacity: introStarted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <h1 id="hackerText" onClick={handleH1Click}>
          S h i v c h a r a n
        </h1>
      </div>
      {rainbowToast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.85)", color: "#fff", padding: "8px 20px",
          borderRadius: "6px", fontSize: "0.95rem", zIndex: 9999,
          pointerEvents: "none", letterSpacing: "0.02em",
        }}>{rainbowToast}</div>
      )}
      {startAnimation && showHint && (
        <div className={`${styles["scroll-hint"]} ${hintVisible ? styles["scroll-hint--visible"] : ""}`}>
          <div className={styles["down-arrow"]}></div>
        </div>
      )}
    </div>
  );
};

export default Home;
