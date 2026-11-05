import { useState } from "react";
import { asset } from "../asset";
import { PillButton } from "../components/decor";
import { mediaFrame } from "./Standard";

export const PosterBody = ({ prompt, cropped }: { prompt: string; cropped: string }) => {
  const [revealed, setRevealed] = useState(false);

  return revealed ? (
    <div className="p-4">
      <img
        src={asset(cropped)}
        alt={prompt}
        className={`h-[520px] w-auto -rotate-1 ${mediaFrame}`}
      />
    </div>
  ) : (
    <>
      <p className="max-w-300 text-center font-display text-[110px] font-bold leading-none text-ink">
        {prompt}
      </p>
      <PillButton variant="team-1" onClick={() => setRevealed(true)}>
        <span className="material-symbols-outlined text-[44px]">play_arrow</span>
        Start
      </PillButton>
    </>
  );
};

export const PosterAnswer = ({ prompt, full }: { prompt: string; full: string }) => (
  <div className="p-4">
    <img src={asset(full)} alt={prompt} className={`max-h-[520px] w-auto ${mediaFrame}`} />
  </div>
);
