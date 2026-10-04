import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import useScrollFrame from "../hooks/useScrollFrame";
import { POINTER_SPRING, surfaceFrame } from "../lib/scrollMotion";

export default function Reveal({
  children,
  className = "",
  index = 0,
  kind = "card",
  hover = false,
  photo,
}) {
  const { ref, progress, active, momentum, reduceMotion } = useScrollFrame();
  const bounds = useRef(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const focused = useMotionValue(0);
  const focus = useSpring(focused, POINTER_SPRING);
  const x = useSpring(pointerX, POINTER_SPRING);
  const y = useSpring(pointerY, POINTER_SPRING);
  const frame = useTransform(() =>
    surfaceFrame(
      reduceMotion
        ? 0.5
        : progress.get() + (0.5 - progress.get()) * focus.get(),
      kind,
      index,
      reduceMotion || !active ? 0 : (momentum?.get() ?? 0) * (1 - focus.get()),
    ),
  );
  const rotateX = useTransform(
    () => frame.get().rotateX - y.get() * 2.4 * (1 - focus.get()),
  );
  const rotateY = useTransform(
    () => frame.get().rotateY + x.get() * 3 * (1 - focus.get()),
  );
  const scale = useTransform(frame, (value) => value.scale);
  const mediaScale = useTransform(frame, (value) => value.mediaScale);
  const numberScale = useTransform(frame, (value) => value.numberScale);
  const copyScale = useTransform(frame, (value) => value.copyScale);
  const light = useTransform(frame, (value) => `${value.light}%`);
  const rule = useTransform(frame, (value) => value.rule);

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const movePointer = (event) => {
    if (
      !hover ||
      reduceMotion ||
      event.pointerType !== "mouse" ||
      !bounds.current
    )
      return;
    const { left, top, width, height, scrollY } = bounds.current;
    pointerX.set(
      Math.max(-1, Math.min(1, ((event.clientX - left) / width - 0.5) * 2)),
    );
    pointerY.set(
      Math.max(
        -1,
        Math.min(
          1,
          ((event.clientY - top + window.scrollY - scrollY) / height - 0.5) * 2,
        ),
      ),
    );
  };

  return (
    <motion.div
      ref={ref}
      className={`scroll-surface ${className}`}
      data-motion-kind={kind}
      style={
        reduceMotion
          ? undefined
          : {
              rotateX,
              rotateY,
              scale,
              transformPerspective: 1100,
              willChange: active ? "transform" : undefined,
              "--media-scale": mediaScale,
              "--number-scale": numberScale,
              "--copy-scale": copyScale,
              "--surface-light": light,
              "--surface-rule": rule,
            }
      }
      onPointerEnter={(event) => {
        if (!hover || reduceMotion || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        bounds.current = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          scrollY: window.scrollY,
        };
        movePointer(event);
      }}
      onPointerMove={movePointer}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
      onFocusCapture={() => {
        focused.set(1);
        resetPointer();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) focused.set(0);
      }}
    >
      {photo && (
        <img
          className="card-photo"
          src={photo}
          alt=""
          aria-hidden="true"
          width="900"
          height="600"
          loading="lazy"
          decoding="async"
        />
      )}
      {children}
      {kind !== "copy" && <span className="surface-rule" aria-hidden="true" />}
    </motion.div>
  );
}
