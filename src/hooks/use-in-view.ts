import { useEffect, useRef, useState } from "react";

/**
 * Returns true once the element enters the viewport (with configurable margin).
 * `once: true` (default) means it stays true after first intersection.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit & { once?: boolean }
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once ?? true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) obs.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px", ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [once]);

  return { ref, inView };
}
