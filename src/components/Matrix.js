import React, { useEffect, useRef } from "react";
import styles from "./_Home.module.css";
import { COLOR_MATRIX } from "../utils/tokens";

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

    // Displayed (CSS-pixel) size of the canvas. Recomputed on resize/zoom so
    // the bitmap always matches the element and characters never stretch.
    let cssW = 0;
    let cssH = 0;
    let matrix = [];

    function resizeCanvas() {
      cssW = canvas.clientWidth || window.innerWidth;
      cssH = canvas.clientHeight || window.innerHeight;
      // Keep the bitmap resolution in step with the displayed size so the
      // browser never has to scale (and distort) a stale bitmap.
      canvas.width = cssW;
      canvas.height = cssH;
      const columns = Math.floor(cssW / fontSize) + 1;
      if (columns > matrix.length) {
        // grew wider — seed the new columns at the top
        for (let i = matrix.length; i < columns; i++) matrix[i] = 1;
      } else {
        // shrank — drop the extra columns
        matrix.length = columns;
      }
    }

    function drawMatrix() {
      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, cssW, cssH);

      context.font = fontSize + "px monospace";

      for (let i = 0; i < matrix.length; i++) {
        if (window.__matrixRainbow) {
          context.fillStyle = `hsl(${(i * 7 + Date.now() / 30) % 360}, 80%, 60%)`;
        } else {
          context.fillStyle = COLOR_MATRIX;
        }
        const text =
          charactersArray[Math.floor(Math.random() * charactersArray.length)];
        context.fillText(text, i * fontSize, matrix[i] * fontSize);

        if (matrix[i] * fontSize > cssH && Math.random() > 0.975) {
          matrix[i] = 0;
        }

        matrix[i]++;
      }
    }

    function animateMatrix(timestamp) {
      rafId = requestAnimationFrame(animateMatrix);
      // If a target FPS is set (via the terminal `matrix fps <n>` command),
      // throttle to that rate; otherwise run at the display's native refresh.
      const targetFps = window.__matrixFps || 0;
      if (targetFps > 0) {
        const interval = 1000 / targetFps;
        const elapsed = timestamp - lastTime;
        if (elapsed < interval) return;
        lastTime = timestamp - (elapsed % interval);
      }
      drawMatrix();
    }

    resizeCanvas();

    // Track size changes from window resize AND browser zoom (both change the
    // canvas's CSS-pixel size, which ResizeObserver reports reliably).
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", resizeCanvas);

    let lastTime = 0;
    let rafId = requestAnimationFrame(animateMatrix);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [startAnimation]);

  return <canvas className={styles["matrix"]} id="matrix" ref={canvasRef} />;
};

export default MatrixAnimation;
