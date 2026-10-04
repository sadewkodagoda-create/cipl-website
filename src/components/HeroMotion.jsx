import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { SCROLL_SPRING } from "../lib/scrollMotion";
import useMotionPreference from "../hooks/useMotionPreference";

export default function HeroMotion({ children, className, style }) {
  const ref = useRef(null);
  const reduceMotion = useMotionPreference();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const progress = useSpring(scrollYProgress, SCROLL_SPRING);
  const photoScale = useTransform(progress, [0, 1], [1, 1.085]);
  const aperture = useTransform(progress, [0, 0.8, 1], [0, 12, 18]);
  const corners = useTransform(progress, [0, 1], [0, 34]);

  return (
    <motion.section
      ref={ref}
      className={className}
      style={
        reduceMotion
          ? style
          : {
              ...style,
              "--hero-lens": photoScale,
              "--hero-aperture": aperture,
              borderBottomLeftRadius: corners,
              borderBottomRightRadius: corners,
            }
      }
    >
      {children}
    </motion.section>
  );
}
