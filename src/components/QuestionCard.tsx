import { FunctionComponent } from "react";
import * as motion from "motion/react-client";
import openSFX from "../sfx/levelup.mp3";
import useSound from "use-sound";

type Status = "closed" | "skip" | "nobody" | "team-1" | "team-2";

const OPENED = {
  "team-1": { rosette: "bg-team-1 text-team-1-ink shadow-[0_0_0_4px_rgb(255_255_255/0.08),0_0_26px_var(--quiz-team1)]", mark: "1", name: "text-snow" },
  "team-2": { rosette: "bg-team-2 text-team-2-ink shadow-[0_0_0_4px_rgb(255_255_255/0.08),0_0_26px_var(--quiz-team2)]", mark: "2", name: "text-snow" },
  nobody: { rosette: "bg-felt text-mist shadow-[0_0_0_4px_rgb(255_255_255/0.08)]", mark: "–", name: "text-mist" },
};

const Doodle: FunctionComponent<{ variant: number }> = ({ variant }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="absolute left-[8cqmin] top-[7cqmin] size-[13cqmin]"
  >
    {variant === 0 && (
      <path d="M12 2 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" className="fill-highlight-deep" />
    )}
    {variant === 1 && (
      <path
        d="M12 2 V22 M3.3 7 L20.7 17 M3.3 17 L20.7 7"
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        className="stroke-accent"
      />
    )}
    {variant === 2 && (
      <path
        d="M12 3 V21 M4 8 L20 16 M20 8 L4 16 M4 12 H20"
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        className="stroke-ink-soft"
      />
    )}
    {variant === 3 && (
      <g className="fill-highlight-deep">
        <circle cx="7" cy="14" r="3" />
        <circle cx="16" cy="8" r="3" />
        <circle cx="17" cy="18" r="2" />
      </g>
    )}
  </svg>
);

export const QuestionCard: FunctionComponent<{
  number: number;
  doorWord: string;
  status: Status;
  teamName?: string;
  glow?: boolean;
  onClick: () => void;
}> = ({ number, doorWord, status, teamName, glow, onClick }) => {
  const [play] = useSound(openSFX);
  const handleClick = () => {
    play();
    onClick();
  };

  const tilt = (((number - 1) * 37) % 7 - 3) * 0.45;
  // Typen skaleres med lågens størrelse (container-enheder), så den virker for ethvert antal låger; kræver en definit størrelse.
  const wrapper = "relative h-full w-full [container-type:size]";
  const style = { transform: `rotate(${tilt}deg)` };

  if (status === "closed") {
    return (
      <div className={wrapper} style={style}>
        <button
          type="button"
          aria-label={`${doorWord} ${number}`}
          onClick={handleClick}
          className={`absolute inset-0 cursor-pointer rounded-[19px] transition-colors duration-500 ${
            glow ? "bg-paper-lit animate-glow" : "bg-paper shadow-paper-edge hover:bg-paper-lit"
          }`}
        >
          <span aria-hidden="true" className="absolute inset-[10px] rounded-[12px] border-2 border-dashed border-accent/40" />
          <Doodle variant={number % 4} />
          <span aria-hidden="true" className="absolute right-[6cqmin] top-1/2 size-[7cqmin] -translate-y-1/2 rounded-full bg-highlight-deep" />
          <span className="relative font-display text-[59cqmin] font-bold leading-none text-accent [text-shadow:0_2px_0_rgb(255_255_255/0.6)]">
            {number}
          </span>
        </button>
      </div>
    );
  }

  if (status === "skip") {
    return (
      <div className={wrapper} style={style}>
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[19px] border-2 border-dashed border-mist/25 bg-night/30"
        >
          <span className="font-display text-[59cqmin] font-bold leading-none text-mist/40">{number}</span>
        </div>
      </div>
    );
  }

  const opened = OPENED[status];
  return (
    <div className={wrapper} style={style}>
      <div
        aria-label={`${doorWord} ${number}: ${teamName ?? "Ingen"}`}
        className="absolute inset-0 rounded-[19px] bg-night shadow-[inset_0_6px_16px_rgb(0_0_0/0.7)] ring-1 ring-paper/10 [perspective:350cqmin] [perspective-origin:left]"
      >
        {/* Bredde og perspektiv følger lågens mindste side, så bladet ikke svulmer op i brede celler. */}
        <motion.div
          aria-hidden="true"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -62 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 w-[min(40%,76cqmin)] origin-left rounded-l-[19px] bg-paper-edge shadow-[6px_0_14px_rgb(0_0_0/0.45)]"
        />
        <div className="absolute inset-y-0 left-[min(40%,76cqmin)] right-0 flex items-center justify-center gap-[8cqmin] px-[4cqmin]">
          <span
            aria-hidden="true"
            className={`flex size-[36cqmin] flex-none items-center justify-center rounded-full font-display text-[22cqmin] font-bold leading-none ${opened.rosette}`}
          >
            {opened.mark}
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[10cqmin] font-extrabold uppercase tracking-[0.1em] text-mist">
              {doorWord} {number}
            </span>
            <span className={`truncate text-[17cqmin] font-black ${opened.name}`}>{teamName ?? "Ingen"}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
