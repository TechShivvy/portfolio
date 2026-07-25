import { useEffect, useRef } from "react";

/**
 * Returns a ref. Attach it to a DOM element; the element fades + slides in
 * once it enters the viewport. Respects prefers-reduced-motion.
 */
export default function useFadeIn() {
  const ref = useRef(null);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = "opacity 0.55s ease, transform 0.55s ease";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return ref;
}
