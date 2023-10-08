import styles from "./../components/_Home.module.css";

const task1 = () => {
  return new Promise((resolve) => {
    const textElement = document.getElementById("hackerText");
    const centeredContentElement = document.querySelector(
      `.${styles["centered-content"]}`
    );
    const originalText = textElement.innerHTML;

    const characters =
      "!#$%&'()*+,-./:;<=>?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let counter = 0;
    let scrambledText = [];
    let isHovered = false; // Track hover state
    let isAnimationComplete = false; // Track if the initial animation is complete
    const maxIterations = originalText.length * 2; // You can adjust this value as needed
    const isSmallScreen = window.innerWidth <= 768; // Define your breakpoint for smaller screens

    function getRandomChar() {
      const n = Math.floor(Math.random() * characters.length);
      return characters[n];
    }

    const text = [];
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

    console.log(text);
    // let scrambledText = Array.from(originalText); // Convert to an array

    function scrambleText() {
      if (counter < maxIterations) {
        for (let i = 0; i < originalText.length; i++) {
          const r = text[i];
          if (counter < r.length) {
            // Check if it's a space and it's a small screen, then preserve it
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
        console.log("'" + textElement.innerHTML + "'");
      } else {
        clearInterval(inst);
        resolve();
        isAnimationComplete = true;
        centeredContentElement.style.color = "#00ff00";
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
        isHovered = true;
        clearInterval(inst); // Stop any ongoing animation
        centeredContentElement.style.color = "#ff0000";
        inst = setInterval(scrambleTextEndless, 100);
      }
    });

    textElement.addEventListener("mouseout", () => {
      if (isAnimationComplete) {
        isHovered = false;
        textElement.innerHTML = originalText;
        centeredContentElement.style.color = "#00ff00";
      }
    });

    let inst = setInterval(scrambleText, 100);
    // resolve();
  });
};

export default task1;
