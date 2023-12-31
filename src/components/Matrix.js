import React, { useEffect, useRef } from "react";
import styles from "./_Home.module.css";

const MatrixAnimation = ({ startAnimation }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!startAnimation) {
      return;
    }

    const characters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charactersArray = characters.split("");

    const fontSize = 14;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = window.innerWidth + 10;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / fontSize) + 10;
    const rows = Math.floor(canvas.height / fontSize);

    const matrix = [];
    for (let i = 0; i < columns; i++) {
      matrix[i] = 1;
    }

    function drawMatrix() {
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#626e5e";
      context.font = fontSize + "px monospace";

      for (let i = 0; i < matrix.length; i++) {
        const text =
          charactersArray[Math.floor(Math.random() * charactersArray.length)];
        context.fillText(text, i * fontSize, matrix[i] * fontSize);

        if (matrix[i] * fontSize > canvas.height && Math.random() > 0.975) {
          matrix[i] = 0;
        }

        matrix[i]++;
      }
    }

    function animateMatrix() {
      drawMatrix();
      requestAnimationFrame(animateMatrix);
    }

    animateMatrix();
  }, [startAnimation]);

  return <canvas className={styles["matrix"]} id="matrix" ref={canvasRef} />;
};

export default MatrixAnimation;
