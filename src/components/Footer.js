import React from "react";
import styles from "./_Footer.module.css";
function Footer() {
  return (
    <footer>
      <div className={styles["footer-content"]}>
        <p>
          Made by <span className={styles["hover-text"]} /> &copy; 2023 | All
          Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
