import { useContext, useRef } from "react";
import { useScroll, useSpring } from "framer-motion";
import { ScrollMotionContext } from "../lib/scrollMotionContext";
import { SCROLL_SPRING } from "../lib/scrollMotion";

export default function useScrollFrame() {
  const ref = useRef(null);
  const context = useContext(ScrollMotionContext);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, SCROLL_SPRING);
  return { ref, progress, ...context };
}
