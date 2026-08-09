import React, { useState } from "react";
import styles from "./_Work.module.css";
import WORK from "../content/work";
import STACK from "../content/stack";
import useFadeIn from "../utils/useFadeIn";

const KEYS = ["evals", "platform", "data", "mlops", "devops"];

export default function Work() {
  const fadeRef = useFadeIn();
  const [active, setActive] = useState(KEYS[0]);
  const item = WORK[active];

  return (
    <section className={styles.section} id="work" ref={fadeRef}>
      <div className={styles.container}>
        <h2 className={styles.h2}>Work</h2>
        <p className={styles.subheading}>$ cat ~/work/*.md</p>

        {/* Tab strip */}
        <nav className={styles.tabs} aria-label="Work areas">
          {KEYS.map((key) => (
            <button
              key={key}
              className={`${styles.tab} ${active === key ? styles.tabActive : ""}`}
              onClick={() => setActive(key)}
              aria-current={active === key ? "true" : undefined}
            >
              <span className={styles.tabIcon}>{WORK[key].icon}</span>
              <span className={styles.tabLabel}>{WORK[key].label}</span>
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

          {/* Stack footer - grouped tech pills, part of the same card group */}
          <div className={styles.stackFooter}>
            <span className={styles.stackHeading}>&gt; stack --grouped</span>
            {STACK.map(({ label, items }) => (
              <div className={styles.stackRow} key={label}>
                <span className={styles.stackLabel}>{label}</span>
                <div className={styles.stackPills}>
                  {items.map((it) => (
                    <span className={styles.stackPill} key={it}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
