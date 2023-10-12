import React from "react";
import yourImage from "./work-progress.png"
import styles from "./_Construction.module.css"; // Import your CSS file

function Construction() {
  return (
    <div className={styles.section}>
      <img
        src={yourImage}
        alt="Work in progress"
        className={styles["centered-image"]}
      />
    </div>
  );
}

export default Construction;
