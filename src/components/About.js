import React, { useEffect, useState } from "react";
import styles from "./_About.module.css"; // Import the CSS module
import FormatAndAppendData from "./putData";

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
      <h2>About Me</h2>
      <p>
        A <strong> CSE Grad</strong> who codes sometimes. I'm currently on a
        quest to locate the elusive missing semicolon ;)
      </p>
      <div className={styles.fakeMenu}>
        <div className={`${styles.fakeButtons} ${styles.fakeClose}`}></div>
        <div className={`${styles.fakeButtons} ${styles.fakeMinimize}`}></div>
        <div className={`${styles.fakeButtons} ${styles.fakeZoom}`}></div>
      </div>
      <FormatAndAppendData data={props.data} />
      {/* <div className={styles.fakeScreen} id="fakeScreen"> */}
        {/* {contentElements} */}
      {/* </div> */}
    </div>
  );
}

export default About;
