import React from "react";
import styles from "./_Error404.module.css"

const Error404 = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>404 </h1>
      <h2 className={styles.h2}>You just hit a route that doesn't exist...<br/> the sadness.</h2>
    </div>
  );
};

export default Error404;
