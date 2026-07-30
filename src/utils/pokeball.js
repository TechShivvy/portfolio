// Throws a Pokéball at the hero h1, captures it with a wiggle sequence,
// then releases the text after showing "★ Shivcharan was caught!".
export default function throwPokeball() {
  if (document.getElementById("__pokeball")) return;

  const h1 = document.getElementById("hackerText");
  if (!h1) return;

  // ── Inject styles once ────────────────────────────────────────────────────
  if (!document.getElementById("__pokeball-style")) {
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

  // ── Build the ball ────────────────────────────────────────────────────────
  const ball = document.createElement("div");
  ball.id = "__pokeball";
  ball.innerHTML = `<div class="pb-dot"></div>`;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bx = vw / 2 - 30;
  const by = vh - 90;
  ball.style.left = bx + "px";
  ball.style.top  = by + "px";
  document.body.appendChild(ball);

  // dy: how far the ball must travel so its centre meets the h1 centre
  const rect = h1.getBoundingClientRect();
  const dy = (rect.top + rect.height / 2) - (by + 30);

  // ── Phase 1: throw ────────────────────────────────────────────────────────
  const throwAnim = ball.animate(
    [
      { transform: "translateY(0px) scale(.4) rotate(0deg)",           opacity: .6 },
      { transform: `translateY(${dy}px) scale(1) rotate(-400deg)`,     opacity: 1  },
    ],
    { duration: 650, easing: "cubic-bezier(.15,.8,.35,1)", fill: "forwards" }
  );

  throwAnim.onfinish = () => {
    // ── Phase 2: flash + absorb h1 ────────────────────────────────────────
    ball.animate(
      [
        { transform: `translateY(${dy}px) scale(1)`,    boxShadow: "0 0 12px rgba(200,30,30,.5)" },
        { transform: `translateY(${dy}px) scale(1.25)`, boxShadow: "0 0 55px rgba(255,255,255,.95)" },
        { transform: `translateY(${dy}px) scale(1)`,    boxShadow: "0 0 12px rgba(200,30,30,.5)" },
      ],
      { duration: 250, easing: "ease" }
    );

    h1.style.transition = "transform .3s ease, opacity .3s ease";
    h1.style.transform  = "scale(0)";
    h1.style.opacity    = "0";

    // ── Phase 3: 3 wiggles ────────────────────────────────────────────────
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

    setTimeout(() => {
      wiggle(() => wiggle(() => wiggle(() => {
        // ── Phase 4: success flash + "caught!" toast ──────────────────────
        ball.animate(
          [
            { transform: `translateY(${dy}px) rotate(0deg)`, boxShadow: "0 0 12px rgba(200,30,30,.5)" },
            { transform: `translateY(${dy}px) rotate(0deg)`, boxShadow: "0 0 32px rgba(50,255,80,.85)" },
          ],
          { duration: 400, easing: "ease", fill: "forwards" }
        );

        const toast = document.createElement("div");
        toast.id = "__pb-toast";
        toast.textContent = "★  Shivcharan was caught!";
        document.body.appendChild(toast);
        void toast.offsetWidth; // force reflow so transition fires
        toast.classList.add("pb-show");

        // ── Phase 5: ball exits, hero text returns ────────────────────────
        setTimeout(() => {
          ball.animate(
            [
              { transform: `translateY(${dy}px) scale(1)`, opacity: 1 },
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
      })));
    }, 350);
  };
}
