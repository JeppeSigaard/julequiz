import "../styles.css";

import type { ReactNode } from "react";

import { asset } from "../asset";
import { SITE_URL } from "../config";

const TITLE = "Den Store Julequiz";
const DESCRIPTION = "Julekalender-quiz for to hold med 24 låger, musik og gåder.";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="font-body">
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <meta name="theme-color" content="#0e2c22" />
      <link rel="icon" type="image/svg+xml" href={asset("/images/icon.svg")} />
      <link rel="icon" type="image/png" sizes="32x32" href={asset("/images/favicon.png")} />
      <link rel="apple-touch-icon" href={asset("/images/apple-touch-icon.png")} />
      <link rel="manifest" href={asset("/site.webmanifest")} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={TITLE} />
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:locale" content="da_DK" />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={`${SITE_URL}images/og-image.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Julekalenderen med 24 låger og to holds pointtavler"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@400;700&family=Nunito:wght@400..900&display=swap"
        precedence="font"
      />
      {children}
    </div>
  );
}
