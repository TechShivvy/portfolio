import React, { useState, useEffect } from "react";
import styles from "./_Navbar.module.css";
import $ from "jquery";

function Navbar() {
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    function showNavbar() {
      if (window.scrollY > window.innerHeight) {
        setIsNavbarVisible(true);
        $("#navbar").fadeIn(300);
      } else {
        setIsNavbarVisible(false);
        $("#navbar").fadeOut(0);
        // $("#navbar, #progress-container").slideUp(250);
      }
    }

    function updateWindowWidth() {
      setWindowWidth(window.innerWidth);
    }

    updateWindowWidth();

    $(window).on("scroll resize", showNavbar);
    $(window).on("resize", updateWindowWidth);

    return () => {
      $(window).off("scroll resize", showNavbar);
      $(window).off("resize", updateWindowWidth);
    };
  }, []);

  return (
    <nav
      className={styles.navbar}
      // style={
      //   isNavbarVisible ? { visibility: "visible" } : { visibility: "hidden" }
      // }
      id="navbar"
      style={
        windowWidth >= 768
          ? { visibility: "visible" }
          : { visibility: "hidden" }
      }
    >
      <ul>
        <li>
          <a href="#home">&nbsp;home&nbsp;</a>
        </li>
        <li>
          <a href="#about">&nbsp;about&nbsp;</a>
        </li>
        <li>
          <a href="#projects">&nbsp;projects&nbsp;</a>
        </li>
        <li>
          <a href="#contact">&nbsp;contact&nbsp;</a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
