import { useMemo } from "react";
import { useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { ScrollMotionContext } from "../lib/scrollMotionContext";
import { SCROLL_SPRING } from "../lib/scrollMotion";
import useMotionPreference from "../hooks/useMotionPreference";

export default function ScrollMotion({ children }) {
  const reduceMotion = useMotionPreference();
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const pressure = useTransform(velocity, (value) =>
    reduceMotion ? 0 : Math.max(-1, Math.min(1, value / 1800)),
  );
  const momentum = useSpring(pressure, SCROLL_SPRING);
  const value = useMemo(
    () => ({ momentum, reduceMotion }),
    [momentum, reduceMotion],
  );

  return (
    <ScrollMotionContext.Provider value={value}>
      {children}
    </ScrollMotionContext.Provider>
  );
}
