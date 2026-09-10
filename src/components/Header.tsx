"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { asset } from "@/config/site";

interface NavItem {
  href: string;
  label: string;
  cta?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/#aarti", label: "Aarti" },
  { href: "/#today", label: "Today’s Event" },
  { href: "/events", label: "All Events" },
  { href: "/#contribute", label: "Contribute" },
  // { href: "/#register", label: "Register", cta: true },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [renderedPath, setRenderedPath] = useState(pathname);

  // Close the drawer when the route changes, adjusting state during render
  // rather than in an effect (avoids a cascading re-render).
  if (pathname !== renderedPath) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  // Lock background scrolling and allow Escape to dismiss the drawer.
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="siteHeader">
      <div className="container nav">
        <Link className="brand" href="/" aria-label="Austin Arena Ganeshotsav — home">
          <span className="brandLogo">
            <Image
              src={asset("/austin-arena-logo-white.svg")}
              width={357}
              height={116}
              alt="Austin Arena"
              priority
            />
          </span>
          <span className="brandText">
            <strong>Ganeshotsav</strong>
            <small>2026 · Austin Arena</small>
          </span>
        </Link>

        <button
          className="menu"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          type="button"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav id="site-nav" className={open ? "open" : ""} aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, cta }) => (
            <Link
              key={href}
              href={href}
              className={cta ? "navCta" : "navLink"}
              aria-current={href === pathname ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {open ? (
        <button
          className="navScrim"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
