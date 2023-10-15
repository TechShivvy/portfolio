import React, { useEffect, useState } from "react";
import styles from "./_About.module.css";
import AboutLines from "../utils/about";

function About(props) {
  const [contentElements, setContentElements] = useState([]);
  const { data } = props;
  // useEffect(() => {
  //   const elements = data.map((item, index) => {
  //     const inputP = <p key={`input-${index}`}> &gt; {item.input}</p>;

  //     if (Array.isArray(item.return)) {
  //       const linkArray = item.return.map((link, linkIndex) => (
  //         <a
  //           key={`link-${index}-${linkIndex}`}
  //           href={link.href}
  //           target={link.target ? link.target : ""}
  //           rel={link.rel ? link.rel : ""}
  //         >
  //           {link.text}
  //         </a>
  //       ));

  //       if (linkArray.length > 1) {
  //         return (
  //           <div key={`return-${index}`}>
  //             {inputP}
  //             <p>
  //               [
  //               {linkArray.reduce(
  //                 (prev, curr, linkIndex) => [
  //                   ...prev,
  //                   linkIndex > 0 && ", ",
  //                   curr,
  //                 ],
  //                 []
  //               )}
  //               ]
  //             </p>
  //           </div>
  //         );
  //       } else if (linkArray.length === 1) {
  //         return (
  //           <div key={`return-${index}`}>
  //             {inputP}
  //             {linkArray[0]}
  //           </div>
  //         );
  //       }
  //     } else {
  //       return (
  //         <div key={`return-${index}`}>
  //           {inputP}
  //           <p>{item.return}</p>
  //         </div>
  //       );
  //     }
  //   });

  //   // setContentElements(elements);
  // }, []);

  return (
    <div className={styles["about-section"]} id="about">
      <h2>About</h2>
    <div className={styles["container"]}>
      <p className={styles["para"]}>
        I'm Shivcharan Thirunavukkarasu<br/>
        A <strong> CSE Grad</strong> who codes sometimes. <br/>I'm currently on a
        quest to locate the elusive missing semicolon ;)
      </p>
      </div>
      <div className={styles.fakeMenu}>
        <div className={`${styles.fakeButtons} ${styles.fakeClose}`}/>
        <div className={`${styles.fakeButtons} ${styles.fakeMinimize}`}/>
        <div className={`${styles.fakeButtons} ${styles.fakeZoom}`}/>
      </div>
      <AboutLines data={props.data} />
      {/* <div className={styles.fakeScreen} id="fakeScreen"> */}
        {/* {contentElements} */}
      {/* </div> */}
    </div>
  );
}

export default About;
