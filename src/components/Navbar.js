import React, { useState, useEffect } from "react";
import styles from "./_Navbar.module.css";

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
