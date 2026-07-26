import React, { useState } from "react";
import styles from "./_Timeline.module.css";
import useFadeIn from "../utils/useFadeIn";
import timelineData from "../content/timeline";

function Timeline() {
  const fadeRef = useFadeIn();
  const [openHash, setOpenHash] = useState(null);

  const toggle = (hash) =>
    setOpenHash((prev) => (prev === hash ? null : hash));

  return (
    <div className={styles.timelineSection} id="timeline" ref={fadeRef}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Timeline</h2>
        <p className={styles.subheading}>$ git log --oneline --graph career</p>
        <div className={styles.log}>
          {timelineData.map((entry) => (
            <div
              className={styles.entry}
              key={entry.hash}
              onClick={() => entry.body && toggle(entry.hash)}
            >
              <div className={styles.graph}>
                <div className={styles.node} />
              </div>
              <div className={styles.details}>
                <div className={styles.commitLine}>
                  <span className={styles.hash}>{entry.hash}</span>
                  {entry.tag && (
                    <span className={styles.tag}>({entry.tag})</span>
                  )}
                  {entry.body && (
                    <span
                      className={`${styles.chevron}${
                        openHash === entry.hash ? ` ${styles.chevronOpen}` : ""
                      }`}
                    >
                      ▶
                    </span>
                  )}
                </div>
                <p className={styles.message}>{entry.message}</p>
                <p className={styles.date}>Date: {entry.date}</p>
                {openHash === entry.hash && entry.body && (
                  <div className={styles.entryBody}>
                    {Array.isArray(entry.body)
                      ? entry.body.map((pt, i) => (
                          <p key={i} className={styles.bodyPoint}>{pt}</p>
                        ))
                      : entry.body}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
