import type { ComponentProps, FC, ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

const STITCH = {
  accent: "border-accent/55",
  "team-1": "border-team-1-deep",
  "team-2": "border-team-2-deep",
  highlight: "border-highlight-deep",
};

export const Paper: FC<{
  stitch?: "accent" | "team-1" | "team-2" | "highlight";
  stitchSize?: string;
  className?: string;
  children: ReactNode;
}> = ({ stitch = "accent", stitchSize = "inset-[10px] rounded-[12px] border-2", className, children }) => (
  <div className={`relative bg-paper shadow-paper-edge rounded-[19px] text-ink ${className ?? ""}`}>
    <div aria-hidden="true" className={`absolute border-dashed ${stitchSize} ${STITCH[stitch]}`} />
    {children}
  </div>
);

const KEY_TONE = {
  "on-light": "border-ink-soft/40 text-ink-soft",
  "on-dark": "border-snow/45",
};

export const KeyCap: FC<{ tone?: "on-light" | "on-dark"; children: ReactNode }> = ({
  tone = "on-light",
  children,
}) => (
  <span className={`inline-block rounded-[10px] border-2 px-3 py-1 text-[18px] font-extrabold ${KEY_TONE[tone]}`}>
    {children}
  </span>
);

const PILL = {
  "team-1": "bg-team-1 text-team-1-ink text-[34px] shadow-pill-team-1",
  "team-2": "bg-team-2 text-team-2-ink text-[34px] shadow-pill-team-2",
  dark: "bg-ink text-snow text-[34px] shadow-pill-dark",
  neutral: "bg-ink/10 text-ink-soft text-[26px]",
};

export const PillButton: FC<
  ComponentProps<"button"> & { variant: "team-1" | "team-2" | "neutral" | "dark"; keyHint?: string }
> = ({ variant, keyHint, className, children, ...rest }) => (
  <button
    {...rest}
    className={`cursor-pointer flex items-center justify-center gap-4 rounded-full px-9 py-5 font-black min-w-[276px] ${PILL[variant]} ${className ?? ""}`}
  >
    {children}
    {keyHint !== undefined && (
      <KeyCap tone={variant === "team-1" || variant === "dark" ? "on-dark" : "on-light"}>{keyHint}</KeyCap>
    )}
  </button>
);

const PLAQUE = {
  board: {
    width: "w-[360px]",
    paper: "px-[26px] py-[17px] gap-[19px] rounded-[22px]",
    badge: "size-[70px] text-[48px]",
    name: { size: 26, minSize: 16, width: 219 },
    points: "text-[70px]",
    unit: "text-[22px]",
    meta: "text-[17px]",
    stitch: "inset-[10px] rounded-[12px] border-2",
  },
  end: {
    width: "w-[440px]",
    paper: "px-[34px] py-[28px] gap-[6px] rounded-[26px]",
    badge: "",
    name: { size: 36, minSize: 22, width: 372 },
    points: "text-[158px]",
    meta: "text-[24px]",
    stitch: "inset-[12px] rounded-[18px] border-[3px]",
  },
};

// Navnets plads (`width`) er plakettens bredde minus padding, badge og gap ovenfor.
// Et versal i navnets font er i snit 0,79em bredt inkl. tracking; lidt luft lagt til.
const NAME_EM_PER_CHAR = 0.82;

// Lange navne krymper, så det længste ord står på én linje og hele navnet på højst to.
// Under minSize ombrydes midt i ordet i stedet.
function nameFontSize(name: string, fit: { size: number; minSize: number; width: number }): number {
  const longestWord = Math.max(...name.split(/\s+/).map((word) => word.length));
  const charsPerLine = Math.max(longestWord, name.length / 2);
  const fitted = fit.width / (charsPerLine * NAME_EM_PER_CHAR);
  return Math.max(fit.minSize, Math.min(fit.size, fitted));
}

const PLAQUE_TEAM = {
  1: {
    rotate: "-rotate-2",
    badge: "bg-team-1 text-team-1-ink",
    name: "text-team-1-deep",
    row: "",
  },
  2: {
    rotate: "rotate-2",
    badge: "bg-team-2 text-team-2-ink",
    name: "text-team-2-deep",
    row: "flex-row-reverse text-right",
  },
};

export const TeamPlaque: FC<{
  team: 1 | 2;
  name: string;
  points: number;
  doors: number;
  consolation: number;
  size: "board" | "end";
  onClick: () => void;
  children?: ReactNode;
}> = ({ team, name, points, doors, consolation, size, onClick, children }) => {
  const s = PLAQUE[size];
  const t = PLAQUE_TEAM[team];
  const stitch = team === 1 ? "team-1" : "team-2";
  const unit = (
    <span className={`font-body font-extrabold text-ink-soft ${PLAQUE.board.unit}`}>point</span>
  );
  return (
    <button
      type="button"
      aria-label={`${name}: ${points} point. Klik giver 5 trøstepoint`}
      onClick={onClick}
      className={`relative cursor-pointer ${s.width} ${t.rotate}`}
    >
      <span aria-hidden="true" className="absolute left-12 -top-[72px] h-[77px] w-[2px] bg-paper-edge" />
      <span aria-hidden="true" className="absolute right-12 -top-[72px] h-[77px] w-[2px] bg-paper-edge" />
      <Paper stitch={stitch} stitchSize={s.stitch} className={`flex items-center text-left ${s.paper} ${size === "board" ? t.row : "flex-col"}`}>
        {size === "board" && (
          <span
            aria-hidden="true"
            className={`relative flex-none flex items-center justify-center rounded-full font-display font-bold ${s.badge} ${t.badge}`}
          >
            {team}
          </span>
        )}
        <span className={`relative flex min-w-0 max-w-full flex-col ${size === "end" ? "items-center" : ""}`}>
          <span
            className={`font-black uppercase tracking-[0.08em] max-w-full break-words ${t.name}`}
            style={{ fontSize: nameFontSize(name, s.name) }}
          >
            {name}
          </span>
          <span className={`font-display font-bold leading-[0.95] ${s.points}`}>
            <AnimatedNumber value={points} /> {size === "board" && unit}
          </span>
          <span className={`font-bold text-ink-soft ${s.meta}`}>
            {size === "board" ? `${doors} låger · ${consolation < 0 ? "−" : "+"}${Math.abs(consolation)} trøst` : `point · ${doors} låger`}
          </span>
        </span>
      </Paper>
      {children}
    </button>
  );
};
