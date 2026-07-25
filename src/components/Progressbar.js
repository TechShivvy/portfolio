import React, { useState, useEffect } from "react";
import styles from "./_Progressbar.module.css";

function Progressbar() {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isVisible, setIsVisible] = useState(false);

  function updateProgressBar() {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    let newScrollPercentage = Math.min(
      (scrollTop / (scrollHeight - clientHeight)) * 100,
      100
    );
    newScrollPercentage = Math.max(newScrollPercentage, 0);
    setScrollPercentage(newScrollPercentage);
  }

  function updateWindowWidth() {
    setWindowWidth(window.innerWidth);
  }

  function showProgressBar() {
    setIsVisible(window.scrollY > window.innerHeight);
  }

  useEffect(() => {
    showProgressBar();
    updateProgressBar();
    updateWindowWidth();

    window.addEventListener("scroll", showProgressBar);
    window.addEventListener("scroll", updateProgressBar);
    window.addEventListener("resize", showProgressBar);
    window.addEventListener("resize", updateProgressBar);
    window.addEventListener("resize", updateWindowWidth);

    return () => {
      window.removeEventListener("scroll", showProgressBar);
      window.removeEventListener("scroll", updateProgressBar);
      window.removeEventListener("resize", showProgressBar);
      window.removeEventListener("resize", updateProgressBar);
      window.removeEventListener("resize", updateWindowWidth);
    };
  }, []);

  return (
    <div
      className={`${styles["progress-container"]} ${isVisible ? styles["progress-container--visible"] : ""}`}
      id="progress-container"
      style={windowWidth >= 768 ? { top: "50px" } : { top: "0px" }}
    >
      <div
        className={styles["progress-bar"]}
        id="progress-bar"
        style={{ width: `${Math.min(scrollPercentage, 100)}%` }}
      ></div>
    </div>
  );
}

export default Progressbar;
