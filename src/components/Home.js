import React, { useEffect, useState, useRef } from "react";
import styles from "./_Home.module.css";
import task1 from "../utils/scramble";
import swal from "sweetalert";
import MatrixAnimation from "./Matrix.js";

const Home = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const canvasRef = useRef(null);
  useEffect(() => {
    async function loadTask1() {
      await task1();
      setStartAnimation(true);
    }

    loadTask1();
  }, []);

  const handleH1Click = () => {
    console.log("H1 element clicked!");
    const hasRun = sessionStorage.getItem("hasRun");

    if (hasRun && hasRun === "true") {
      swal({
        title: "Do you want to see the animation again?",
        icon: "info",
        buttons: ["No", "Yes"],
      }).then((value) => {
        if (value) {
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
      </div>
    </div>
  );
};

export default Home;
