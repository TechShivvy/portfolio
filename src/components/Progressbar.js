import React, { useState, useEffect, useRef } from "react";
import styles from "./_Progressbar.module.css";

function Progressbar() {
  const barRef = useRef(null);
  const tickingRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [top, setTop] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768 ? "50px" : "0px"
  );

  useEffect(() => {
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
      setTop(window.innerWidth >= 768 ? "50px" : "0px");
      requestTick();
    };

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
