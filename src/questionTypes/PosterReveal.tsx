import { useState } from "react";
import { asset } from "../asset";

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
    <img src={asset(full)} alt={prompt} className="w-125" />
  ) : (
    <button onClick={() => setReveal(true)} className="cursor-pointer">
      <img src={asset(cropped)} alt={prompt} className="w-150" />
    </button>
  );
};
