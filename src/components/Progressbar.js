import React, { useState, useEffect } from "react";
import styles from "./_Progressbar.module.css";
import $ from "jquery";

function Progressbar() {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
    if (window.scrollY > window.innerHeight) {
      $("#progress-container").fadeIn(400);
    } else {
      $("#progress-container").fadeOut(0);
    }
  }

  useEffect(() => {
    showProgressBar();
    updateProgressBar();
    updateWindowWidth();

    $(window).on("resize scroll", showProgressBar);
    $(window).on("resize scroll", updateProgressBar);
    $(window).on("resize", updateWindowWidth);

    return () => {
      $(window).off("resize scroll", showProgressBar);
      $(window).off("resize scroll", updateProgressBar);
      $(window).off("resize", updateWindowWidth);
    };
  }, []);

  return (
    <div
      className={styles["progress-container"]}
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
