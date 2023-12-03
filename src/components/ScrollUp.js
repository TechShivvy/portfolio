import React, { useEffect, useState } from "react";
import styles from "./_ScrollUp.module.css";
import { FaArrowUp } from "react-icons/fa";

function ScrollUp() {
  const [showButton, setShowButton] = useState(false);
  const onScroll = () => {
    setShowButton(window.scrollY > window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  });

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <FaArrowUp
      className={showButton ? styles.showButton : styles.hidden}
      onClick={scrollToTop}
      style={{ color: "black", backgroundColor: "white" }}
    />
  );
}

export default ScrollUp;
