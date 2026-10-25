import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";

const companies = [
  {
    name: "Construction",
    path: "/construction",
    image: "/site-photos/building-structure.webp",
    description: "Warehouse construction & rental",
    action: "Explore construction",
    logo: "/cipl-construction-logo-transparent.png",
    logoWidth: 1271,
    logoHeight: 1238,
    className: "company-card-construction",
  },
  {
    name: "Logistics",
    path: "/logistics",
    image: "/site-photos/interior-1.webp",
    description: "Discover the logistics side of CIPL",
    action: "Explore logistics",
    logo: "/cipl-logistics-logo-transparent.png",
    logoWidth: 1965,
    logoHeight: 800,
    className: "company-card-logistics",
  },
];

export default function CompanySelection() {
  return (
    <div className="company-shell">
      <a href="#main-content" className="skip-link">
        Skip to company selection
      </a>
      <header className="company-header company-selection-header company-width">
        <Link to="/construction#contact" className="company-contact-link">
          Get in touch <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </header>

      <main id="main-content" className="company-main company-width">
        <div className="company-intro">
          <h1>Welcome to CIPL.</h1>
          <p>Choose the company you’d like to visit.</p>
        </div>

        <section className="company-choices" aria-label="Choose a company">
          {companies.map(
            ({
              name,
              path,
              image,
              description,
              action,
              logo,
              logoWidth,
              logoHeight,
              className,
            }) => (
              <Link
                to={path}
                key={path}
                className={`company-card ${className}`}
                aria-labelledby={`company-${name.toLowerCase()}`}
                aria-describedby={`company-${name.toLowerCase()}-description`}
              >
                <img
                  className="company-card-image"
                  src={image}
                  alt=""
                  width="1122"
                  height="1402"
                  fetchPriority="high"
                  decoding="async"
                />
                <span className="company-card-scrim" aria-hidden="true" />
                <span className="company-card-brand" aria-hidden="true">
                  <img
                    src={logo}
                    alt=""
                    width={logoWidth}
                    height={logoHeight}
                  />
                </span>
                <div className="company-card-content">
                  <h2 id={`company-${name.toLowerCase()}`}>
                    <span className="company-card-prefix">CIPL</span>
                    {name}
                  </h2>
                  <p id={`company-${name.toLowerCase()}-description`}>
                    {description}
                  </p>
                  <span className="company-card-action">
                    <span>{action}</span>
                    <span className="company-card-arrow" aria-hidden="true">
                      <ArrowRight size={22} />
                    </span>
                  </span>
                </div>
              </Link>
            ),
          )}
        </section>
      </main>

      <footer className="company-footer company-width">
        <p>© {new Date().getFullYear()} Chanithu International</p>
      </footer>
    </div>
  );
}
