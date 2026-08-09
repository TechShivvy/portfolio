import styles from "./../components/_Home.module.css";
import { COLOR_ACCENT, COLOR_ACCENT_DANGER } from "./tokens";
import { unlock } from "./achievements";

const task1 = () => {
  const textElement = document.getElementById("hackerText");
  const centeredContentElement = document.querySelector(
    `.${styles["centered-content"]}`
  );
  const originalText = textElement.innerHTML;
  const characters =
    "!#$%&'()*+,-./:;<=>?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let counter = 0;
  let scrambledText = [];
  let isHovered = false;
  let isAnimationComplete = false;

  const maxIterations = originalText.length * 2;
  const isSmallScreen = window.innerWidth <= 768;
  const text = [];
  const hasRun = sessionStorage.getItem("hasRun");

  if (hasRun) {
    // sessionStorage.setItem("hasRunOnce", "true");
    isAnimationComplete = true;
    centeredContentElement.style.color = COLOR_ACCENT;
  }

  function getRandomChar() {
    const n = Math.floor(Math.random() * characters.length);
    return characters[n];
  }

  return new Promise((resolve) => {
    
    for (let i = 0; i < originalText.length; i++) {
      const t = [];
      text.push(t);
    }

    for (let i = 0; i < originalText.length; i++) {
      const t = text[i];
      for (let j = 0; j < maxIterations - 20 * Math.random(); j++) {
        t.push(getRandomChar());
      }
      if (originalText[i] === " " && isSmallScreen) scrambledText.push(" ");
      else scrambledText.push(getRandomChar);
      t.push(originalText[i]);
    }

    for (let i = 0; i < originalText.length; i++) {
      scrambledText.push(getRandomChar);
    }

    function scrambleText() {
      if (counter < maxIterations) {
        for (let i = 0; i < originalText.length; i++) {
          const r = text[i];
          if (counter < r.length) {
            if (originalText[i] === " " && isSmallScreen) {
              scrambledText[i] = " ";
            } else {
              scrambledText[i] = r[counter];
            }
          } else {
            scrambledText[i] = r[r.length - 1];
          }
        }
        const joinedScrambledText = scrambledText.join("");
        // if (
        //   textElement.innerHTML ===
        //   joinedScrambledText.substring(0, originalText.length)
        // )
        //   counter += maxIterations;
        textElement.innerHTML = joinedScrambledText.substring(
          0,
          originalText.length
        );
      } else {
        isAnimationComplete = true;
        centeredContentElement.style.color = COLOR_ACCENT;
        sessionStorage.setItem("hasRun","true");
        clearInterval(inst);
        resolve();
        
      }
      counter++;
    }

    function scrambleTextEndless() {
      if (isHovered && isAnimationComplete) {
        let scrambledText = "";

        for (let i = 0; i < originalText.length; i++) {
          if (Math.random() < 0.5) {
            scrambledText += String.fromCharCode(Math.random() * 94 + 33);
          } else {
            scrambledText += originalText[i];
          }
        }

        scrambledText = scrambledText.substring(0, originalText.length);

        textElement.innerHTML = scrambledText;
      }
    }

    textElement.addEventListener("mouseover", () => {
      if (isAnimationComplete) {
        unlock("identity-crisis");
        isHovered = true;
        clearInterval(inst);
        centeredContentElement.style.color = COLOR_ACCENT_DANGER;
        inst = setInterval(scrambleTextEndless, 100);
      }
    });

    textElement.addEventListener("mouseout", () => {
      if (isAnimationComplete) {
        isHovered = false;
        textElement.innerHTML = originalText;
        centeredContentElement.style.color = COLOR_ACCENT;
      }
    });

    // Touch has no hover - mouseover/mouseout above never fire on a phone or
    // tablet, so identity-crisis would otherwise be unreachable there. A tap
    // runs the same scramble for a fixed window instead of tracking
    // enter/leave state, since touch has no equivalent to mouseout.
    textElement.addEventListener("touchstart", () => {
      if (!isAnimationComplete || isHovered) return;
      unlock("identity-crisis");
      isHovered = true;
      clearInterval(inst);
      centeredContentElement.style.color = COLOR_ACCENT_DANGER;
      inst = setInterval(scrambleTextEndless, 100);
      setTimeout(() => {
        isHovered = false;
        clearInterval(inst);
        textElement.innerHTML = originalText;
        centeredContentElement.style.color = COLOR_ACCENT;
      }, 1200);
    }, { passive: true });

    let inst = !hasRun?setInterval(scrambleText, 100):resolve();
    // resolve();
  });
};

export default task1;

