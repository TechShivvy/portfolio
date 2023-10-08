import React, { useState, useEffect } from "react";
import styles from "./_Progressbar.module.css";

function Progressbar() {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Function to update the progress bar based on scroll position
  function updateProgressBar() {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const newScrollPercentage =
      (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollPercentage(newScrollPercentage);
  }

  function updateWindowWidth() {
    setWindowWidth(window.innerWidth);
  }

  useEffect(() => {
    // Update the progress bar when the page loads
    updateProgressBar();
    updateWindowWidth();

    // Add event listeners for scroll and resize
    window.addEventListener("scroll", updateProgressBar);
    window.addEventListener("resize", updateWindowWidth);

    // Clean up the event listeners when the component unmounts
    return () => {
      window.removeEventListener("scroll", updateProgressBar);
      window.removeEventListener("resize", updateWindowWidth);
    };
  }, []); // Empty dependency array to run the effect only once

  return (
    <div
      className={styles["progress-container"]}
      id="progress-container"
      style={windowWidth >= 768 ? { top: "50px" } : { top: "0px" }}
    >
      <div
        className={styles["progress-bar"]}
        id="progress-bar"
        style={{ width: `${scrollPercentage}%` }}
      ></div>
    </div>
  );
}

export default Progressbar;
