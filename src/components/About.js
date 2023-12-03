import React from "react";
import styles from "./_About.module.css";
import AboutLines from "../utils/about";

function About(props) {
  return (
    // <div className={styles["about-section"]} id="about">
    //   <div className={styles["container"]}>
    //     <h2 className="h2">About</h2>
    //     <p className={styles["para"]}>
    //       I'm Shivcharan Thirunavukkarasu. A <strong className="text-success">CSE Grad</strong> who codes sometimes. I'm currently on a quest to locate the elusive missing semicolon ;)
    //     </p>
    //     <div className={styles["fakeMenu"]}>
    //       <div className={`d-flex ${styles["fakeButtons"]} ${styles["fakeClose"]}`}></div>
    //       <div className={`d-flex ${styles["fakeButtons"]} ${styles["fakeMinimize"]}`}></div>
    //       <div className={`d-flex ${styles["fakeButtons"]} ${styles["fakeZoom"]}`}></div>
    //     </div>
    //     <div className={`px-4 pt-5 my-5 text-center border-bottom ${styles["fakeScreen"]}`} id="fakeScreen">
    //       <AboutLines data={props.data} />
    //     </div>
    //   </div>
    // </div>
    <div className={styles["about-section"]} id="about">
      <div className={styles["container"]}>
        <h2 className={styles.h2}>About</h2>
        <div className={styles.gridContainer}>
          <div className={styles.gridItem}>
            <p className={styles["para"]}>
              I'm Shivcharan Thirunavukkarasu. A{" "}
              <strong className="strong">CSE Grad</strong> who codes
              sometimes. I'm currently on a quest to locate the elusive missing
              semicolon ;)
            </p>
            <div className={styles["fakeMenu"]}>
              <div
                className={`d-flex ${styles["fakeButtons"]} ${styles["fakeClose"]}`}
              ></div>
              <div
                className={`d-flex ${styles["fakeButtons"]} ${styles["fakeMinimize"]}`}
              ></div>
              <div
                className={`d-flex ${styles["fakeButtons"]} ${styles["fakeZoom"]}`}
              ></div>
            </div>
            <div
              className={`px-4 pt-5 my-5 text-center border-bottom ${styles["fakeScreen"]}`}
              id="fakeScreen"
            >
              <AboutLines data={props.data} />
            </div>
          </div>
          <div className={styles.gridItem}>
            <a
              href="https://spotify-github-profile.vercel.app/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&redirect=true"
              className={styles["default-link"]}
            >
              <img src="https://spotify-github-profile.vercel.app/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&cover_image=true&theme=default&show_offline=false&background_color=transparent&text_color=cdd6f4&icon_color=cba6f7&title_color=94e2d5&interchange=true&bar_color_cover=true" />
            </a>

            <a
              href="https://spotify-github-profile.vercel.app/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&redirect=true"
              className={styles["mobile-link"]}
            >
              <img src="https://spotify-github-profile.vercel.app/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&cover_image=true&theme=natemoo-re&show_offline=false&background_color=121212&interchange=true&bar_color=53b14f&bar_color_cover=false" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
