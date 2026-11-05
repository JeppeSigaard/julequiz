import "../styles.css";

import type { ReactNode } from "react";

import { asset } from "../asset";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="font-body">
      <meta name="description" content="Julequiz" />
      <link rel="icon" type="image/png" href={asset("/images/favicon.png")} />
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
