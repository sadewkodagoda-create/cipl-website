import { useRef } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react";

export default function SitePreparationComparison() {
  const comparisonRef = useRef(null);

  const setPosition = (input, value) => {
    const nextValue = Math.max(0, Math.min(100, Number(value)));
    input.value = String(nextValue);
    comparisonRef.current?.style.setProperty(
      "--comparison-position",
      `${nextValue}%`,
    );
    input.setAttribute(
      "aria-valuetext",
      `${nextValue}% before, ${100 - nextValue}% after`,
    );
  };

  const updatePosition = (event) => {
    const value = Number(event.currentTarget.value);
    setPosition(event.currentTarget, value);
  };

  const updateFromPointer = (event) => {
    const bounds = comparisonRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const value = Math.round(
      ((event.clientX - bounds.left) / bounds.width) * 100,
    );
    setPosition(event.currentTarget, value);
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      updateFromPointer(event);
  };

  const handlePointerEnd = (event) => {
    updateFromPointer(event);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event) => {
    const keySteps = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -10,
      PageUp: 10,
    };

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setPosition(event.currentTarget, event.key === "Home" ? 0 : 100);
      return;
    }

    if (keySteps[event.key]) {
      event.preventDefault();
      setPosition(
        event.currentTarget,
        Number(event.currentTarget.value) + keySteps[event.key],
      );
    }
  };

  return (
    <div
      ref={comparisonRef}
      className="comparison-slider"
      style={{ "--comparison-position": "50%" }}
      role="group"
      aria-label="Site preparation before and after comparison"
    >
      <img
        src="/site-photos/process/site-preparation-after.jpg"
        alt="Aerial view of the construction site after the land was cleared and levelled"
        width="1536"
        height="1024"
        loading="lazy"
        decoding="async"
        className="comparison-image"
      />
      <div className="comparison-before-layer" aria-hidden="true">
        <img
          src="/site-photos/process/site-preparation-before.jpg"
          alt=""
          width="1536"
          height="1024"
          loading="lazy"
          decoding="async"
          className="comparison-image"
        />
      </div>

      <span className="process-step-overlay" aria-hidden="true" />

      <input
        className="comparison-range"
        type="range"
        min="0"
        max="100"
        step="1"
        defaultValue="50"
        aria-label="Adjust the site preparation comparison"
        aria-valuetext="50% before, 50% after"
        aria-describedby="site-comparison-instructions"
        onInput={updatePosition}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
      />

      <div className="comparison-divider" aria-hidden="true">
        <span className="comparison-line" />
        <span className="comparison-thumb">
          <ArrowsLeftRight size={21} weight="bold" />
        </span>
      </div>

      <div className="comparison-labels heading" aria-hidden="true">
        <span>Before</span>
        <span>After</span>
      </div>

      <div className="process-step-copy comparison-copy">
        <span className="heading text-xs">01</span>
        <p className="heading mt-3 text-sm">Site Preparation</p>
      </div>

      <p id="site-comparison-instructions" className="sr-only">
        Drag horizontally or use the arrow keys to compare the uncleared land
        with the cleared and levelled site.
      </p>
    </div>
  );
}
