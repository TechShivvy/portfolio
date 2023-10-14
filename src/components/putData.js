import React from "react";
import styles from "./_About.module.css";

function FormatAndAppendData({ data }) {
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
          <p>&gt; {item.input}</p>
          {Array.isArray(item.return) ? (
            <p>
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
            <p>{item.return}</p>
          )}
        </div>
      ))}
      <div>
        <p>&gt; <span className={styles.cursor}>&nbsp;</span></p>
      </div>
    </div>
  );
}

export default FormatAndAppendData;
