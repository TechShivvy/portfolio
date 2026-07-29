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

    // Elder Futhark runes — shown on the right half during splitFiction.
    const fairyChars = "\u16A0\u16A2\u16A6\u16A8\u16B1\u16B2\u16B7\u16B9\u16BA\u16BE\u16C1\u16C3\u16C7\u16C8\u16C9\u16CA\u16CF\u16D2\u16D6\u16D7\u16DA\u16DC\u16DE\u16DF".split("");

    const fontSize = 14;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Displayed (CSS-pixel) size of the canvas. Recomputed on resize/zoom so
    // the bitmap always matches the element and characters never stretch.
    let cssW = 0;
    let cssH = 0;
    let matrix = [];

    // ── Reverse (tenet) state ─────────────────────────────────────────────
    // When the `matrix:reverse` event fires, every column retracts from its
    // current height back up to the top over REVERSE_MS, all arriving together
    // (same time, same point). Then the canvas freezes and reports back. Kept
    // slow so it reads at the same graceful pace as the forward intro.
    const REVERSE_MS = 2600;
    let reversing = false;
    let reverseStart = 0;
    let reverseFrom = [];
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function startReverse() {
      if (reversing) return;
      reversing = true;
      reverseStart = 0; // stamped on the first reverse frame
      reverseFrom = matrix.slice();
    }

    function drawReverse(timestamp) {
      if (!reverseStart) reverseStart = timestamp;
      const t = Math.min(1, (timestamp - reverseStart) / REVERSE_MS);
      const e = easeInOutCubic(t);

      // Stronger fade than the forward rain so the trails retract cleanly.
      context.fillStyle = "rgba(0, 0, 0, 0.18)";
      context.fillRect(0, 0, cssW, cssH);
      context.font = fontSize + "px monospace";

      for (let i = 0; i < matrix.length; i++) {
        if (window.__matrixRainbow) {
          context.fillStyle = `hsl(${(i * 7 + Date.now() / 30) % 360}, 80%, 60%)`;
        } else {
          context.fillStyle = COLOR_MATRIX;
        }
        // Pull the head from its captured height back up to the top (y = 0).
        matrix[i] = (reverseFrom[i] || 0) * (1 - e);
        const text =
          charactersArray[Math.floor(Math.random() * charactersArray.length)];
        context.fillText(text, i * fontSize, matrix[i] * fontSize);
      }

      if (t >= 1) {
        // All columns have frozen at the top - clear to solid black and stop.
        context.fillStyle = "#000";
        context.fillRect(0, 0, cssW, cssH);
        reversing = false;
        cancelAnimationFrame(rafId);
        rafId = null;
        window.dispatchEvent(new Event("matrix:reverse-done"));
      }
    }

    function resizeCanvas() {
      cssW = canvas.clientWidth || window.innerWidth;
      cssH = canvas.clientHeight || window.innerHeight;
      // Keep the bitmap resolution in step with the displayed size so the
      // browser never has to scale (and distort) a stale bitmap.
      canvas.width = cssW;
      canvas.height = cssH;
      const columns = Math.floor(cssW / fontSize) + 1;
      if (columns > matrix.length) {
        // grew wider - seed new columns at 0 so first char draws at y=0
        // (no gap at the top of the viewport on first frame)
        for (let i = matrix.length; i < columns; i++) matrix[i] = 0;
      } else {
        // shrank - drop the extra columns
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
        // Right-side columns swap to runic chars during splitFiction.
        // In spin mode, side detection follows the rotated seam geometry.
        const splitX = (window.__sfSplitPct || 50) / 100 * cssW;
        const glyphX = i * fontSize;
        const glyphY = (matrix[i] * fontSize) % cssH;
        const onRightSide =
          typeof window.__sfIsRightAt === "function"
            ? window.__sfIsRightAt(glyphX, glyphY)
            : glyphX >= splitX;
        const pool =
          window.__sfFairyActive && onRightSide
            ? fairyChars
            : charactersArray;
        const text = pool[Math.floor(Math.random() * pool.length)];
        context.fillText(text, i * fontSize, matrix[i] * fontSize);

        if (matrix[i] * fontSize > cssH && Math.random() > 0.975) {
          matrix[i] = 0;
        }

        matrix[i]++;
      }
    }

    function animateMatrix(timestamp) {
      rafId = requestAnimationFrame(animateMatrix);
      // Tenet in progress: retract the rain and ignore FPS throttling.
      if (reversing) {
        drawReverse(timestamp);
        return;
      }
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
    window.addEventListener("matrix:reverse", startReverse);

    let lastTime = 0;
    let rafId = requestAnimationFrame(animateMatrix);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("matrix:reverse", startReverse);
    };
  }, [startAnimation]);

  return <canvas className={styles["matrix"]} id="matrix" ref={canvasRef} />;
};

export default MatrixAnimation;
