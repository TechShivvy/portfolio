import React, { useState, useEffect, useRef } from "react";
import styles from "./_About.module.css";
import AboutLines from "./AboutLines";
import InteractiveTerminal from "./InteractiveTerminal";
import useFadeIn from "../utils/useFadeIn";
import aboutData from "../content/about";
import STACK from "../content/stack";
import { unlock } from "../utils/achievements";

// ─── Spotify mosaic-reveal card ──────────────────────────────────────────────
const COLS = 24;
const ROWS = 20;
const MAX_SUM = (COLS - 1) + (ROWS - 1);
const TILES = Array.from({ length: COLS * ROWS }, (_, idx) => {
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  const chess = (col + row) % 2; // 0 = even, 1 = odd
  const wave = (col + row) / MAX_SUM; // 0 (top-left) .. 1 (bottom-right)
  return { idx, col, row, chess, wave };
});

const HREF     = "https://spotify-github-profile.kittinanx.com/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&redirect=true";
// Two Spotify widget themes with very different natural shapes:
//   default   → 320×445 tall "cover" card  → suits a narrow card
//   novatorem → 320×100 wide "now playing" bar → suits a wide card
const IMG_TALL = "https://spotify-github-profile.kittinanx.com/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&cover_image=true&theme=default&show_offline=false&background_color=transparent&text_color=cdd6f4&icon_color=cba6f7&title_color=94e2d5&interchange=true&bar_color_cover=true";
const IMG_WIDE = "https://spotify-github-profile.kittinanx.com/api/view?uid=2gshy2wa8eeq8clpv8sgghh4p&cover_image=true&theme=novatorem&show_offline=false&background_color=transparent&interchange=true&bar_color=53b14f&bar_color_cover=true";

// Above this rendered card width a tall cover would become unreasonably large,
// so switch to the wide "now playing" bar instead. Driven by the card's actual
// measured width (stable - width is set by the column, not the aspect ratio),
// so it always matches the card's real shape at any zoom or viewport.
const WIDE_THRESHOLD = 420;

function SpotifyMosaic() {
  const cardRef = useRef(null);
  const [hovered, setHovered]     = useState(false);
  // false = follow hover (default); true = pinned revealed (click to stick)
  const [pinned, setPinned]       = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [wide, setWide]           = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      setWide(entry.contentRect.width >= WIDE_THRESHOLD);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Unpin card if clicking outside of it
  useEffect(() => {
    if (!pinned) return;

    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setPinned(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [pinned]);

  const spotifySrc = wide ? IMG_WIDE : IMG_TALL;
  // Match the card's aspect ratio to the chosen theme so the artwork fills it.
  const cardStyle = { aspectRatio: wide ? "320 / 100" : "320 / 445" };

  // Reveal when hovering OR when pinned; pinning just keeps hover's effect locked
  const revealed = pinned || hovered;

  // Click toggles pin: not-pinned → pinned-revealed → not-pinned (hover again) …
  const handleClick = (e) => {
    if (e.target.closest("a")) return; // let link clicks through
    if (!pinned) unlock("now-playing");
    setPinned((prev) => !prev);
  };

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      className={`${styles.mosaicCard} ${pinned ? styles.mosaicCardPinned : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Layer 0 - Spotify image or fallback, always beneath */}
      <div className={styles.mosaicBack}>
        {imgFailed ? (
          <div className={styles.spotifyFallback} aria-label="Spotify unavailable">
            <span className={styles.spotifyFallbackFace}>;-;</span>
            <span className={styles.spotifyFallbackText}>couldn't reach spotify right now</span>
          </div>
        ) : (
          <a href={HREF} target="_blank" rel="noopener noreferrer">
            <img
              src={spotifySrc}
              alt="Spotify Listening Activity"
              onError={() => setImgFailed(true)}
            />
          </a>
        )}
      </div>

      {/* Layer 1 - terminal-style prompt (fades on reveal). Always rendered
          so the dramatic reveal works even when the image failed. */}
      <div className={styles.spotifyFront} style={{ opacity: revealed ? 0 : 1 }}>
        <span className={styles.spotifyPrompt}>&gt; spotify --now-playing</span>
        <span className={styles.spotifyHint}>
          {pinned ? "click to unpin" : "hover / click to reveal"}
        </span>
      </div>

      {/* Layer 2 - mosaic tiles that dissolve away on reveal */}
      {TILES.map(({ idx, col, row, chess, wave }) => (
        <div
          key={idx}
          className={`${styles.mosaicTile} ${chess === 0 ? styles.mosaicTileEven : styles.mosaicTileOdd} ${revealed ? styles.mosaicTileOut : ""}`}
          style={{
            left:   `${(col / COLS) * 100}%`,
            top:    `${(row / ROWS) * 100}%`,
            width:  `${100 / COLS}%`,
            height: `${100 / ROWS}%`,
            transitionDelay: revealed
              ? `${wave * 0.25}s`
              : `${(1 - wave) * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

function About() {
  const fadeRef = useFadeIn();
  // Toggle between dummy (static) and interactive (real) terminal
  const [interactive, setInteractive] = useState(false);
  // hasBooted: true after first activation - skip boot animation on re-opens
  const [hasBooted, setHasBooted] = useState(false);

  const handleToggle = () => {
    if (!interactive) unlock("shell-access");
    setInteractive((prev) => !prev);
  };

  return (
    <div className={styles["about-section"]} id="about" ref={fadeRef}>
      <div className={styles["container"]}>
        <h2 className={styles.h2}>About</h2>
        <div className={styles.gridContainer}>
          <div className={styles.gridItem}>
            <p className={styles["para"]}>
              I'm Shivcharan Thirunavukkarasu. A <strong className="strong">CSE Grad</strong>{" "}
              <span className={styles.diff2Minus}>who</span><span className={styles.diff2Plus}>. MLE2 @ Comcast.</span>{" "}
              codes{" "}
              <span className={styles.diff2Minus}>sometimes</span>{" "}<span className={styles.diff2Plus}>all the time now (unfortunately)</span>.
              {" "}I'm currently on a quest to locate the elusive missing semicolon ;)
            </p>
            <p className={styles["para"]}>
              Outside of work I build things for two reasons that usually show up together:
              something personal annoys me enough that I can't leave it alone, and I'm curious
              what it'd actually take to fix. A Spotify tool because building playlists by hand
              got old. A synchronized YouTube watch party because long-distance movie night was
              three people counting down "3, 2, 1, play" and still desyncing. The ten seconds
              where it first works properly is genuinely the best part of my week - that hit is
              most of why I keep doing this. The easter eggs on this page exist for the same
              reason.
            </p>
            <p className={styles["para"]}>
              At work that's two and a half years at Comcast, mostly on the unglamorous half of
              ML: platform reliability, observability, and the evaluation layer - not training
              models. Right now I build evaluation pipelines for LLM agents - versioned,
              reproducible, running on a schedule against real production transcripts so
              regressions get caught before anyone files a ticket. Before that it was Kubernetes
              upgrades and graceful shutdowns, distributed model serving on Ray, a telemetry
              pipeline in Scala and Spark, load-testing frameworks, and enough Grafana
              dashboards to have strong opinions about them. A lot of the job is deep debugging
              - the kind where the bug turns out to be an event loop three
              systems away from where you started looking.
            </p>

            {/* Fake macOS-style terminal chrome */}
            <div className={styles["fakeMenu"]}>
              <div className={`d-flex ${styles["fakeButtons"]} ${styles["fakeClose"]}`} />
              <div className={`d-flex ${styles["fakeButtons"]} ${styles["fakeMinimize"]}`} />
              <div className={`d-flex ${styles["fakeButtons"]} ${styles["fakeZoom"]}`} />

              {/* Toggle button - sits in the menu bar */}
              <button
                className={`${styles.termToggle} ${interactive ? styles.termToggleActive : ""}`}
                onClick={handleToggle}
                title={interactive ? "Switch to view mode" : "Open interactive terminal"}
                aria-label={interactive ? "Switch to view mode" : "Open interactive terminal"}
              >
                {interactive ? "[ exit ]" : "[ run ]"}
              </button>
            </div>

            <div
              className={`my-5 text-center border-bottom ${styles["fakeScreen"]}`}
              id="fakeScreen"
            >
              {/* Both terminals are always mounted so the container height is
                  the natural max of the two - no fixed pixel anchoring needed.
                  The inactive one is hidden from view and interaction. */}
              <div className={styles.terminalGrid}>
                <div
                  className={interactive ? styles.terminalHidden : undefined}
                  aria-hidden={interactive || undefined}
                >
                  <AboutLines data={aboutData} />
                </div>
                <div
                  className={`${styles.terminalSlot} ${interactive ? "" : styles.terminalHidden}`}
                  aria-hidden={!interactive || undefined}
                >
                  <InteractiveTerminal
                    isActive={interactive}
                    hasBooted={hasBooted}
                    onBooted={() => setHasBooted(true)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.stack}>
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

          <div className={styles.gridItem}>
            <SpotifyMosaic />
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
