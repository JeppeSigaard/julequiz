"use client";

import { useEffect, useState, type CSSProperties, type FC, type ReactNode } from "react";
import type { Quiz } from "../types";

const WIDTH = 1920;
const HEIGHT = 1080;

const FELT_TEXTURE = [
  "radial-gradient(ellipse at 50% 30%, color-mix(in oklab, var(--quiz-background) 70%, rgb(46 110 78) 30%), rgb(0 0 0 / 0) 70%)",
  "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.025) 0 2px, rgb(0 0 0 / 0) 2px 14px)",
  "repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.025) 0 2px, rgb(0 0 0 / 0) 2px 14px)",
].join(", ");

export const Stage: FC<{ colors: Quiz["colors"]; children: ReactNode }> = ({ colors, children }) => {
  // Siden prerenderes, så første klient-render skal være skala 1; den rigtige skala sættes i effekten.
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const vars = {
    "--quiz-background": colors.background,
    "--quiz-paper": colors.paper,
    "--quiz-ink": colors.ink,
    "--quiz-accent": colors.accent,
    "--quiz-highlight": colors.highlight,
    "--quiz-team1": colors.team1,
    "--quiz-team2": colors.team2,
  } as CSSProperties;

  return (
    <div className="fixed inset-0 overflow-hidden bg-night" style={vars}>
      <div
        className="absolute left-1/2 top-1/2 w-[1920px] h-[1080px] overflow-hidden bg-felt font-body text-snow"
        style={{
          transformOrigin: "center",
          transform: `translate(-50%, -50%) scale(${scale})`,
          backgroundImage: FELT_TEXTURE,
        }}
      >
        {children}
      </div>
    </div>
  );
};
