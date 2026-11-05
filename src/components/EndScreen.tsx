"use client";

import type { CSSProperties, FC } from "react";
import { Fireworks } from "@fireworks-js/react";
import Snowfall from "react-snowfall";
import { TeamPlaque } from "./decor";

const SKY: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse at 50% 110%, color-mix(in oklab, var(--quiz-background) 70%, rgb(46 110 78) 30%), transparent 60%)",
};

const Crown: FC = () => (
  <svg
    aria-hidden
    viewBox="0 0 120 70"
    width={144}
    height={84}
    strokeWidth={3}
    strokeLinejoin="round"
    className="absolute left-1/2 -top-[74px] -translate-x-1/2"
  >
    <path
      d="M10 62 L4 14 L34 38 L60 4 L86 38 L116 14 L110 62 Z"
      className="fill-highlight stroke-highlight-deep"
    />
    <circle cx={60} cy={44} r={7} className="fill-accent" />
  </svg>
);

export const EndScreen: FC<{
  teamNames: [string, string];
  points: [number, number];
  doors: [number, number];
  consolation: [number, number];
  onConsolation: (team: 1 | 2) => void;
}> = ({ teamNames, points, doors, consolation, onConsolation }) => {
  const [p1, p2] = points;
  const winner = p1 === p2 ? null : p1 > p2 ? 1 : 2;

  return (
    // fixed er Stage-relativ pga. Stage-transformationen og uafhængig af wrapperen i index.tsx
    <div className="fixed inset-0 overflow-hidden bg-night" style={SKY}>
      <Fireworks autostart className="absolute inset-0" />
      <Snowfall
        color="white"
        radius={[1, 2.5]}
        opacity={[0.15, 0.5]}
        snowflakeCount={60}
      />

      <div aria-hidden className="absolute inset-0 z-10">
        <div className="absolute inset-x-0 bottom-0 h-[144px] rounded-[50%_50%_0_0/72px_72px_0_0] border-t-2 border-snow/40 bg-felt" />
        <div className="absolute -inset-x-12 bottom-0 h-[84px] rounded-[50%_50%_0_0/48px_48px_0_0] bg-paper opacity-90" />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center pt-[84px]">
        <p className="text-[22px] font-black uppercase tracking-[0.32em] text-highlight">
          Alle låger er åbnet
        </p>
        <h1 className="mt-1 font-display text-[144px] font-bold leading-none text-snow text-shadow-[0_7px_0_rgb(0_0_0/0.45),0_0_60px_color-mix(in_oklab,var(--quiz-highlight)_35%,transparent)]">
          {winner === null ? "Uafgjort!" : `${teamNames[winner - 1]} vinder!`}
        </h1>

        <div className="mt-[140px] flex items-end gap-[108px]">
          {([1, 2] as const).map((t) => (
            <div
              key={t}
              className={
                winner === null
                  ? ""
                  : winner === t
                    ? "origin-bottom scale-110 drop-shadow-[0_0_48px_var(--quiz-highlight)]"
                    : "mb-3"
              }
            >
              <TeamPlaque
                team={t}
                name={teamNames[t - 1]!}
                points={points[t - 1]!}
                doors={doors[t - 1]!}
                consolation={consolation[t - 1]!}
                size="end"
                onClick={() => onConsolation(t)}
              >
                {winner === t && <Crown />}
              </TeamPlaque>
            </div>
          ))}
        </div>

        <p className="mt-[67px] font-display text-[53px] font-bold text-highlight">
          Glædelig jul!
        </p>
      </div>
    </div>
  );
};
