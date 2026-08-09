import React, { useState } from "react";
import styles from "./_Footer.module.css";
import { unlock } from "../utils/achievements";

function Footer() {
  const startYear = 2024;
  const currentYear = new Date().getFullYear();
  const yearRange =
    currentYear > startYear ? `${startYear}\u2013${currentYear}` : `${startYear}`;
  // The reveal itself was pure CSS :hover, with zero touch equivalent - same
  // class of bug as identity-crisis (scramble.js) before that fix. A tap
  // toggles this instead, and the CSS below reads it the same way :hover.
  const [touchRevealed, setTouchRevealed] = useState(false);
  return (
    <footer>
      <div className={styles["footer-content"]}>
        <p>
          Made by{" "}
          <span
            className={`${styles["hover-text"]} ${touchRevealed ? styles["revealed"] : ""}`}
            onMouseEnter={() => unlock("who-made-this")}
            onTouchStart={() => {
              unlock("who-made-this");
              setTouchRevealed((v) => !v);
            }}
          />{" "}
          &copy; {yearRange} | All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
