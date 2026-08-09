import { COLOR_ACCENT_DANGER } from "./tokens";
import { unlock } from "./achievements";

// ─── Tenet sequence ──────────────────────────────────────────────────────────
// Plays the entire hero intro *in reverse* and then closes the tab. The forward
// intro is: splash (ring fills → boom) → name scramble settles → matrix rain →
// down-arrow hint. So tenet runs it back, at the SAME speeds:
//   1. scroll back to the top
//   2. the down-arrow hint fades away (it was the last thing in - first out)
//   3. matrix rain retracts upward - every column stops at the top together
//   4. the name flips from blue to red the instant the rain freezes
//   5. the name un-scrambles in reverse (settled name → random noise, 100ms/step)
//   6. the loading splash reassembles, then the progress ring un-fills 360°→0°
//   7. the tab closes - same as the `suicide` command
//
// The matrix half lives inside Matrix.js (it owns the canvas + rAF loop) and the
// arrow lives in Home.js; this orchestrator drives them via window events and
// handles the name, splash and exit itself.

const SCRAMBLE_CHARS =
  "!#$%&'()*+,-./:;<=>?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randChar = () =>
  SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Reverse of the hero scramble. Runs at 100ms/step to match the forward intro
// (see scramble.js). Each glyph "breaks" into random characters at a staggered
// moment, then keeps flickering as noise until the end.
function reverseScramble(el) {
  const original = el.innerHTML;
  const len = original.length;
  const iterations = len * 2;
  const breakAt = [];
  for (let i = 0; i < len; i++) {
    // Spread each glyph's "break" moment across the WHOLE run so the name keeps
    // dissolving into noise right up to the final frame - the mirror of the
    // forward scramble settling glyph-by-glyph, with no long frozen-noise tail.
    breakAt.push(Math.floor(Math.random() * iterations));
  }

  return new Promise((resolve) => {
    let counter = 0;
    const id = setInterval(() => {
      let out = "";
      for (let i = 0; i < len; i++) {
        if (original[i] === " ") out += " ";
        else out += counter >= breakAt[i] ? randChar() : original[i];
      }
      el.innerHTML = out;
      counter++;
      if (counter > iterations) {
        clearInterval(id);
        resolve();
      }
    }, 100);
  });
}

// Reverse of the loading splash. A fresh overlay fades the black backdrop back
// over the site while the ring + icon contract into place (the outward boom,
// played backwards). Then the progress ring un-fills 360°→0° over 2.1s - the
// exact reverse of the forward `pre-fill` animation.
function reverseSplash() {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const pre = document.createElement("div");
    Object.assign(pre.style, {
      position: "fixed",
      inset: "0",
      zIndex: "999999",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: "0",
      transition: "opacity 0.56s ease",
      pointerEvents: "none",
      overflow: "hidden",
    });

    const icoSrc = `${import.meta.env.BASE_URL}coderwings.ico`;
    const ringMask =
      "radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 calc(100% - 5px))";
    pre.innerHTML = `
      <div style="position:relative;width:76px;height:76px;display:flex;align-items:center;justify-content:center;">
        <div class="rev-flash" style="position:absolute;inset:0;border-radius:50%;opacity:0;
             background:radial-gradient(circle, rgba(162,43,43,0.55), rgba(162,43,43,0) 70%);"></div>
        <div class="rev-echo" style="position:absolute;inset:0;border-radius:50%;opacity:0;
             border:2px solid ${COLOR_ACCENT_DANGER};"></div>
        <div class="rev-ring" style="position:absolute;inset:0;border-radius:50%;
             background:conic-gradient(${COLOR_ACCENT_DANGER} var(--p,360deg), rgba(162,43,43,0.2) 0);
             -webkit-mask:${ringMask};mask:${ringMask};"></div>
        <img class="rev-ico" src="${icoSrc}" alt="" width="40" height="40"
             style="width:40px;height:40px;border-radius:50%;
             -webkit-mask-image:radial-gradient(circle,#000 72%,#0000 76%);
             mask-image:radial-gradient(circle,#000 72%,#0000 76%);" />
      </div>`;
    document.body.appendChild(pre);

    const flash = pre.querySelector(".rev-flash");
    const echo = pre.querySelector(".rev-echo");
    const ring = pre.querySelector(".rev-ring");
    const ico = pre.querySelector(".rev-ico");
    ring.style.setProperty("--p", "360deg");

    // Phase 1 - reverse boom. The forward exit is a shockwave: the ring ripples
    // out to scale(26), a light-burst flashes, and an echo ring follows, all
    // while the backdrop clears. Here we play those exact keyframes with
    // `direction: reverse` so the whole explosion implodes back into the icon,
    // and fade the black backdrop in behind it.
    requestAnimationFrame(() => {
      pre.style.opacity = "1";
    });

    // The main ring + icon hold their settled state (scale 1) so they remain
    // for the un-fill phase - these keep `fill: both`.
    ring.animate(
      [
        { transform: "scale(1)", opacity: 1, offset: 0 },
        { transform: "scale(0.82)", opacity: 1, offset: 0.16 },
        { transform: "scale(26)", opacity: 0, offset: 1 },
      ],
      { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)", direction: "reverse", fill: "both" }
    );
    ico.animate(
      [
        { opacity: 1, transform: "scale(1)", offset: 0 },
        { opacity: 1, transform: "scale(1.14)", offset: 0.28 },
        { opacity: 0, transform: "scale(1.4)", offset: 1 },
      ],
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)", direction: "reverse", fill: "both" }
    );

    // The flash + echo are TRANSIENT burst layers. If they held `fill: both`
    // they'd freeze at their offset-0 keyframe (a stray second ring / glow)
    // and linger through the un-fill phase - the "duplicate ring" bug. Play
    // them reversed, then clear them the moment they finish so only the main
    // ring + icon remain.
    const clearBurst = (el) => (anim) => {
      anim.onfinish = () => {
        anim.cancel();
        el.style.opacity = "0";
      };
    };
    clearBurst(flash)(
      flash.animate(
        [
          { opacity: 0, transform: "scale(0.7)", offset: 0 },
          { opacity: 0.8, transform: "scale(1.5)", offset: 0.25 },
          { opacity: 0, transform: "scale(9.5)", offset: 1 },
        ],
        { duration: 700, easing: "ease-out", direction: "reverse", fill: "both" }
      )
    );
    clearBurst(echo)(
      echo.animate(
        [
          { opacity: 0.85, transform: "scale(0.7)", offset: 0 },
          { opacity: 0, transform: "scale(18)", offset: 1 },
        ],
        { duration: 840, easing: "ease-out", direction: "reverse", fill: "both" }
      )
    );

    // Phase 2 - once the shockwave has imploded and the ring has settled, un-fill
    // it 360°→0° over 2.1s (the reverse of the forward progress fill). Tweened
    // manually so it works regardless of WAAPI custom-property support.
    setTimeout(() => {
      const DUR = 2100;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DUR);
        ring.style.setProperty("--p", `${360 * (1 - easeInOutQuad(t))}deg`);
        if (t < 1) requestAnimationFrame(tick);
        else setTimeout(done, 260);
      };
      requestAnimationFrame(tick);
    }, 1000);
  });
}

export default async function tenet() {
  if (window.__tenet) return;
  window.__tenet = true;
  // Unlocked here, at the very start - localStorage.setItem is synchronous,
  // so this is committed long before the location.replace() seven steps down.
  unlock("time-traveller");

  // 1. Scroll back to the top so the reverse plays over the hero.
  window.scrollTo({ top: 0, behavior: "smooth" });
  await wait(750);

  // 2. Fade the down-arrow hint away first (it came in last).
  window.dispatchEvent(new Event("hero:hide-arrow"));
  await wait(700); // match the arrow's 0.6s fade transition
  // 3. Retract the matrix rain - wait for every column to freeze at the top.
  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("matrix:reverse-done", finish);
      resolve();
    };
    window.addEventListener("matrix:reverse-done", finish);
    window.dispatchEvent(new Event("matrix:reverse"));
    // Fail-safe in case the matrix never reports back (e.g. not mounted).
    setTimeout(finish, 3400);
  });

  // 4. Flip the name from blue to red the instant the rain freezes.
  const name = document.getElementById("hackerText");
  if (name) {
    name.style.pointerEvents = "none";
    name.style.color = COLOR_ACCENT_DANGER;
    if (name.parentElement) name.parentElement.style.color = COLOR_ACCENT_DANGER;
  }
  await wait(320);

  // 5. Un-scramble the name back into noise.
  if (name) await reverseScramble(name);

  // Fade the noise out so it doesn't sit frozen while the splash reassembles -
  // this hands off smoothly into the boom/icon instead of a hard cut to black.
  if (name) {
    name.style.transition = "opacity 0.32s ease";
    name.style.opacity = "0";
  }
  await wait(320);

  // 6. Reassemble the loading splash and un-fill the ring.
  await reverseSplash();

  // 7. Close the tab - same as `suicide`.
  window.location.replace("about:blank");
}
