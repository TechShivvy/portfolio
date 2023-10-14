import React from "react";
import styles from "./_About.module.css"; // Import the CSS module

function About() {
  return (
    <div className={styles.aboutSection} id="about">
      {" "}
      {/* Use the CSS module class name */}
      <h2>About Me</h2>
      <p>
        A <strong> CSE Grad</strong> who codes sometimes. I'm currently on a
        quest to locate the elusive missing semicolon ;)
      </p>
      <div className={styles.fakeMenu}>
        {" "}
        {/* Use the CSS module class name */}
        <div className={`${styles.fakeButtons} ${styles.fakeClose}`}></div>{" "}
        {/* Use multiple class names */}
        <div
          className={`${styles.fakeButtons} ${styles.fakeMinimize}`}
        ></div>{" "}
        {/* Use multiple class names */}
        <div className={`${styles.fakeButtons} ${styles.fakeZoom}`}></div>{" "}
        {/* Use multiple class names */}
      </div>
      <div className={styles.fakeScreen} id="fakeScreen">
        sgddddddddddd
      </div>
    </div>
  );
}

export default About;
