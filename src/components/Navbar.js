import React, { useState, useEffect } from "react";
import styles from "./_Navbar.module.css";
import Progressbar from "./Progressbar";

function Navbar() {
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  useEffect(() => {
    function showNavbar() {
      setIsNavbarVisible(window.scrollY > window.innerHeight);
    }

    showNavbar();
    window.addEventListener("scroll", showNavbar);
    window.addEventListener("resize", showNavbar);

    return () => {
      window.removeEventListener("scroll", showNavbar);
      window.removeEventListener("resize", showNavbar);
    };
  }, []);

  return (
    <nav
      className={`${styles.navbar} ${isNavbarVisible ? styles.navbarVisible : ""}`}
      id="navbar"
    >
      <ul>
        <li>
          <a href="#home">
            &nbsp;<span className={styles.full}>home</span><span className={styles.short}>home</span>&nbsp;
          </a>
        </li>
        <li>
          <a href="#about">
            &nbsp;<span className={styles.full}>about</span><span className={styles.short}>about</span>&nbsp;
          </a>
        </li>
        <li>
          <a href="#timeline">
            &nbsp;<span className={styles.full}>timeline</span><span className={styles.short}>log</span>&nbsp;
          </a>
        </li>
        <li>
          <a href="#work">
            &nbsp;<span className={styles.full}>work</span><span className={styles.short}>work</span>&nbsp;
          </a>
        </li>
        <li>
          <a href="#projects">
            &nbsp;<span className={styles.full}>projects</span><span className={styles.short}>proj</span>&nbsp;
          </a>
        </li>
        <li>
          <a href="#beyond-code">
            &nbsp;<span className={styles.full}>beyond</span><span className={styles.short}>beyond</span>&nbsp;
          </a>
        </li>
        <li>
          <a href="#contact">
            &nbsp;<span className={styles.full}>contact</span><span className={styles.short}>mail</span>&nbsp;
          </a>
        </li>
      </ul>
      {/* Lives inside the nav so it can anchor to the navbar's bottom edge via
          top:100% instead of a JS-measured offset — see _Progressbar.module.css. */}
      <Progressbar />
    </nav>
  );
}

export default Navbar;
