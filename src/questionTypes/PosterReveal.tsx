import { useState } from "react";
import { asset } from "../asset";
import { mediaFrame } from "./Standard";

export const PosterAnswer = ({
  prompt,
  cropped,
  full,
}: {
  prompt: string;
  cropped: string;
  full: string;
}) => {
  const [reveal, setReveal] = useState(false);

  return reveal ? (
    <div className="p-4">
      <img src={asset(full)} alt={prompt} className={`max-h-[520px] w-auto ${mediaFrame}`} />
    </div>
  ) : (
    <button onClick={() => setReveal(true)} className="cursor-pointer p-4">
      <img
        src={asset(cropped)}
        alt={prompt}
        className={`h-auto max-h-[520px] w-150 -rotate-1 ${mediaFrame}`}
      />
    </button>
  );
};
