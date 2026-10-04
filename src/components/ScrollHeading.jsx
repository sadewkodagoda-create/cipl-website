import { Fragment } from "react";
import { motion, useTransform } from "framer-motion";
import useScrollFrame from "../hooks/useScrollFrame";
import { headingFrame } from "../lib/scrollMotion";

export default function ScrollHeading({
  children,
  as = "h2",
  className = "",
  ...props
}) {
  const { ref, progress, momentum, reduceMotion } = useScrollFrame();
  const frame = useTransform(() =>
    headingFrame(reduceMotion ? 0.5 : progress.get(), momentum?.get() ?? 0),
  );
  const fold = useTransform(frame, (value) => `${value.fold}deg`);
  const stretch = useTransform(frame, (value) => value.stretch);
  const ink = useTransform(frame, (value) => `${value.ink}%`);
  const Tag =
    as === "h1"
      ? motion.h1
      : as === "h3"
        ? motion.h3
        : as === "span"
          ? motion.span
          : motion.h2;
  const words = String(children).trim().split(/\s+/);

  return (
    <Tag
      ref={ref}
      className={`scroll-heading ${className}`}
      style={
        reduceMotion
          ? undefined
          : {
              "--type-fold": fold,
              "--type-stretch": stretch,
              "--type-ink": ink,
            }
      }
      {...props}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span
            className="scroll-word"
            style={{ "--word-depth": 0.7 + (index % 4) * 0.12 }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
