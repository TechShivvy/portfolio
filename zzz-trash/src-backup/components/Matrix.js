import React, { useEffect, useRef } from "react";
import "./_Matrix.css";

const MatrixRainEffect = () => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersArray = characters.split("");

  const fontSize = 16;
  const speed = 3;

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / fontSize);
    const rows = Math.floor(canvas.height / fontSize);

    const matrix = [];
    for (let i = 0; i < columns; i++) {
      matrix[i] = 1;
    }

    function drawMatrix() {
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "#00FF00";
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

    return () => {
      cancelAnimationFrame(animateMatrix);
    };
  }, []);

  return (
    <div className="matrix-container">
      {/* <canvas ref={canvasRef}></canvas>
      <div className="centered-content">
        <h1 id="hackerText">S h i v c h a r a n</h1>
      </div> */}
    </div>
  );
};

export default MatrixRainEffect;
