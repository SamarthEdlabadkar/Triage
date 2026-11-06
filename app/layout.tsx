import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "SMART@Home · Clinician view",
  description:
    "Clinician view of patient-reported SMART@Home monitoring for a pre-visit review.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="/_ds/organic-e6834d6e-fce6-4963-9562-6075a72a4e0f/styles.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
