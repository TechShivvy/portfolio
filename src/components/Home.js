import React, { useEffect, useState, useRef } from "react";
import styles from "./_Home.module.css";
import task1 from "./../tasks/task1";
import MatrixAnimation from "./Matrix.js";

const Home = () => {
  const [startAnimation, setStartAnimation] = useState(false);
  const canvasRef = useRef(null);
  useEffect(() => {
    async function loadTask1() {
      await task1(); // Wait for task1 to complete
      // Now that task1 is complete, you can run the following code
      // const [task1Complete, setTask1Complete] = useState(false);
      //   const characters =
      //     "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      //   const charactersArray = characters.split("");

      //   const fontSize = 16;
      //   const canvas = canvasRef.current;
      //   const context = canvas.getContext("2d");

      //   canvas.width = window.innerWidth;
      //   canvas.height = window.innerHeight;

      //   const columns = Math.floor(canvas.width / fontSize);
      //   const rows = Math.floor(canvas.height / fontSize);

      //   const matrix = [];
      //   for (let i = 0; i < columns; i++) {
      //     matrix[i] = 1;
      //   }

      //   function drawMatrix() {
      //     context.fillStyle = "rgba(0, 0, 0, 0.05)";
      //     context.fillRect(0, 0, canvas.width, canvas.height);

      //     context.fillStyle = "#00FF00";
      //     context.font = fontSize + "px monospace";

      //     for (let i = 0; i < matrix.length; i++) {
      //       const text =
      //         charactersArray[Math.floor(Math.random() * charactersArray.length)];
      //       context.fillText(text, i * fontSize, matrix[i] * fontSize);

      //       if (matrix[i] * fontSize > canvas.height && Math.random() > 0.975) {
      //         matrix[i] = 0;
      //       }

      //       matrix[i]++;
      //     }
      //   }

      //   function animateMatrix() {
      //     // Check if the animation should start
      //     drawMatrix();
      //     requestAnimationFrame(animateMatrix);
      //   }

      //   animateMatrix();
      setStartAnimation(true); // Start the Matrix animation
    }

    loadTask1(); // Call the async function to initiate the loading process
  }, []);

  return (
    <div className={styles["home-section"]} id="home">
      {/* <MatrixAnimation /> */}
      <MatrixAnimation startAnimation={startAnimation} />
      {/* <canvas className={styles["matrix"]} id="matrix" ref={canvasRef} /> */}
      <div className={styles["centered-content"]}>
        <h1 id="hackerText">S h i v c h a r a n</h1>
      </div>
    </div>
  );
};

export default Home;
