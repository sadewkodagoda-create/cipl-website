import { ArrowUpRight } from "@phosphor-icons/react";
import "./CirvelCredit.css";

export default function CirvelCredit() {
  return (
    <a
      className="cirvel-credit"
      href="https://cirvelit.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Made by Cirvel. Visit cirvelit.com (opens in a new tab)"
    >
      <span className="cirvel-credit-copy">
        <span>Made by</span>
        <strong>Cirvel</strong>
      </span>
      <span className="cirvel-credit-arrow" aria-hidden="true">
        <ArrowUpRight size={15} weight="bold" />
      </span>
    </a>
  );
}
