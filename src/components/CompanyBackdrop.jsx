import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import useMotionPreference from "../hooks/useMotionPreference";

const FOLLOW = { stiffness: 65, damping: 24, mass: 0.9 };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function GradientClouds() {
  return (
    <>
      <div className="company-gradient-cloud company-gradient-cloud-blue" />
      <div className="company-gradient-cloud company-gradient-cloud-warm" />
      <div className="company-gradient-cloud company-gradient-cloud-white" />
      <div className="company-gradient-structure">
        <img
          src="/site-photos/building-structure.webp"
          width="1122"
          height="1402"
          alt=""
          decoding="async"
          draggable="false"
        />
      </div>
    </>
  );
}

function InteractiveGradient({ containerRef }) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const targetHover = useMotionValue(0);
  const pointerX = useSpring(targetX, FOLLOW);
  const pointerY = useSpring(targetY, FOLLOW);
  const hover = useSpring(targetHover, FOLLOW);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const scroll = useSpring(scrollYProgress, { stiffness: 85, damping: 26 });
  const fieldX = useTransform(() => pointerX.get() * 0.1 + scroll.get() * 46);
  const fieldY = useTransform(() => pointerY.get() * 0.08 - scroll.get() * 125);
  const fieldRotate = useTransform(scroll, [0, 1], [-3, 6]);
  const haloOpacity = useTransform(hover, [0, 1], [0, 0.58]);
  const haloScale = useTransform(hover, [0, 1], [0.85, 1.15]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let bounds;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      bounds = {
        left: rect.left,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      };
    };
    const follow = (clientX, clientY) => {
      targetX.set(
        clamp(
          clientX - bounds.left - bounds.width / 2,
          -bounds.width / 2,
          bounds.width / 2,
        ),
      );
      targetY.set(
        clamp(
          clientY + window.scrollY - bounds.top - bounds.height / 2,
          -bounds.height / 2,
          bounds.height / 2,
        ),
      );
    };
    const reset = () => {
      targetX.set(0);
      targetY.set(0);
      targetHover.set(0);
    };
    const onPointerMove = (event) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      follow(event.clientX, event.clientY);
      targetHover.set(event.target.closest(".company-card") ? 1 : 0.35);
    };
    const onFocus = (event) => {
      const card = event.target.closest(".company-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      follow(rect.left + rect.width / 2, rect.top + rect.height / 2);
      targetHover.set(0.75);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", reset, { passive: true });
    container.addEventListener("focusin", onFocus);
    container.addEventListener("focusout", reset);
    return () => {
      observer.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", reset);
      container.removeEventListener("focusin", onFocus);
      container.removeEventListener("focusout", reset);
    };
  }, [containerRef, targetX, targetY, targetHover]);

  return (
    <>
      <motion.div
        className="company-gradient-field"
        style={{ x: fieldX, y: fieldY, rotate: fieldRotate }}
      >
        <GradientClouds />
      </motion.div>
      <motion.div
        className="company-gradient-response"
        style={{
          x: pointerX,
          y: pointerY,
          opacity: haloOpacity,
          scale: haloScale,
        }}
      >
        <div />
      </motion.div>
    </>
  );
}

export default function CompanyBackdrop({ containerRef }) {
  const reduceMotion = useMotionPreference();

  return (
    <div
      className={`company-backdrop${reduceMotion ? " is-still" : ""}`}
      aria-hidden="true"
    >
      {reduceMotion ? (
        <div className="company-gradient-field">
          <GradientClouds />
        </div>
      ) : (
        <InteractiveGradient containerRef={containerRef} />
      )}
    </div>
  );
}
