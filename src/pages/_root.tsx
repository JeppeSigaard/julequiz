import type { ReactNode } from "react";
import { ErrorBoundary } from "waku/router/client";

type RootProps = { children: ReactNode };

// Findes kun for at sætte lang; skal beholde Wakus ErrorBoundary som DefaultRoot.
export default async function Root({ children }: RootProps) {
  return (
    <ErrorBoundary>
      <html lang="da">
        <head></head>
        <body>{children}</body>
      </html>
    </ErrorBoundary>
  );
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
