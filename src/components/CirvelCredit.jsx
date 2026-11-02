import "./CirvelCredit.css";

export default function CirvelCredit() {
  return (
    <a
      className="cirvel-credit"
      href="https://cirvelit.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Built by Cirvel. Visit cirvelit.com (opens in a new tab)"
    >
      <span className="cirvel-credit-badge">
        <img
          src="/cirvel-built-by-badge.png"
          alt="Built by Cirvel"
          width="2172"
          height="724"
          loading="lazy"
          decoding="async"
        />
      </span>
    </a>
  );
}
