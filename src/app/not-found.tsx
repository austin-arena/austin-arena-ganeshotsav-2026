import Link from "next/link";
import { Compass } from "lucide-react";
import Header from "@/components/Header";
import SiteFooter from "@/components/common/SiteFooter";

export default function NotFound() {
  return (
    <>
      <Header />

      <main id="main" className="statusPage">
        <div className="container statusPanel">
          <span className="statusIcon" aria-hidden="true">
            <Compass />
          </span>
          <h1>Page not found</h1>
          <p>
            The page you are looking for has moved or never existed. Explore the festival schedule
            instead.
          </p>

          <div className="actions">
            <Link className="button gold" href="/">
              Back to home
            </Link>
            <Link className="button ghost" href="/events">
              View all events
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

