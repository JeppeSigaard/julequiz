import { useState } from "react";
import classNames from "classnames";
import { asset } from "../asset";
import { mediaFrame } from "./Standard";

export const VideoBody = ({
  video,
  prompt,
  caption,
}: {
  video: string;
  prompt: string;
  caption?: string;
}) => {
  const [ended, setEnded] = useState(false);

  return (
    <>
      <div className="relative flex items-center justify-center p-4">
        <video
          autoPlay
          controls={false}
          src={asset(video)}
          className={classNames(
            "h-[480px] max-w-[1000px] transition-opacity",
            mediaFrame,
            ended && "opacity-25"
          )}
          onEnded={() => setEnded(true)}
        />
        {/* Prompten vises først når klippet er slut; den kommer aldrig frem, hvis svaret vises før. */}
        <p
          className={classNames(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 px-10 text-center font-display text-[77px] font-bold leading-tight text-ink transition-opacity",
            ended ? "opacity-100" : "opacity-0"
          )}
        >
          {prompt}
        </p>
      </div>
      {caption !== undefined && <p className="text-[41px] text-ink-soft">{caption}</p>}
    </>
  );
};
