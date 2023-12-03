import styles from "./../components/_Home.module.css";

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

  console.log(hasRun)
  if (hasRun) {
    // sessionStorage.setItem("hasRunOnce", "true");
    isAnimationComplete = true;
    centeredContentElement.style.color = "#2ba2a2";
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

    // console.log(text);

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
        console.log("'" + textElement.innerHTML + "'");
      } else {
        isAnimationComplete = true;
        centeredContentElement.style.color = "#2ba2a2";
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
        isHovered = true;
        clearInterval(inst);
        centeredContentElement.style.color = "#a22b2b";
        inst = setInterval(scrambleTextEndless, 100);
      }
    });

    textElement.addEventListener("mouseout", () => {
      if (isAnimationComplete) {
        isHovered = false;
        textElement.innerHTML = originalText;
        centeredContentElement.style.color = "#2ba2a2";
      }
    });

    let inst = !hasRun?setInterval(scrambleText, 100):resolve();
    // resolve();
  });
};

export default task1;

