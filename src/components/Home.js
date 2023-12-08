import React, { useEffect, useState, useRef } from "react";
import styles from "./_Home.module.css";
import task1 from "../utils/scramble";
import swal from "sweetalert";
import Swal from "sweetalert2";
import MatrixAnimation from "./Matrix.js";

const Home = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const [showArrow, setShowArrow] = useState(true);
  const canvasRef = useRef(null);
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

  const handleH1Click = () => {
    console.log("H1 element clicked!");
    const hasRun = sessionStorage.getItem("hasRun");

    if (hasRun && hasRun === "true") {
      Swal.fire({
        title: "Do you want to see the animation again?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        // confirmButtonColor: "#3085d6",
        // cancelButtonColor: "#d33",
        confirmButtonColor: "#2ba2a2",
        cancelButtonColor: "#a22b2b",
        // width: "300",
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
      {/* <div className={`${styles["centered-content"]} ${styles["glitch"]}`}> */}
      <div className={styles["centered-content"]}>
        <h1 id="hackerText" onClick={handleH1Click}>
          S h i v c h a r a n
        </h1>
        {startAnimation && showArrow && (
          <div className={styles["down-arrow"]}></div>
        )}
      </div>
    </div>
  );
};

export default Home;
