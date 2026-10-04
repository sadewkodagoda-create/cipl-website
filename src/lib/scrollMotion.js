// The same position always produces the same composition in either direction.
// A small, bounded velocity response adds weight without hiding any content.
export const SCROLL_SPRING = { stiffness: 145, damping: 31, mass: 0.55 };
export const POINTER_SPRING = { stiffness: 190, damping: 27, mass: 0.4 };

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function scrollTension(progress) {
  const p = clamp(progress);
  // Hold a generous, completely settled reading zone in the middle.
  return p < 0.42
    ? 1 - smoothstep(p / 0.42)
    : p > 0.64
      ? -smoothstep((p - 0.64) / 0.36)
      : 0;
}

export function surfaceFrame(progress, kind = "card", index = 0, momentum = 0) {
  const p = clamp(progress);
  const tension = scrollTension(p);
  const edge = Math.abs(tension);
  const direction = index % 2 ? -1 : 1;
  const weight = kind === "copy" ? 0 : kind === "photo" ? 0.65 : 1;
  const impulse = clamp(momentum, -1, 1);

  return {
    rotateX: (tension * 6 - impulse * 0.85) * weight,
    rotateY: direction * (tension * 2.2 + impulse * 0.35) * weight,
    scale: 1 - edge * (kind === "copy" ? 0 : 0.035),
    mediaScale: 1.018 + edge * 0.068,
    numberScale: 1 + edge * 0.035,
    copyScale: 1 - edge * 0.008,
    light: -130 + p * 570,
    rule: smoothstep(p / 0.56),
    tension,
  };
}

export function headingFrame(progress, momentum = 0) {
  const tension = scrollTension(progress);
  return {
    fold: tension * 18 - clamp(momentum, -1, 1) * 1.1,
    stretch: Math.abs(tension) * 0.024,
    ink: -80 + clamp(progress) * 250,
  };
}
