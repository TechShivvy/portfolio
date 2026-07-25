import React, { useEffect, useState } from "react";
import styles from "./_ScrollUp.module.css";

function ScrollUp() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowButton(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`${styles.scrollBtn} ${showButton ? styles.visible : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
    >
      <span className={styles.chevronUp}></span>
      <span className={styles.chevronUp}></span>
    </button>
  );
}

export default ScrollUp;
