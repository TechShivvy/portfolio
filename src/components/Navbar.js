import React, { useState, useEffect } from "react";
import styles from "./_Navbar.module.css";
import $ from "jquery"; // Import jQuery

function Navbar() {
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Function to show the navbar when scrolling down
    function showNavbar() {
      if (window.scrollY > window.innerHeight) {
        setIsNavbarVisible(true);
        $("#navbar").slideDown(250);
      } else {
        setIsNavbarVisible(false);
        // $("#navbar, #progress-container").slideUp(250);
      }
    }

    function updateWindowWidth() {
      setWindowWidth(window.innerWidth);
    }

    updateWindowWidth();
    // Add an event listener to the window's scroll event
    window.addEventListener("scroll", showNavbar);
    window.addEventListener("resize", updateWindowWidth);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", updateWindowWidth);
      window.removeEventListener("scroll", showNavbar);
    };
  }, []); // Empty dependency array to run the effect only once

  return (
    <nav
      className={styles.navbar}
      // style={
      //   isNavbarVisible ? { visibility: "visible" } : { visibility: "hidden" }
      // }
      id="navbar"
      style={
        isNavbarVisible && windowWidth >= 768
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
