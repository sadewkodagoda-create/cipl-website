import { useContext, useEffect, useRef } from "react";
import { scroll, useInView, useMotionValue, useSpring } from "framer-motion";
import { ScrollMotionContext } from "../lib/scrollMotionContext";
import { SCROLL_SPRING } from "../lib/scrollMotion";

export default function useScrollFrame({
  offset = ["start end", "end start"],
  initial = 0.5,
} = {}) {
  const ref = useRef(null);
  const context = useContext(ScrollMotionContext);
  const active = useInView(ref, { margin: "180px 0px" });
  const scrollYProgress = useMotionValue(initial);
  const progress = useSpring(scrollYProgress, SCROLL_SPRING);
  const start = offset[0];
  const end = offset[1];

  // Motion batches these reads. Detach distant targets so scrolling only
  // measures and updates content approaching the viewport, in either direction.
  useEffect(() => {
    if (!active || context?.reduceMotion || !ref.current) return undefined;
    return scroll((value) => scrollYProgress.set(value), {
      target: ref.current,
      offset: [start, end],
    });
  }, [active, context?.reduceMotion, scrollYProgress, start, end]);

  return { ref, progress, active, ...context };
}
