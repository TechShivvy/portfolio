import React, { useEffect, useState } from "react";
import styles from "./_ScrollUp.module.css";
import { FaArrowUp } from "react-icons/fa";

function ScrollUp() {
  const [showButton, setShowButton] = useState(false);
  const onScroll = () => {
    window.scrollY > window.innerHeight ? setShowButton(true) : setShowButton(false);
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
      style={{ color: 'black',backgroundColor:'white',borderRadius: 0 }}
    />
  );
}

export default ScrollUp;
