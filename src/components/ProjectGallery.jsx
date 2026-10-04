import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  Images,
  MagnifyingGlassPlus,
  X,
} from "@phosphor-icons/react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ProjectGallery({ project, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const scrollRef = useRef(null);
  const galleryPositionRef = useRef({ scrollTop: 0, photoIndex: null });
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
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
    const pageRoot = document.getElementById("root");
    const previousInert = pageRoot?.inert;
    document.body.style.overflow = "hidden";
    if (pageRoot) pageRoot.inert = true;

    return () => {
      document.body.style.overflow = previousOverflow;
      if (pageRoot) pageRoot.inert = previousInert;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const { scrollTop, photoIndex } = galleryPositionRef.current;
    if (!lightboxOpen && photoIndex !== null && scrollRef.current) {
      scrollRef.current.scrollTop = scrollTop;
      scrollRef.current
        .querySelector(`[data-photo-index="${photoIndex}"]`)
        ?.focus({ preventScroll: true });
    } else {
      closeButtonRef.current?.focus();
    }
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
    touchStartYRef.current = event.changedTouches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (
      startX === null ||
      endX === undefined ||
      startY === null ||
      endY === undefined
    )
      return;

    const distance = endX - startX;
    if (
      Math.abs(distance) < 48 ||
      Math.abs(distance) <= Math.abs(endY - startY)
    )
      return;
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
            <p aria-live="polite" aria-atomic="true">
              {currentPhoto
                ? `Photo ${selectedIndex + 1} of ${photos.length}`
                : photos.length === 0
                  ? "Project photo gallery"
                  : `${photos.length} project ${photos.length === 1 ? "photo" : "photos"}. Select a photo to view in full.`}
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
          <div className="project-lightbox-content">
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
                    width={currentPhoto.width}
                    height={currentPhoto.height}
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
            <nav
              className="project-lightbox-filmstrip"
              aria-label={`${project.name} photos`}
            >
              {photos.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  className="project-lightbox-preview"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`View photo ${index + 1} of ${photos.length}`}
                  aria-pressed={index === selectedIndex}
                >
                  <img src={photo.thumbnail} alt="" decoding="async" />
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <div ref={scrollRef} className="project-gallery-scroll">
            {photos.length === 0 && (
              <div className="project-gallery-empty">
                <Images size={40} weight="light" aria-hidden="true" />
                <h3>No project photos available yet.</h3>
                <p>Please explore our other company galleries.</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Back to projects
                </button>
              </div>
            )}
            <div
              className={`project-gallery-grid${photos.length === 4 ? " project-gallery-grid-three" : ""}`}
            >
              {photos.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  className={`project-gallery-thumb${index === 0 ? " project-gallery-feature" : ""}`}
                  data-photo-index={index}
                  onClick={() => {
                    galleryPositionRef.current = {
                      scrollTop: scrollRef.current.scrollTop,
                      photoIndex: index,
                    };
                    setSelectedIndex(index);
                  }}
                  aria-label={`Open ${photo.alt}`}
                >
                  <span className="project-gallery-thumb-image">
                    <img
                      src={index === 0 ? photo.src : photo.thumbnail}
                      alt=""
                      aria-hidden="true"
                      width={photo.width}
                      height={photo.height}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </span>
                  <span className="project-gallery-thumb-label">
                    <span>Photo {String(index + 1).padStart(2, "0")}</span>
                    <MagnifyingGlassPlus size={19} aria-hidden="true" />
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
