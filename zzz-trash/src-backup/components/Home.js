import React, { useEffect } from "react";
import styles from "./_Home.module.css";
import task1 from "../tasks/task1";
import task2 from "../tasks/task2";

function Home() {
  useEffect(() => {
    task1().then(() => {
      task2();
    });

    return () => {};
  }, []);

  return (
    <div className={styles["home-section"]} id="home">
      <canvas id="matrix" />
      <div className={styles["centered-content"]}>
        <h1 id="hackerText">S h i v c h a r a n</h1>
      </div>
    </div>
  );
}

export default Home;
