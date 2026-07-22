import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";
import { useReducedMotion } from "framer-motion";

const NAV_ITEMS = [
  ["Home", "/"],
  ["Client Portal", "/client"],
  ["Admin Portal", "/admin"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollMarker = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const marker = scrollMarker.current;
    if (!marker) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const contact = () => {
    setOpen(false);
    if (location.pathname === "/") {
      document
        .querySelector("#contact")
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      navigate("/#contact");
    }
  };

  return (
    <Fragment>
      <span
        ref={scrollMarker}
        className="pointer-events-none absolute top-12 h-px w-px"
        aria-hidden="true"
      />
      <header
        className={`nav-shell fixed inset-x-0 top-0 px-3 pt-3 md:px-6 md:pt-4 ${scrolled ? "nav-shell-scrolled" : ""}`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <nav
          className={`nav-glass ${scrolled ? "nav-glass-scrolled" : ""} relative mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-3 md:h-[72px] md:px-3`}
          aria-label="Primary"
        >
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 text-[var(--ink)]"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_4px_14px_rgba(18,50,84,.1)]">
              <img
                src="/cipl-logo.jpg"
                alt="CIPL"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="heading min-w-0 text-[13px] leading-tight tracking-[-.01em] sm:text-sm">
              <span className="block truncate">Chanithu International</span>
              <small className="mt-0.5 block text-[9px] font-medium uppercase tracking-[.16em] text-slate-500">
                Pvt Ltd
              </small>
            </span>
          </Link>

          <button
            className="grid min-h-11 min-w-11 place-items-center rounded-full text-[var(--ink)] transition-colors hover:bg-white/70 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="primary-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? <X size={22} /> : <List size={22} />}
          </button>

          <div
            id="primary-menu"
            className={`${open ? "flex" : "hidden"} nav-menu-glass absolute left-0 right-0 top-[calc(100%+.55rem)] flex-col gap-2 p-3 md:static md:flex md:flex-row md:items-center md:gap-1 md:p-1.5`}
          >
            {NAV_ITEMS.map(([name, path]) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={`nav-menu-link flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors md:px-3.5 ${active ? "nav-menu-link-active text-[var(--ink)]" : "text-slate-600 hover:text-[var(--ink)]"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {name}
                </Link>
              );
            })}
            <button onClick={contact} className="btn btn-primary nav-contact">
              Contact us
            </button>
          </div>
        </nav>
      </header>
    </Fragment>
  );
}
