import type { FC } from "react";
import { TeamPlaque } from "../decor";

export const BoardHeader: FC<{
  title: string;
  doorCount: number;
  teamNames: readonly [string, string];
  points: readonly [number, number];
  doors: readonly [number, number];
  consolation: readonly [number, number];
  onConsolation: (team: 1 | 2) => void;
  onTitleClick: () => void;
  lit: boolean;
}> = ({
  title,
  doorCount,
  teamNames,
  points,
  doors,
  consolation,
  onConsolation,
  onTitleClick,
  lit,
}) => {
  const light = lit ? "animate-flicker" : "[filter:brightness(0.3)_saturate(0.4)]";
  return (
    <div className="flex h-[214px] flex-none items-start justify-between">
      <div className="mt-[10px]">
        <TeamPlaque
          team={1}
          size="board"
          name={teamNames[0]}
          points={points[0]}
          doors={doors[0]}
          consolation={consolation[0]}
          onClick={() => onConsolation(1)}
        />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[18px] font-extrabold uppercase tracking-[0.32em] text-highlight">
          {doorCount} låger · 2 hold · 1 vinder
        </span>
        <h1 className={light}>
          <button
            type="button"
            onClick={onTitleClick}
            className="cursor-pointer font-display text-[125px] font-bold leading-none text-snow [text-shadow:0_6px_0_color-mix(in_oklab,var(--quiz-background)_55%,black),0_0_30px_color-mix(in_oklab,var(--quiz-highlight)_35%,transparent)]"
          >
            {title}
          </button>
        </h1>
        <svg aria-hidden="true" width={504} height={31} viewBox="0 0 420 26" className={light}>
          <path
            d="M6 16 C 90 2, 160 26, 210 13 S 330 2, 414 14"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-highlight"
          />
          <path
            d="M210 4 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z"
            className="fill-highlight"
          />
        </svg>
      </div>
      <div className="mt-[10px]">
        <TeamPlaque
          team={2}
          size="board"
          name={teamNames[1]}
          points={points[1]}
          doors={doors[1]}
          consolation={consolation[1]}
          onClick={() => onConsolation(2)}
        />
      </div>
    </div>
  );
};
