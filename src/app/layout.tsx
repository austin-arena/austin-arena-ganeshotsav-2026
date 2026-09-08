import type { Metadata, Viewport } from "next";
import { SITE_URL, SOCIETY } from "@/config/site";
import "./globals.css";

const title = `${SOCIETY.name} ${SOCIETY.festival}`;
const description = `Ganeshotsav events, aarti schedule, volunteer contributions and registrations for ${SOCIETY.name}, ${SOCIETY.locality}, Pune.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  applicationName: title,
  keywords: [
    "Ganeshotsav 2026",
    "Ganpati festival",
    `${SOCIETY.name} society`,
    "Tathawade Pune events",
    "society Ganpati schedule",
    "aarti timings",
    "Visarjan",
  ],
  authors: [{ name: SOCIETY.committee }],
  creator: SOCIETY.committee,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: title,
    title,
    description,
    url: SITE_URL,
    locale: "en_IN",
    images: [{ url: "/austin-arena-logo.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/austin-arena-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/austin-arena-logo.png" }],
  },
  formatDetection: { telephone: true, address: false, email: true },
};

export const viewport: Viewport = {
  themeColor: "#63160d",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a className="skipLink" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
