"use client";

import type { FC } from "react";
import { Fireworks } from "@fireworks-js/react";
import { AnimatedNumber } from "./AnimatedNumber";

export const EndScreen: FC<{
  teamNames: [string, string];
  points: [number, number];
  doors: [number, number];
  consolation: [number, number];
  onConsolation: (team: 1 | 2) => void;
}> = ({ teamNames, points, onConsolation }) => (
  <>
    <Fireworks autostart className="absolute inset-0" />
    <div className="absolute inset-0 flex items-center justify-center gap-[480px]">
      {([1, 2] as const).map((team) => (
        <button
          key={team}
          type="button"
          className={`relative z-20 cursor-pointer text-snow text-shadow-[0_4px_24px_rgb(0_0_0/0.6)] ${team === 1 ? "text-left" : "text-right"}`}
          onClick={() => onConsolation(team)}
        >
          <span className="block uppercase font-extrabold text-[72px]">{teamNames[team - 1]}</span>
          <span className="block font-bold text-[56px]">
            <AnimatedNumber value={points[team - 1]!} /> point
          </span>
        </button>
      ))}
    </div>
  </>
);
