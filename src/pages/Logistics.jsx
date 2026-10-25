import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  EnvelopeSimple,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import CompanyBrand from "../components/CompanyBrand";
import LogisticsLocationMap from "../components/LogisticsLocationMap";
import { LOGISTICS_LOCATION } from "../lib/logisticsLocation";
import aerialView from "../assets/logistics/distribution-center-aerial.webp";
import frontView from "../assets/logistics/distribution-center-front.webp";
import overheadView from "../assets/logistics/distribution-center-overhead.webp";

const facilityPhotos = [
  {
    src: aerialView,
    alt: "Angled aerial view of the silver-roofed CIPL distribution center and its surrounding yard",
    caption: "Aerial view",
  },
  {
    src: frontView,
    alt: "Front aerial view of the CIPL distribution center beside the road",
    caption: "Front view",
  },
  {
    src: overheadView,
    alt: "Overhead view of the CIPL distribution center's silver warehouse roof",
    caption: "Overhead view",
  },
];

export default function Logistics() {
  return (
    <div className="company-shell logistics-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="company-header company-width">
        <CompanyBrand company="logistics" />
        <Link to="/" className="company-contact-link">
          <ArrowLeft size={17} aria-hidden="true" /> Switch company
        </Link>
      </header>

      <main id="main-content" className="logistics-main company-width">
        <section
          className="logistics-facility"
          aria-labelledby="distribution-center-heading"
        >
          <h1 id="distribution-center-heading">Our 3PL distribution center</h1>
          <div className="logistics-facility-gallery">
            {facilityPhotos.map(({ src, alt, caption }, index) => (
              <figure
                key={src}
                className={`logistics-facility-photo${index === 0 ? " logistics-facility-featured" : ""}`}
              >
                <img
                  src={src}
                  alt={alt}
                  width="1672"
                  height="941"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
                <figcaption>{caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
        <section
          className="logistics-visit"
          aria-labelledby="logistics-contact-heading"
        >
          <LogisticsLocationMap />
          <div className="logistics-contact">
            <h2 id="logistics-contact-heading">Find us. Get in touch.</h2>
            <p className="logistics-contact-intro">
              Find your way to our distribution center, or contact our team.
            </p>
            <address className="logistics-contact-details">
              <a
                className="logistics-contact-row"
                href={`mailto:${LOGISTICS_LOCATION.email}`}
              >
                <span className="logistics-contact-icon" aria-hidden="true">
                  <EnvelopeSimple size={23} />
                </span>
                <span className="logistics-contact-value">
                  <span>Email</span>
                  <strong>{LOGISTICS_LOCATION.email}</strong>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <a
                className="logistics-contact-row"
                href={LOGISTICS_LOCATION.phoneHref}
              >
                <span className="logistics-contact-icon" aria-hidden="true">
                  <Phone size={23} />
                </span>
                <span className="logistics-contact-value">
                  <span>Phone</span>
                  <strong>{LOGISTICS_LOCATION.phone}</strong>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <div className="logistics-contact-row logistics-contact-address">
                <span className="logistics-contact-icon" aria-hidden="true">
                  <MapPin size={23} />
                </span>
                <div className="logistics-contact-value">
                  <span>Distribution center</span>
                  <p>
                    {LOGISTICS_LOCATION.address}
                    <br />
                    {LOGISTICS_LOCATION.locality}
                  </p>
                  <a
                    className="logistics-directions-link"
                    href={LOGISTICS_LOCATION.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions
                    <ArrowUpRight size={17} aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </div>
            </address>
          </div>
        </section>
        <nav className="logistics-page-links" aria-label="CIPL companies">
          <Link to="/" className="btn btn-dark">
            <ArrowLeft size={18} aria-hidden="true" /> Back to our companies
          </Link>
          <Link to="/construction" className="logistics-construction-link">
            Looking for CIPL Construction?{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </nav>
      </main>

      <footer className="company-footer company-width">
        <p>© {new Date().getFullYear()} Chanithu International</p>
        <Link to="/">CIPL Construction &amp; CIPL Logistics</Link>
      </footer>
    </div>
  );
}
