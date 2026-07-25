import React from "react";
import styles from "./_Footer.module.css";
function Footer() {
  const startYear = 2024;
  const currentYear = new Date().getFullYear();
  const yearRange =
    currentYear > startYear ? `${startYear}\u2013${currentYear}` : `${startYear}`;
  return (
    <footer>
      <div className={styles["footer-content"]}>
        <p>
          Made by <span className={styles["hover-text"]} /> &copy; {yearRange} |
          All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export default Footer;
