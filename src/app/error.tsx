"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[route] Unhandled error", error);
  }, [error]);

  return (
    <main id="main" className="statusPage">
      <div className="container statusPanel">
        <span className="statusIcon" aria-hidden="true">
          <AlertTriangle />
        </span>
        <h1>Something went wrong</h1>
        <p>
          We could not load this page just now. This is usually temporary — please try again in a
          moment.
        </p>
        {error.digest ? <p className="statusMeta">Reference: {error.digest}</p> : null}

        <div className="actions">
          <button className="button gold" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="button ghost" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

