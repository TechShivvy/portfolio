import React, { useEffect, useState } from "react";
import styles from "./_Home.module.css";
import task1 from "../utils/scramble";
import Swal from "sweetalert2";
import { COLOR_ACCENT, COLOR_ACCENT_DANGER } from "../utils/tokens";
import MatrixAnimation from "./Matrix.js";

const Home = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const [showArrow, setShowArrow] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    async function loadTask1() {
      await task1();
      setStartAnimation(true);
    }

    loadTask1();

    const handleScroll = () => {
      setShowArrow(window.scrollY <= 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Step 1: mount the arrow element 3.5 s after intro
  useEffect(() => {
    if (!startAnimation) return;
    const timer = setTimeout(() => setShowHint(true), 3500);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  // Step 2: once mounted, double-RAF so browser paints opacity:0 first,
  // then the CSS transition fires to opacity:1 cleanly
  useEffect(() => {
    if (!showHint) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setHintVisible(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, [showHint]);

  // Step 3: sync fade in/out with scroll — only depends on showArrow so it
  // doesn't fire on mount (which would race with the double-RAF above)
  useEffect(() => {
    if (showHint) setHintVisible(showArrow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArrow]);

  const YES_OPTS = ["yuh!", "yus", "ye!", "yup!", "mhm!"];
  const NO_OPTS  = ["nah", "nawr", "nO", "nahhh", "nope"];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const handleH1Click = () => {
    console.log("H1 element clicked!");
    const hasRun = sessionStorage.getItem("hasRun");

    if (hasRun && hasRun === "true") {
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
      <div className={styles["centered-content"]}>
        <h1 id="hackerText" onClick={handleH1Click}>
          S h i v c h a r a n
        </h1>
      </div>
      {startAnimation && showHint && (
        <div className={`${styles["scroll-hint"]} ${hintVisible ? styles["scroll-hint--visible"] : ""}`}>
          <div className={styles["down-arrow"]}></div>
        </div>
      )}
    </div>
  );
};

export default Home;
