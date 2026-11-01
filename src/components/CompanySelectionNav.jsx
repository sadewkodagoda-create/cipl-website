import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, List, X } from "@phosphor-icons/react";

const LINKS = [
  ["About CIPL", "/construction#about"],
  ["Contact us", "/construction#contact"],
];

export default function CompanySelectionNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const markerRef = useRef(null);
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting);
    });
    observer.observe(markerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 640px)");
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <>
      <span
        className="company-nav-scroll-marker"
        ref={markerRef}
        aria-hidden="true"
      />
      <header className="company-header company-selection-header">
        <nav
          ref={navRef}
          className={`company-selection-nav${scrolled ? " is-scrolled" : ""}`}
          aria-label="Company navigation"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setOpen(false);
          }}
        >
          <Link
            className="company-nav-brand"
            to="/"
            aria-label="CIPL home"
            onClick={() => setOpen(false)}
          >
            CIPL
          </Link>
          <div className="company-nav-desktop-links">
            {LINKS.map(([label, to]) => (
              <Link key={to} to={to} className="company-nav-link">
                {label}
              </Link>
            ))}
            <span className="company-nav-divider" aria-hidden="true" />
          </div>
          <Link
            to="/construction#contact"
            className="company-nav-cta"
            onClick={() => setOpen(false)}
          >
            Get in touch <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <button
            ref={menuButtonRef}
            className="company-nav-toggle"
            type="button"
            aria-label={
              open ? "Close company navigation" : "Open company navigation"
            }
            aria-expanded={open}
            aria-controls="company-mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <List size={23} aria-hidden="true" />
            )}
          </button>
          {open && (
            <div
              className="company-nav-mobile-menu"
              id="company-mobile-navigation"
            >
              {LINKS.map(([label, to]) => (
                <Link key={to} to={to} onClick={() => setOpen(false)}>
                  {label}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
