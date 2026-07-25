import React, { useState } from "react";
import styles from "./_BeyondCode.module.css";
import INTERESTS from "../content/interests";
import useFadeIn from "../utils/useFadeIn";

const KEYS = ["games", "anime", "cycling", "rubik", "tech", "music"];

export default function BeyondCode() {
  const fadeRef = useFadeIn();
  const [active, setActive] = useState(KEYS[0]);
  const item = INTERESTS[active];

  return (
    <section className={styles.section} id="beyond-code" ref={fadeRef}>
      <div className={styles.container}>
        <h2 className={styles.h2}>Beyond Code</h2>

        {/* Tab strip */}
        <nav className={styles.tabs} aria-label="Interest categories">
          {KEYS.map((key) => (
            <button
              key={key}
              className={`${styles.tab} ${active === key ? styles.tabActive : ""}`}
              onClick={() => setActive(key)}
              aria-current={active === key ? "true" : undefined}
            >
              <span className={styles.tabIcon}>{INTERESTS[key].icon}</span>
              <span className={styles.tabLabel}>{INTERESTS[key].label}</span>
            </button>
          ))}
        </nav>

        {/* Content card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>{item.icon}</span>
            <span className={styles.cardTitle}>{item.label}</span>
          </div>
          <p className={styles.cardBlurb}>{item.blurb}</p>
          <ul className={styles.list}>
            {item.favorites.map((f, i) => {
              // Lines that start with // are pure comments; others may have // mid-line
              const commentStart = f.indexOf(' // ');
              const isFullComment = f.startsWith('//');
              if (isFullComment) {
                return (
                  <li key={i} className={`${styles.listItem} ${styles.listItemComment}`}>
                    {f}
                  </li>
                );
              }
              if (commentStart !== -1) {
                return (
                  <li key={i} className={styles.listItem}>
                    &gt; {f.slice(0, commentStart)}
                    <span className={styles.listComment}>{f.slice(commentStart)}</span>
                  </li>
                );
              }
              return <li key={i} className={styles.listItem}>&gt; {f}</li>;
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
