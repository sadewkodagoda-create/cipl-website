import { Link } from "react-router-dom";

export default function CompanyBrand({ company }) {
  if (company === "logistics") {
    return (
      <Link
        to="/logistics"
        className="company-brand company-brand-logistics"
        aria-label="CIPL Logistics home"
      >
        <img
          className="company-logistics-logo"
          src="/cipl-logistics-logo-transparent.png"
          alt="CIPL Logistics"
          width="1965"
          height="800"
        />
      </Link>
    );
  }

  return (
    <Link to="/" className="company-brand" aria-label="CIPL company selection">
      <span className="company-brand-logo">
        <img
          src="/cipl-construction-logo-transparent.png"
          alt=""
          width="1271"
          height="1238"
        />
      </span>
      <span className="company-brand-name">
        <strong>Chanithu International</strong>
        <span>Construction &amp; logistics</span>
      </span>
    </Link>
  );
}
