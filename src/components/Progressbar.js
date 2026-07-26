import React, { useState, useEffect, useRef } from "react";
import styles from "./_Progressbar.module.css";

function Progressbar() {
  const barRef = useRef(null);
  const tickingRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [top, setTop] = useState("50px");

  useEffect(() => {
    // Anchor the bar to the bottom of the navbar so it never overlaps it,
    // regardless of navbar height (which differs between mobile and desktop).
    const measureTop = () => {
      const nav = document.getElementById("navbar");
      setTop(nav ? `${Math.round(nav.getBoundingClientRect().height)}px` : "50px");
    };

    const update = () => {
      tickingRef.current = false;
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const range = scrollHeight - clientHeight;
      let pct = range > 0 ? (scrollTop / range) * 100 : 0;
      pct = Math.max(0, Math.min(pct, 100));
      // Write straight to the DOM every animation frame so the bar tracks the
      // scroll position continuously instead of catching up when scrolling stops.
      if (barRef.current) barRef.current.style.width = `${pct}%`;
      setIsVisible(window.scrollY > window.innerHeight);
    };

    const requestTick = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(update);
      }
    };

    const onResize = () => {
      measureTop();
      requestTick();
    };

    measureTop();
    update();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className={`${styles["progress-container"]} ${isVisible ? styles["progress-container--visible"] : ""}`}
      id="progress-container"
      style={{ top }}
    >
      <div
        className={styles["progress-bar"]}
        id="progress-bar"
        ref={barRef}
      ></div>
    </div>
  );
}

export default Progressbar;
