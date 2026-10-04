import { motion, useTransform } from "framer-motion";
import useScrollFrame from "../hooks/useScrollFrame";

export default function HeroMotion({ children, className, style }) {
  const { ref, progress, reduceMotion } = useScrollFrame({
    offset: ["start start", "end start"],
    initial: 0,
  });
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
