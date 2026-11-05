"use client";

import { FunctionComponent } from "react";

const TEAM = {
  1: {
    badge: "bg-team-1 text-team-1-ink",
    input: "border-team-1-deep/45 focus:border-team-1-deep text-team-1-deep",
  },
  2: {
    badge: "bg-team-2 text-team-2-ink",
    input: "border-team-2-deep/45 focus:border-team-2-deep text-team-2-deep",
  },
};

// Grænsen holder navnet på én linje på holdets plakette.
const MAX_LENGTH = 18;

export const TeamNamesSetting: FunctionComponent<{
  names: [string, string];
  defaults: [string, string];
  onChange: (team: 1 | 2, name: string) => void;
}> = (props) => (
  <div className="flex flex-col gap-4">
    <h3 className="font-display text-[44px] font-bold leading-none">Holdnavne</h3>
    {([1, 2] as const).map((team) => (
      <label key={team} className="flex items-center gap-5">
        <span
          aria-hidden="true"
          className={`flex size-[60px] flex-none items-center justify-center rounded-full font-display text-[40px] font-bold ${TEAM[team].badge}`}
        >
          {team}
        </span>
        <span className="sr-only">Navn på hold {team}</span>
        <input
          type="text"
          value={props.names[team - 1]}
          placeholder={props.defaults[team - 1]}
          maxLength={MAX_LENGTH}
          spellCheck={false}
          onChange={(event) => props.onChange(team, event.target.value)}
          className={`w-[560px] rounded-[16px] border-2 bg-paper-lit px-6 py-3 text-[30px] font-black uppercase tracking-[0.08em] outline-none placeholder:text-ink-soft/50 ${TEAM[team].input}`}
        />
      </label>
    ))}
    <p className="text-[22px] font-semibold text-ink-soft">
      Et tomt felt bruger pakkens navn. Navnene huskes, også efter nulstilling.
    </p>
  </div>
);
