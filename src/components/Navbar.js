import React, { useState, useEffect } from "react";
import styles from "./_Navbar.module.css";

function Navbar() {
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    function showNavbar() {
      setIsNavbarVisible(window.scrollY > window.innerHeight);
    }

    function updateWindowWidth() {
      setWindowWidth(window.innerWidth);
    }

    updateWindowWidth();
    showNavbar();

    window.addEventListener("scroll", showNavbar);
    window.addEventListener("resize", showNavbar);
    window.addEventListener("resize", updateWindowWidth);

    return () => {
      window.removeEventListener("scroll", showNavbar);
      window.removeEventListener("resize", showNavbar);
      window.removeEventListener("resize", updateWindowWidth);
    };
  }, []);

  return (
    <nav
      className={`${styles.navbar} ${isNavbarVisible && windowWidth >= 768 ? styles.navbarVisible : ""}`}
      id="navbar"
    >
      <ul>
        <li>
          <a href="#home">&nbsp;home&nbsp;</a>
        </li>
        <li>
          <a href="#about">&nbsp;about&nbsp;</a>
        </li>
        <li>
          <a href="#timeline">&nbsp;timeline&nbsp;</a>
        </li>
        <li>
          <a href="#projects">&nbsp;projects&nbsp;</a>
        </li>
        <li>
          <a href="#beyond-code">&nbsp;beyond&nbsp;</a>
        </li>
        <li>
          <a href="#contact">&nbsp;contact&nbsp;</a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
