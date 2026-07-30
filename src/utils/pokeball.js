// Throws a Pokéball at the hero h1 text, captures it with a wiggle sequence,
// then releases it. Scrolls to top first so the animation is always visible.
export default function throwPokeball() {
  if (document.getElementById("__pokeball")) return;

  const h1 = document.getElementById("hackerText");
  if (!h1) return;

  // ── Scroll guard ──────────────────────────────────────────────────────────
  // Hero is off-screen when scrolled — smooth-scroll to top and wait for
  // the page to settle before recalculating the ball's flight path.
  if (window.scrollY > 50) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    let fired = false;
    const go = () => { if (!fired) { fired = true; launch(); } };
    let last = -1;
    const poll = setInterval(() => {
      if (window.scrollY === last) { clearInterval(poll); go(); }
      last = window.scrollY;
    }, 50);
    // Fallback: give up waiting after 900 ms and launch anyway
    setTimeout(() => { clearInterval(poll); go(); }, 900);
    return;
  }

  launch();

  // ─────────────────────────────────────────────────────────────────────────

  function launch() {
    // Re-guard in case the shortcut fired twice during scroll settling
    if (document.getElementById("__pokeball")) return;

    injectStyles();

    // ── Build ball ──────────────────────────────────────────────────────────
    const ball = document.createElement("div");
    ball.id = "__pokeball";
    ball.innerHTML = `<div class="pb-dot"></div>`;

    const vh = window.innerHeight;
    const by = vh - 90;
    ball.style.left = (window.innerWidth / 2 - 30) + "px";
    ball.style.top  = by + "px";
    document.body.appendChild(ball);

    // getBoundingClientRect is re-read here so it's always fresh after scroll
    const rect = h1.getBoundingClientRect();
    const dy   = (rect.top + rect.height / 2) - (by + 30);

    // ── Phase 1: throw (spin up to h1) ─────────────────────────────────────
    ball.animate(
      [
        { transform: "translateY(0px) scale(.4) rotate(0deg)",       opacity: .6 },
        { transform: `translateY(${dy}px) scale(1) rotate(-400deg)`, opacity: 1  },
      ],
      { duration: 650, easing: "cubic-bezier(.15,.8,.35,1)", fill: "forwards" }
    ).onfinish = () => {

      // ── Phase 2: settling flash + h1 absorbed into ball ─────────────────
      // Rotation winds smoothly from -400° → 0° to avoid a snap after throw
      ball.animate(
        [
          { transform: `translateY(${dy}px) scale(1) rotate(-400deg)`,    boxShadow: "0 0 12px rgba(200,30,30,.5)"  },
          { transform: `translateY(${dy}px) scale(1.22) rotate(-200deg)`, boxShadow: "0 0 55px rgba(255,255,255,.9)" },
          { transform: `translateY(${dy}px) scale(1) rotate(0deg)`,       boxShadow: "0 0 12px rgba(200,30,30,.5)"  },
        ],
        { duration: 280, easing: "ease", fill: "forwards" }
      );

      h1.style.transition = "transform .3s ease, opacity .3s ease";
      h1.style.transform  = "scale(0)";
      h1.style.opacity    = "0";

      // ── Phase 3: 3 capture wiggles ──────────────────────────────────────
      const wiggle = (cb) => {
        ball.animate(
          [
            { transform: `translateY(${dy}px) rotate(0deg)`   },
            { transform: `translateY(${dy}px) rotate(-22deg)` },
            { transform: `translateY(${dy}px) rotate(22deg)`  },
            { transform: `translateY(${dy}px) rotate(-14deg)` },
            { transform: `translateY(${dy}px) rotate(14deg)`  },
            { transform: `translateY(${dy}px) rotate(0deg)`   },
          ],
          { duration: 550, easing: "ease", fill: "forwards" }
        ).onfinish = cb;
      };

      // Small pause so h1 fully vanishes before wiggles start
      setTimeout(() => wiggle(() => wiggle(() => wiggle(() => {

        // ── Phase 4: success glow + "caught!" toast ──────────────────────
        ball.animate(
          [
            { transform: `translateY(${dy}px)`, boxShadow: "0 0 12px rgba(200,30,30,.5)"  },
            { transform: `translateY(${dy}px)`, boxShadow: "0 0 32px rgba(50,255,80,.85)" },
          ],
          { duration: 400, easing: "ease", fill: "forwards" }
        );

        const toast = document.createElement("div");
        toast.id = "__pb-toast";
        toast.textContent = "★  Shivcharan was caught!";
        document.body.appendChild(toast);
        void toast.offsetWidth; // force reflow so CSS transition fires
        toast.classList.add("pb-show");

        // ── Phase 5: ball exits, hero text restored ───────────────────────
        setTimeout(() => {
          ball.animate(
            [
              { transform: `translateY(${dy}px) scale(1)`,      opacity: 1 },
              { transform: `translateY(${dy - 30}px) scale(0)`, opacity: 0 },
            ],
            { duration: 500, easing: "ease", fill: "forwards" }
          ).onfinish = () => {
            ball.remove();

            h1.style.transition = "transform .5s ease, opacity .5s ease";
            h1.style.transform  = "";
            h1.style.opacity    = "";
            setTimeout(() => { h1.style.transition = ""; }, 500);

            setTimeout(() => {
              toast.classList.remove("pb-show");
              setTimeout(() => toast.remove(), 400);
            }, 1000);
          };
        }, 1800);

      }))), 350);
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById("__pokeball-style")) return;
    const s = document.createElement("style");
    s.id = "__pokeball-style";
    s.textContent = `
      #__pokeball {
        position: fixed;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid #111;
        box-shadow: 0 0 12px rgba(200,30,30,.5);
        background: #efefef;
        z-index: 99999;
        pointer-events: none;
      }
      #__pokeball::before {
        content: '';
        position: absolute;
        inset: 0 0 50% 0;
        background: #e02020;
      }
      #__pokeball::after {
        content: '';
        position: absolute;
        top: calc(50% - 3px);
        left: 0; right: 0;
        height: 6px;
        background: #111;
      }
      #__pokeball .pb-dot {
        position: absolute;
        top: 50%; left: 50%;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid #111;
        transform: translate(-50%, -50%);
        z-index: 1;
      }
      #__pb-toast {
        position: fixed;
        left: 50%;
        bottom: 80px;
        transform: translateX(-50%) translateY(16px);
        opacity: 0;
        background: rgba(8,8,8,.93);
        color: #a0ffa0;
        font-family: monospace;
        font-size: 1rem;
        padding: 11px 22px;
        border-radius: 6px;
        border: 1px solid #3f3;
        z-index: 99998;
        pointer-events: none;
        letter-spacing: .05em;
        transition: opacity .35s ease, transform .35s ease;
      }
      #__pb-toast.pb-show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(s);
  }
}
