// Exit 8 — seamless corridor loop + anomaly detection game
// Exports a factory function that returns a game instance with full cleanup

export default function startExit8({ setLines, inputRef, rootEl, onQuit }) {
  // Guard: prevent concurrent game instances
  if (startExit8._active) return { teardown: () => {} };
  startExit8._active = true;

  const st = {
    score: 0, clones: [], cloneMatrixRafs: [],
    lastCorridor: 0, corridorFoundAnomaly: false,
    scrollingBack: false, cancelBackScroll: null,
    anomalyActive: false, removeEffect: null, expireTimer: null,
    anomalyFiredThisCorridor: false, isCurrentCorridorClean: true,
    anomalyTriggerY: Infinity, scorePredictedThisCorridor: false, verdictLocked: false,
    _lastForwardT: null,
  };

  // ── Global style overrides ────────────────────────────────────────
  document.documentElement.style.scrollBehavior = "auto";
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
  document.body.style.height = "auto";
  rootEl.style.height = "auto";

  // Progress bar → white
  const progressEl = document.querySelector('[class*="progress-container"]');
  if (progressEl) {
    st.progressEl = progressEl;
    progressEl.style.background = "#fff";
    const progressBarEl = progressEl.querySelector('[class*="progress-bar"]');
    if (progressBarEl) {
      st.progressBarEl = progressBarEl;
      progressBarEl.style.background = "transparent";
    }
  }

  // Hero text as score display
  const heroEl = document.getElementById("hackerText");
  st.heroEl = heroEl;
  st.heroOrig = heroEl ? heroEl.textContent : null;
  if (heroEl) {
    heroEl.textContent = "0 ↓";
    heroEl.style.color = "#2ba2a2";
    heroEl.style.pointerEvents = "none";
    if (heroEl.parentElement) heroEl.parentElement.style.zIndex = "1";
  }

  window.scrollTo(0, 0);
  const rootHeight = rootEl.offsetHeight;
  st.rootHeight = rootHeight;

  // ── Effects array (mobile-safe vs heavy) ──────────────────────────
  const _isMobile =
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) ||
    window.innerWidth < 768;

  const EFFECTS_SAFE = [
    (t) => { t.style.filter = "invert(1)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "sepia(1) saturate(4) hue-rotate(300deg)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "saturate(0) contrast(6) brightness(1.8)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "blur(6px) saturate(0)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "invert(0.6) hue-rotate(100deg) saturate(3)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "contrast(20) brightness(0.3)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "hue-rotate(180deg) saturate(5)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.filter = "brightness(8)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.transform = "scaleX(-1)"; return () => { t.style.transform = ""; }; },
    (t) => { t.style.transform = "scaleY(-1)"; return () => { t.style.transform = ""; }; },
    (t) => { t.style.filter = "hue-rotate(260deg) saturate(15) brightness(1.1)"; return () => { t.style.filter = ""; }; },
    (t) => { t.style.fontFamily = '"Comic Sans MS",cursive'; return () => { t.style.fontFamily = ""; }; },
  ];

  const EFFECTS_HEAVY = [
    (t) => { t.style.transform = "rotate(5deg) scale(1.1)"; return () => { t.style.transform = ""; }; },
    (t) => {
      const s = document.createElement("style");
      s.id = "_exit8shake";
      s.textContent = "@keyframes _e8s{0%,100%{transform:translateX(0)}25%{transform:translateX(-14px)}75%{transform:translateX(14px)}}";
      document.head.appendChild(s);
      t.style.animation = "_e8s 0.1s ease-in-out infinite";
      return () => { t.style.animation = ""; s.remove(); };
    },
  ];

  const EFFECTS = _isMobile ? EFFECTS_SAFE : [...EFFECTS_SAFE, ...EFFECTS_HEAVY];

  // ── Clone factory ─────────────────────────────────────────────────
  const createAndAppendClone = () => {
    const snapEls = Array.from(rootEl.querySelectorAll("*"));
    snapEls.forEach((el) => {
      const pos = getComputedStyle(el).position;
      if (pos === "fixed" || pos === "sticky") el.setAttribute("data-e8fx", "");
    });

    const c = rootEl.cloneNode(true);
    c.removeAttribute("id");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "margin:0;pointer-events:none;";

    c.querySelectorAll("*").forEach((el) => {
      if (el.style && el.style.opacity === "0") {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }
    });

    // Canvas matrix animation
    const _origCanvas = rootEl.querySelector("canvas");
    const _cloneCanvas = c.querySelector("canvas");
    if (_origCanvas && _cloneCanvas) {
      _cloneCanvas.width = _origCanvas.width;
      _cloneCanvas.height = _origCanvas.height;
      const _ctx = _cloneCanvas.getContext("2d");
      if (_ctx) {
        const _chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const _fs = 14;
        const _cols = Math.floor(_cloneCanvas.width / _fs) + 10;
        const _drops = Array.from({ length: _cols }, () => Math.floor(Math.random() * (_cloneCanvas.height / _fs)));

        let _mRafId;
        const _drawMatrix = () => {
          _ctx.fillStyle = "rgba(0,0,0,0.05)";
          _ctx.fillRect(0, 0, _cloneCanvas.width, _cloneCanvas.height);
          _ctx.fillStyle = "#626e5e";
          _ctx.font = `${_fs}px monospace`;
          for (let _i = 0; _i < _drops.length; _i++) {
            _ctx.fillText(_chars[Math.floor(Math.random() * _chars.length)], _i * _fs, _drops[_i] * _fs);
            if (_drops[_i] * _fs > _cloneCanvas.height && Math.random() > 0.975) _drops[_i] = 0;
            _drops[_i]++;
          }
          _mRafId = requestAnimationFrame(_drawMatrix);
        };
        _mRafId = requestAnimationFrame(_drawMatrix);
        st.cloneMatrixRafs.push(() => cancelAnimationFrame(_mRafId));
      }
    }

    c.querySelectorAll("[data-e8fx]").forEach((el) => el.remove());
    snapEls.forEach((el) => el.removeAttribute("data-e8fx"));

    const ch = c.querySelector("#hackerText");
    if (ch) {
      ch.textContent = `${st.score} ↓`;
      ch.style.color = "#2ba2a2";
      if (ch.parentElement) ch.parentElement.style.zIndex = "1";
    }

    document.body.appendChild(c);
    st.clones.push(c);
    return c;
  };

  createAndAppendClone();

  // ── Score UI ──────────────────────────────────────────────────────
  const updateScoreUI = () => {
    const scoreEl = document.getElementById("_exit8score");
    if (scoreEl) scoreEl.textContent = `[${st.score}/8]`;
    if (st.heroEl) {
      st.heroEl.textContent = `${st.score} ↓`;
      st.heroEl.style.color = "#2ba2a2";
    }
    (st.clones || []).forEach((c) => {
      const ch = c.querySelector("#hackerText");
      if (ch) {
        ch.textContent = `${st.score} ↓`;
        ch.style.color = "#2ba2a2";
      }
    });
  };

  // ── Scroll-back animation ─────────────────────────────────────────
  const scrollBack = (corridorEl) => {
    st.cancelBackScroll?.();
    st.scrollingBack = true;
    st._lastForwardT = null;

    let backRaf;
    const tick = () => {
      const top = corridorEl.getBoundingClientRect().top;
      if (top >= -3) {
        if (top < 0) window.scrollTo(0, Math.round(window.scrollY + top));
        st.scrollingBack = false;
        st.cancelBackScroll = null;
        return;
      }
      const stepPx = Math.max(4, Math.min(60, Math.round(-top * 0.35)));
      window.scrollTo(0, window.scrollY - stepPx);
      backRaf = requestAnimationFrame(tick);
    };
    backRaf = requestAnimationFrame(tick);
    st.cancelBackScroll = () => {
      cancelAnimationFrame(backRaf);
      st.scrollingBack = false;
    };
  };

  // ── Corridor geometry helpers ──────────────────────────────────────
  const corridorElFor = (idx) => (idx === 0 ? rootEl : (st.clones[idx - 1] || rootEl));
  const corridorRealTop = (idx) => corridorElFor(idx).getBoundingClientRect().top + window.scrollY;
  const currentCorridorIdx = () => {
    let idx = 0;
    for (let i = 0; i < st.clones.length; i++) {
      if (st.clones[i].getBoundingClientRect().top <= 1) idx = i + 1;
      else break;
    }
    return idx;
  };

  // ── Per-corridor anomaly reset ────────────────────────────────────
  const resetForCorridor = (corridorIdx) => {
    const isClean = Math.random() < 0.3;
    st.isCurrentCorridorClean = isClean;
    st.anomalyFiredThisCorridor = false;
    st.scorePredictedThisCorridor = false;
    st.verdictLocked = false;
    st.anomalyTriggerY = isClean
      ? Infinity
      : corridorRealTop(corridorIdx) + (0.1 + Math.random() * 0.3) * st.rootHeight;
  };

  // ── Lock the verdict ───────────────────────────────────────────────
  const lockCorridorVerdict = () => {
    if (st.verdictLocked) return false;
    st.verdictLocked = true;

    if (st.isCurrentCorridorClean) {
      st.score = Math.min(st.score + 1, 9);
      updateScoreUI();
    } else if (st.anomalyFiredThisCorridor) {
      st.score = 0;
      updateScoreUI();
      setLines((l) => [...l, { text: ">> anomaly missed — reset.", type: "danger" }]);
    }

    if (st.anomalyActive) {
      if (st.expireTimer) {
        clearTimeout(st.expireTimer);
        st.expireTimer = null;
      }
      st.removeEffect?.();
      st.anomalyActive = false;
      st.removeEffect = null;
    }

    return st.score >= 9;
  };

  // ── Anomaly check ─────────────────────────────────────────────────
  const triggerAnomalyCheck = () => {
    const currentCorridor = currentCorridorIdx();
    const corridorEl = corridorElFor(currentCorridor);

    if (st.expireTimer) {
      clearTimeout(st.expireTimer);
      st.expireTimer = null;
    }
    if (st.anomalyActive) {
      st.removeEffect?.();
      st.anomalyActive = false;
      st.removeEffect = null;
    }

    if (st.anomalyFiredThisCorridor && !st.verdictLocked) {
      st.score = Math.min(st.score + 1, 9);
      updateScoreUI();
      if (st.score >= 9) {
        winGame();
        return;
      }
      setLines((prev) => [...prev, {
        text: `>> anomaly spotted — exit ${st.score} clear. [${st.score}/8]`,
        type: "accent",
      }]);
    } else {
      const hadProgress = st.score > 0;
      if (hadProgress) {
        st.score = 0;
        updateScoreUI();
      }
      setLines((prev) => [...prev, {
        text: hadProgress ? ">> false alarm — reset." : ">> nothing here. keep walking.",
        type: hadProgress ? "danger" : "output",
      }]);
    }

    resetForCorridor(currentCorridor);
    scrollBack(corridorEl);
  };

  // ── Teardown ───────────────────────────────────────────────────────
  const teardown = () => {
    if (st.scrollRafId) {
      cancelAnimationFrame(st.scrollRafId);
      st.scrollRafId = null;
    }
    st.cancelBackScroll?.();
    if (st.expireTimer) {
      clearTimeout(st.expireTimer);
      st.expireTimer = null;
    }
    if (st.anomalyActive && st.removeEffect) {
      st.removeEffect();
    }

    if (st.heroEl) {
      if (st.heroOrig != null) st.heroEl.textContent = st.heroOrig;
      st.heroEl.style.pointerEvents = "";
      st.heroEl.style.color = "";
      if (st.heroEl.parentElement) st.heroEl.parentElement.style.zIndex = "";
    }

    (st.cloneMatrixRafs || []).forEach((cancel) => cancel());
    (st.clones || []).forEach((c) => {
      try {
        document.body.removeChild(c);
      } catch (_) {}
    });

    if (st.progressEl) st.progressEl.style.backgroundColor = "";
    if (st.progressBarEl) st.progressBarEl.style.background = "";
    if (st.scrollUpEl) {
      st.scrollUpEl.style.visibility = "";
      st.scrollUpEl.style.pointerEvents = "";
    }

    if (st.anomalyBtn) {
      try {
        document.body.removeChild(st.anomalyBtn);
      } catch (_) {}
    }
    if (st.exitBtn) {
      try {
        document.body.removeChild(st.exitBtn);
      } catch (_) {}
    }

    if (st.keyHandler) document.removeEventListener("keydown", st.keyHandler);
    if (st.preventScroll) {
      document.removeEventListener("wheel", st.preventScroll);
      document.removeEventListener("touchmove", st.preventScroll);
    }

    rootEl.style.filter = "";
    rootEl.style.transform = "";
    rootEl.style.fontFamily = "";
    rootEl.style.animation = "";
    rootEl.style.height = "";
    document.body.style.height = "";
    document.documentElement.style.scrollBehavior = "";
    document.documentElement.style.overflowX = "";
    document.body.style.overflowX = "";

    startExit8._active = false;
  };

  // ── Win sequence ───────────────────────────────────────────────────
  const winGame = () => {
    const escapedHeroEl = st.heroEl;
    const heroOrigText = st.heroOrig ?? "SHIVCHARAN";
    teardown();

    if (escapedHeroEl) {
      const WITTY = ["Damn you made it.", "u escaped bruv.", "u broke da loop.", "EXIT 8 CLEAR.", "congratulations."];
      const idx = Math.floor(Math.random() * WITTY.length);
      let active = true;

      requestAnimationFrame(() => {
        escapedHeroEl.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      const winStyle = document.createElement("style");
      winStyle.id = "_e8winStyle";
      winStyle.textContent = "@keyframes _e8winSlide{from{opacity:0;transform:translateX(-50px)}to{opacity:1;transform:translateX(0)}}";
      document.head.appendChild(winStyle);

      escapedHeroEl.style.animation = "none";
      void escapedHeroEl.offsetHeight;
      escapedHeroEl.textContent = WITTY[idx];
      escapedHeroEl.style.color = "#2ba2a2";
      escapedHeroEl.style.animation = "_e8winSlide 0.5s ease forwards";

      const restoreHero = () => {
        if (!active) return;
        active = false;
        clearTimeout(focusTimer);
        escapedHeroEl.textContent = heroOrigText;
        escapedHeroEl.style.color = "";
        escapedHeroEl.style.animation = "";
        winStyle.remove();
      };

      let focusTimer = setTimeout(() => {
        if (!active) return;
        active = false;
        escapedHeroEl.textContent = heroOrigText;
        escapedHeroEl.style.color = "";
        escapedHeroEl.style.animation = "";
        winStyle.remove();
        if (inputRef?.current) {
          inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          inputRef.current.focus({ preventScroll: true });
        }
      }, 4000);

      setTimeout(() => {
        document.addEventListener("mousemove", restoreHero, { once: true });
        document.addEventListener("pointerdown", restoreHero, { once: true });
        document.addEventListener("touchmove", restoreHero, { once: true });
      }, 500);
    }

    setLines((prev) => [...prev, { text: ">> you made it out. congrats :)", type: "accent" }]);
  };

  // ── Controls ───────────────────────────────────────────────────────
  const scrollUpEl = document.querySelector('[aria-label="Scroll to top"]');
  if (scrollUpEl) {
    st.scrollUpEl = scrollUpEl;
    scrollUpEl.style.visibility = "hidden";
    scrollUpEl.style.pointerEvents = "none";
  }

  const anomalyBtn = document.createElement("button");
  anomalyBtn.id = "_exit8anomalyBtn";
  anomalyBtn.textContent = "!";
  anomalyBtn.title = "Report anomaly (Enter)";
  anomalyBtn.style.cssText = "position:fixed;bottom:24px;right:24px;width:42px;height:42px;z-index:99998;background:#2ba2a2;border:1px solid #2ba2a2;border-radius:50%;color:#000;font-weight:900;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono,monospace);";
  anomalyBtn.addEventListener("click", triggerAnomalyCheck);
  document.body.appendChild(anomalyBtn);
  st.anomalyBtn = anomalyBtn;

  const exitBtn = document.createElement("button");
  exitBtn.id = "_exit8exitBtn";
  exitBtn.textContent = "EXIT";
  exitBtn.title = "Quit corridor (Esc)";
  exitBtn.style.cssText = "position:fixed;bottom:24px;left:-120px;z-index:99998;background:#a22b2b;border:1px solid #a22b2b;color:#fff;padding:0 18px;height:42px;cursor:pointer;font-family:var(--font-mono,monospace);font-size:13px;transition:left 0.4s cubic-bezier(0.22,0.61,0.36,1);border-radius:4px;";
  exitBtn.addEventListener("click", () => {
    teardown();
    onQuit?.();
  });
  document.body.appendChild(exitBtn);
  st.exitBtn = exitBtn;
  setTimeout(() => {
    exitBtn.style.left = "24px";
  }, 50);

  const keyHandler = (e) => {
    if ([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputRef?.current && document.activeElement === inputRef.current) inputRef.current.blur();
      triggerAnomalyCheck();
    }
    if (e.key === "Escape") {
      teardown();
      onQuit?.();
    }
  };
  document.addEventListener("keydown", keyHandler);
  st.keyHandler = keyHandler;

  const preventScroll = (e) => {
    e.preventDefault();
  };
  document.addEventListener("wheel", preventScroll, { passive: false });
  document.addEventListener("touchmove", preventScroll, { passive: false });
  st.preventScroll = preventScroll;

  if (inputRef?.current) inputRef.current.blur();

  // ── Main scroll loop ───────────────────────────────────────────────
  resetForCorridor(0);

  const step = (now) => {
    const currentCorridor = currentCorridorIdx();

    if (!st.verdictLocked && !st.scrollingBack) {
      const _nextClone = st.clones[currentCorridor];
      const _nextHero = _nextClone && _nextClone.querySelector("#hackerText");
      if (_nextHero && _nextHero.getBoundingClientRect().top <= window.innerHeight) {
        if (lockCorridorVerdict()) {
          winGame();
          return;
        }
      }
    }

    if (currentCorridor > st.lastCorridor) {
      st.lastCorridor = currentCorridor;
      if (lockCorridorVerdict()) {
        winGame();
        return;
      }
      resetForCorridor(currentCorridor);
    }

    if (!st.scrollingBack && !st.anomalyFiredThisCorridor && window.scrollY >= st.anomalyTriggerY) {
      st.anomalyFiredThisCorridor = true;
      const targetEl = corridorElFor(currentCorridor);
      st.removeEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)](targetEl);
      st.anomalyActive = true;
      st.expireTimer = setTimeout(() => {
        if (st.anomalyActive) {
          st.removeEffect?.();
          st.anomalyActive = false;
          st.removeEffect = null;
        }
      }, 5000);
    }

    if (!st.scrollingBack && window.scrollY >= corridorRealTop(currentCorridor) + 0.7 * st.rootHeight) {
      if (!st.scorePredictedThisCorridor) {
        const _nextClone = st.clones[currentCorridor];
        if (_nextClone) {
          st.scorePredictedThisCorridor = true;
          let _pred = st.score;
          if (st.isCurrentCorridorClean) _pred = Math.min(st.score + 1, 9);
          else if (st.anomalyFiredThisCorridor) _pred = 0;
          const _ch = _nextClone.querySelector("#hackerText");
          if (_ch) {
            _ch.textContent = `${_pred} ↓`;
            _ch.style.color = "#2ba2a2";
          }
        }
      }
    }

    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 600) {
      createAndAppendClone();
    }

    if (!st.scrollingBack) {
      const dt = st._lastForwardT == null ? 16.67 : Math.min(now - st._lastForwardT, 50);
      st._lastForwardT = now;
      const px = Math.max(1, Math.round((500 * dt) / 1000));
      window.scrollTo(0, window.scrollY + px);
    } else {
      st._lastForwardT = null;
    }

    st.scrollRafId = requestAnimationFrame(step);
  };

  st.scrollRafId = requestAnimationFrame(step);

  // Return API
  return {
    teardown,
  };
}

// Guard against multiple instances
startExit8._active = false;
