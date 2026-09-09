import Link from "next/link";
import Image from "next/image";
import { asset, NAV_LINKS, SOCIETY } from "@/config/site";

export default function SiteFooter() {
  return (
    <footer>
      <div className="container footerGrid">
        <div>
          <Image
            className="footerLogo"
            src={asset("/austin-arena-logo-white.svg")}
            width={357}
            height={116}
            alt={`${SOCIETY.name} logo`}
          />
          <h2>
            {SOCIETY.name} {SOCIETY.festival}
          </h2>
          <p>Celebrating devotion, culture and community.</p>
        </div>

        <div>
          <h3>Venue</h3>
          <address>{SOCIETY.address}</address>
        </div>

        <nav aria-label="Footer">
          <h3>Quick Navigation</h3>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="copyright">
          <p>
              &copy; 2026 {SOCIETY.committee} · गणपती बाप्पा मोरया!
          </p>
          <p>
              Crafted with ❤️ by Sarang Patil &amp; the Austin Arena Cultural Committee
          </p>
      </div>
    </footer>
  );
}
