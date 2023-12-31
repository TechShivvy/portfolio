import React from "react";
import styles from "../components/_About.module.css";

function AboutLines({ data }) {
  // data=data.aboutData
  return (
    // <div className={styles.fakeScreen} id="fakeScreen">
    // {data.map((item, index) => (
    //     <div key={index}>
    //     <p>{`> ${item.input}`}</p>
    //     {Array.isArray(item.return) ? (
    //         <p>
    //         [
    //         {item.return.map((link, linkIndex) => (
    //             <a
    //             key={linkIndex}
    //             href={link.href}
    //             target={link.target || "_blank"}
    //             rel={link.rel || "noopener"}
    //             >
    //             {link.text}
    //             </a>
    //         ))}
    //         ]
    //         </p>
    //     ) : (
    //         <p>{item.return}</p>
    //     )}
    //     </div>
    // ))}
    // <div>
    //     <p>
    //     {"> "}
    //     <span className={styles.cursor}>&nbsp;</span>
    //     </p>
    // </div>
    // </div>

    <div className={styles.fakeScreen} id="fakeScreen">
      {data.map((item, index) => (
        <div key={index}>
          <p className={styles.lines}>&gt; {item.input}</p>
          {Array.isArray(item.return) ? (
            <p className={styles.lines}>
              {item.return.length > 1 ? "[" : ""}
              {item.return.map((link, linkIndex) => (
                <React.Fragment key={linkIndex}>
                  "<a
                    href={link.href}
                    target={link.target || "_blank"}
                    rel={link.rel || "noopener"}
                  >
                    {link.text}
                  </a>"
                  {linkIndex < item.return.length - 1 ? ", " : ""}
                </React.Fragment>
              ))}
              {item.return.length > 1 ? "]" : ""}
            </p>
          ) : (
            <p className={styles.lines}>{item.return}</p>
          )}
        </div>
      ))}
      <div>
        <p className={styles.lines}>&gt; <span className={styles.cursor}>&nbsp;</span></p>
      </div>
    </div>
  );
}

export default AboutLines;
