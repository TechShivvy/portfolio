import { useEffect, useRef } from "react";

const KONAMI = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

/**
 * useKonami - calls `callback` when the Konami code is entered via keyboard.
 * Wrap `callback` in useCallback if it changes on every render.
 */
export default function useKonami(callback) {
  const idxRef = useRef(0);

  useEffect(() => {
    function onKey(e) {
      if (e.key === KONAMI[idxRef.current]) {
        idxRef.current++;
        if (idxRef.current === KONAMI.length) {
          idxRef.current = 0;
          callback();
        }
      } else {
        idxRef.current = e.key === KONAMI[0] ? 1 : 0;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [callback]);
}
