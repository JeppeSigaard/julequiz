"use client";

import { FunctionComponent } from "react";

const TEAM_NAME = {
  1: "text-team-1-deep",
  2: "text-team-2-deep",
} as const;

const PLUS_BUTTON = {
  1: "bg-team-1 text-team-1-ink shadow-pill-team-1",
  2: "bg-team-2 text-team-2-ink shadow-pill-team-2",
} as const;

const MINUS_BUTTON = "bg-ink/10 text-ink-soft";

export const TeamPointsSetting: FunctionComponent<{
  teamNames: readonly [string, string];
  step: number;
  onAdjust: (team: 1 | 2, amount: number) => void;
}> = (props) => {
  const amounts = [...new Set([-props.step, -5, 5, props.step])];

  return (
    <div className="flex flex-col gap-[18px]">
      <h3 className="font-display text-[44px] font-bold leading-none">Point</h3>
      {([1, 2] as const).map((team) => {
        const name = props.teamNames[team - 1];
        return (
          <div key={team} className="flex items-center gap-[14px]">
            <span
              className={`w-[220px] truncate font-black uppercase tracking-[0.08em] text-[26px] ${TEAM_NAME[team]}`}
            >
              {name}
            </span>
            {amounts.map((amount) => {
              const label = `${amount > 0 ? "+" : "−"}${Math.abs(amount)}`;
              return (
                <button
                  key={amount}
                  type="button"
                  aria-label={`${name}: ${label} point`}
                  className={`cursor-pointer h-[64px] w-[106px] rounded-full font-black text-[26px] ${
                    amount > 0 ? PLUS_BUTTON[team] : MINUS_BUTTON
                  }`}
                  onClick={() => props.onAdjust(team, amount)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
