import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  Images,
  X,
} from "@phosphor-icons/react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ProjectGallery({ project, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const touchStartXRef = useRef(null);
  const photos = project.photos;
  const lightboxOpen = selectedIndex !== null;
  const currentPhoto = lightboxOpen ? photos[selectedIndex] : null;

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) =>
      current === null ? 0 : (current - 1 + photos.length) % photos.length,
    );
  }, [photos.length]);

  const showNext = useCallback(() => {
    setSelectedIndex((current) =>
      current === null ? 0 : (current + 1) % photos.length,
    );
  }, [photos.length]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [lightboxOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (selectedIndex !== null) setSelectedIndex(null);
        else onClose();
        return;
      }

      if (selectedIndex !== null && event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
        return;
      }

      if (selectedIndex !== null && event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [],
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, selectedIndex, showNext, showPrevious]);

  useEffect(() => {
    if (selectedIndex === null || photos.length < 2) return;

    const adjacentIndexes = [
      (selectedIndex - 1 + photos.length) % photos.length,
      (selectedIndex + 1) % photos.length,
    ];
    adjacentIndexes.forEach((index) => {
      const image = new Image();
      image.src = photos[index].src;
    });
  }, [photos, selectedIndex]);

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX === null || endX === undefined) return;

    const distance = endX - startX;
    if (Math.abs(distance) < 48) return;
    if (distance > 0) showPrevious();
    else showNext();
  };

  return createPortal(
    <div
      className="project-gallery-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`project-gallery-dialog${currentPhoto ? " is-lightbox" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-gallery-title"
      >
        <header className="project-gallery-header">
          <div className="project-gallery-heading">
            {currentPhoto ? (
              <button
                type="button"
                className="project-gallery-back"
                onClick={() => setSelectedIndex(null)}
              >
                <ArrowLeft size={17} aria-hidden="true" />
                All photos
              </button>
            ) : (
              <span className="project-gallery-kicker">
                <Images size={16} aria-hidden="true" />
                Completed work
              </span>
            )}
            <h2 id="project-gallery-title">{project.name}</h2>
            <p>
              {currentPhoto
                ? `Photo ${selectedIndex + 1} of ${photos.length}`
                : `${photos.length} project ${photos.length === 1 ? "photo" : "photos"}`}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="project-gallery-close"
            onClick={onClose}
            aria-label={`Close ${project.name} project gallery`}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {currentPhoto ? (
          <div
            className="project-lightbox-stage"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              className="project-lightbox-nav project-lightbox-previous"
              onClick={showPrevious}
              aria-label="Show previous project photo"
            >
              <CaretLeft size={25} weight="bold" aria-hidden="true" />
            </button>
            <figure className="project-lightbox-figure">
              <div className="project-lightbox-image-wrap">
                <img
                  key={currentPhoto.src}
                  src={currentPhoto.src}
                  alt={currentPhoto.alt}
                  decoding="async"
                />
              </div>
              <figcaption>
                <span>{project.name}</span>
                <span>
                  {selectedIndex + 1} / {photos.length}
                </span>
              </figcaption>
            </figure>
            <button
              type="button"
              className="project-lightbox-nav project-lightbox-next"
              onClick={showNext}
              aria-label="Show next project photo"
            >
              <CaretRight size={25} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="project-gallery-scroll">
            <div className="project-gallery-grid">
              {photos.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  className="project-gallery-thumb"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`Open ${photo.alt}`}
                >
                  <span className="project-gallery-thumb-image">
                    <img
                      src={photo.thumbnail}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="project-gallery-thumb-label">
                    <span>Project photo</span>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
